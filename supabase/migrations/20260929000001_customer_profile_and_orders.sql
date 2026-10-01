-- ==============================================================================
-- SHOPEE E-COMMERCE: CUSTOMER ORDER CANCELLATION & RLS ENHANCEMENT (PHASE 7)
-- Migration: 20260929000001_customer_profile_and_orders.sql
-- Description: Adds secure RLS policy and transactional RPC for customer order cancellation.
-- ==============================================================================

-- 1. RLS Policy allowing customers to cancel their own pending/confirmed orders
DROP POLICY IF EXISTS "Users can cancel own pending orders" ON public.orders;
CREATE POLICY "Users can cancel own pending orders"
  ON public.orders FOR UPDATE
  USING (
    auth.uid() = user_id
    AND status IN ('pending', 'confirmed')
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'cancelled'
  );

-- 2. Secure RPC for customer order cancellation
CREATE OR REPLACE FUNCTION public.cancel_customer_order(
  p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_order RECORD;
BEGIN
  -- Derive user strictly from auth session
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: You must be logged in to cancel an order.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Verify order exists, belongs to user, and is currently pending or confirmed
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or you do not have permission to modify it.'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_order.status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'Order cannot be cancelled because it is already %.', v_order.status
      USING ERRCODE = 'P0003';
  END IF;

  -- Update status to cancelled
  UPDATE public.orders
  SET
    status = 'cancelled',
    updated_at = NOW()
  WHERE id = p_order_id AND user_id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', 'cancelled',
    'message', 'Order has been cancelled successfully.'
  );
END;
$$;

-- Revoke public access and grant to authenticated role
REVOKE ALL ON FUNCTION public.cancel_customer_order(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_customer_order(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.cancel_customer_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_customer_order(UUID) TO service_role;
