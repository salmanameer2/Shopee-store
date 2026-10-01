-- ==============================================================================
-- SHOPEE E-COMMERCE: SECURE ADMIN ORDER STATUS TRANSITION RPC (PHASE 11 CORRECTION)
-- Migration: 20260930000000_admin_order_status_transition.sql
-- Description: Enforces server-side order lifecycle state transitions for administrators.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.admin_update_order_status(
  p_order_id UUID,
  p_new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_is_admin BOOLEAN;
  v_order RECORD;
  v_allowed_transition BOOLEAN := FALSE;
BEGIN
  -- 1. Derive authenticated user strictly from Supabase session
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: You must be logged in to update order status.'
      USING ERRCODE = 'P0001';
  END IF;

  -- 2. Verify admin role in public.profiles using existing public.is_admin()
  v_is_admin := public.is_admin();
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Forbidden: Only administrators can execute order status transitions.'
      USING ERRCODE = 'P0002';
  END IF;

  -- 3. Load order from public.orders
  SELECT id, status INTO v_order
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found.'
      USING ERRCODE = 'P0003';
  END IF;

  -- 4. If current status already equals requested status, return early
  IF v_order.status = p_new_status THEN
    RETURN jsonb_build_object(
      'success', true,
      'order_id', p_order_id,
      'status', p_new_status,
      'message', 'Order status is already ' || p_new_status || '.'
    );
  END IF;

  -- 5. Strict Server-Side State Machine Validation
  -- pending -> confirmed, rejected, cancelled
  -- confirmed -> completed, cancelled
  -- completed -> terminal (no transitions allowed)
  -- rejected -> terminal (no transitions allowed)
  -- cancelled -> terminal (no transitions allowed)
  IF v_order.status = 'pending' AND p_new_status IN ('confirmed', 'rejected', 'cancelled') THEN
    v_allowed_transition := TRUE;
  ELSIF v_order.status = 'confirmed' AND p_new_status IN ('completed', 'cancelled') THEN
    v_allowed_transition := TRUE;
  END IF;

  IF NOT v_allowed_transition THEN
    RAISE EXCEPTION 'Invalid status transition: Cannot change order status from "%" to "%".', v_order.status, p_new_status
      USING ERRCODE = 'P0004';
  END IF;

  -- 6. Update orders.status and updated_at ONLY.
  -- CRITICAL: Absolutely NO stock deduction or restoration is performed.
  -- Customer delivery notes (orders.notes) are completely preserved untouched.
  UPDATE public.orders
  SET
    status = p_new_status,
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', p_new_status,
    'message', 'Order status updated to ' || p_new_status || ' successfully.'
  );
END;
$$;

-- Security hardening: revoke from public/anon, grant only to authenticated and service_role
REVOKE ALL ON FUNCTION public.admin_update_order_status(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_order_status(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_update_order_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_order_status(UUID, TEXT) TO service_role;
