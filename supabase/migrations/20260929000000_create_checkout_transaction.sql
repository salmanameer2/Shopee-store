-- ==============================================================================
-- SHOPEE E-COMMERCE: ATOMIC CHECKOUT TRANSACTION RPC (PHASE 6)
-- Migration: 20260929000000_create_checkout_transaction.sql
-- Description: Creates an atomic PostgreSQL transaction function for Cash on Delivery checkout.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.create_order_from_cart(
  p_shipping_name TEXT,
  p_shipping_phone TEXT,
  p_shipping_address TEXT,
  p_shipping_city TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_order_id UUID;
  v_cart_count INTEGER;
  v_subtotal NUMERIC(12,2) := 0.00;
  v_shipping_fee NUMERIC(12,2) := 0.00;
  v_discount NUMERIC(12,2) := 0.00;
  v_total NUMERIC(12,2) := 0.00;
  v_cart_item RECORD;
  v_item_subtotal NUMERIC(12,2);
  v_items_count INTEGER := 0;
BEGIN
  -- 1. Derive authenticated user strictly from Supabase session
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: You must be logged in to place an order.'
      USING ERRCODE = 'P0001';
  END IF;

  -- 2. Validate input shipping parameters
  IF p_shipping_name IS NULL OR length(trim(p_shipping_name)) = 0 THEN
    RAISE EXCEPTION 'Recipient full name is required.'
      USING ERRCODE = 'P0002';
  END IF;

  IF p_shipping_phone IS NULL OR length(trim(p_shipping_phone)) < 8 THEN
    RAISE EXCEPTION 'A valid contact phone number is required for Cash on Delivery.'
      USING ERRCODE = 'P0003';
  END IF;

  IF p_shipping_address IS NULL OR length(trim(p_shipping_address)) < 5 THEN
    RAISE EXCEPTION 'Complete street address is required for delivery.'
      USING ERRCODE = 'P0004';
  END IF;

  IF p_shipping_city IS NULL OR length(trim(p_shipping_city)) = 0 THEN
    RAISE EXCEPTION 'Delivery city is required.'
      USING ERRCODE = 'P0005';
  END IF;

  -- 3. Check that user's cart is not empty
  SELECT COUNT(*) INTO v_cart_count
  FROM public.cart_items
  WHERE user_id = v_user_id;

  IF v_cart_count = 0 THEN
    RAISE EXCEPTION 'Your cart is empty. Please add products before placing an order.'
      USING ERRCODE = 'P0006';
  END IF;

  -- 4. Lock products in a deterministic order (by product_id ASC)
  -- This prevents race conditions, overselling, and deadlocks during concurrent checkouts
  PERFORM p.id
  FROM public.products p
  JOIN public.cart_items c ON c.product_id = p.id
  WHERE c.user_id = v_user_id
  ORDER BY p.id ASC
  FOR UPDATE;

  -- 5. Calculate verified subtotal and validate all product stock & active statuses
  FOR v_cart_item IN
    SELECT
      c.id AS cart_item_id,
      c.product_id,
      c.selected_size,
      c.selected_color,
      c.quantity,
      p.name AS product_name,
      p.price AS current_price,
      p.stock AS current_stock,
      p.is_active
    FROM public.cart_items c
    JOIN public.products p ON c.product_id = p.id
    WHERE c.user_id = v_user_id
  LOOP
    -- Verify product is active
    IF v_cart_item.is_active IS NOT TRUE THEN
      RAISE EXCEPTION 'Product "%" is currently inactive and cannot be ordered.', v_cart_item.product_name
        USING ERRCODE = 'P0007';
    END IF;

    -- Verify stock availability
    IF v_cart_item.current_stock < v_cart_item.quantity THEN
      IF v_cart_item.current_stock <= 0 THEN
        RAISE EXCEPTION 'Product "%" has sold out.', v_cart_item.product_name
          USING ERRCODE = 'P0008';
      ELSE
        RAISE EXCEPTION 'Only % unit(s) of "%" available. You requested %.',
          v_cart_item.current_stock, v_cart_item.product_name, v_cart_item.quantity
          USING ERRCODE = 'P0009';
      END IF;
    END IF;

    -- Verified calculation directly from authoritative database price
    v_item_subtotal := ROUND((v_cart_item.current_price * v_cart_item.quantity)::numeric, 2);
    v_subtotal := v_subtotal + v_item_subtotal;
    v_items_count := v_items_count + v_cart_item.quantity;
  END LOOP;

  -- 6. Apply Phase 6 shipping & discount rules:
  -- shipping_fee = 0, discount = 0, total = subtotal
  v_shipping_fee := 0.00;
  v_discount := 0.00;
  v_total := ROUND((v_subtotal + v_shipping_fee - v_discount)::numeric, 2);

  -- 7. Insert master order row in public.orders
  INSERT INTO public.orders (
    user_id,
    shipping_name,
    shipping_phone,
    shipping_address,
    shipping_city,
    notes,
    payment_method,
    status,
    subtotal,
    shipping_fee,
    discount,
    total
  ) VALUES (
    v_user_id,
    trim(p_shipping_name),
    trim(p_shipping_phone),
    trim(p_shipping_address),
    trim(p_shipping_city),
    NULLIF(trim(p_notes), ''),
    'cash_on_delivery',
    'pending',
    v_subtotal,
    v_shipping_fee,
    v_discount,
    v_total
  )
  RETURNING id INTO v_order_id;

  -- 8. Insert snapshot rows into public.order_items & atomically deduct stock
  FOR v_cart_item IN
    SELECT
      c.product_id,
      c.selected_size,
      c.selected_color,
      c.quantity,
      p.name AS product_name,
      p.price AS current_price
    FROM public.cart_items c
    JOIN public.products p ON c.product_id = p.id
    WHERE c.user_id = v_user_id
  LOOP
    v_item_subtotal := ROUND((v_cart_item.current_price * v_cart_item.quantity)::numeric, 2);

    -- Insert item snapshot
    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      product_price,
      selected_size,
      selected_color,
      quantity,
      subtotal
    ) VALUES (
      v_order_id,
      v_cart_item.product_id,
      v_cart_item.product_name,
      v_cart_item.current_price,
      v_cart_item.selected_size,
      v_cart_item.selected_color,
      v_cart_item.quantity,
      v_item_subtotal
    );

    -- Deduct stock atomically (verified non-negative by step 5 and row lock)
    UPDATE public.products
    SET stock = stock - v_cart_item.quantity
    WHERE id = v_cart_item.product_id;
  END LOOP;

  -- 9. Clear customer's cart
  DELETE FROM public.cart_items
  WHERE user_id = v_user_id;

  -- 10. Return authoritative result as JSONB
  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'user_id', v_user_id,
    'shipping_name', trim(p_shipping_name),
    'shipping_phone', trim(p_shipping_phone),
    'shipping_address', trim(p_shipping_address),
    'shipping_city', trim(p_shipping_city),
    'payment_method', 'cash_on_delivery',
    'status', 'pending',
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping_fee,
    'discount', v_discount,
    'total', v_total,
    'items_count', v_items_count
  );
END;
$$;

-- Explicitly revoke public/anonymous access and grant only to authenticated users & service_role
REVOKE ALL ON FUNCTION public.create_order_from_cart(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_order_from_cart(TEXT, TEXT, TEXT, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_order_from_cart(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_from_cart(TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
