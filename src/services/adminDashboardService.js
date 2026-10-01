import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { normalizeProduct } from './productService.js';

/**
 * Fetches verified, real-time dashboard metrics and summary records directly from Supabase.
 * The Supabase database is the sole authoritative source of truth.
 * No mock data, offline fallback arrays, or static seed calculations are permitted.
 *
 * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
 */
export const getAdminDashboardOverview = async () => {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      error: 'Database connection is not configured.',
    };
  }

  try {
    // 1. Fetch Product Metrics from public.products
    const { data: rawProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, category, price, stock, is_active, image_url, created_at')
      .order('stock', { ascending: true });

    if (productsError) {
      console.error('Error querying products for admin dashboard:', productsError);
      return {
        success: false,
        error: `Unable to load dashboard data: ${productsError.message || 'Product query failed'}`,
      };
    }

    const products = rawProducts || [];
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.is_active === true).length;
    const outOfStockProducts = products.filter((p) => Number(p.stock || 0) <= 0).length;
    const lowStockProducts = products.filter(
      (p) => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 5
    ).length;

    // Low stock items list strictly matching: stock > 0 AND stock <= 5 (limit 10)
    const lowStockList = products
      .filter((p) => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 5)
      .slice(0, 10)
      .map((p) => normalizeProduct(p));

    // 2. Fetch Order Metrics from public.orders
    const { data: rawOrders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        shipping_name,
        shipping_phone,
        shipping_city,
        status,
        total,
        subtotal,
        created_at,
        order_items (
          id,
          product_name,
          quantity,
          subtotal
        )
      `)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error querying orders for admin dashboard:', ordersError);
      return {
        success: false,
        error: `Unable to load dashboard data: ${ordersError.message || 'Order query failed'}`,
      };
    }

    const orders = rawOrders || [];
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const confirmedOrders = orders.filter((o) => o.status === 'confirmed').length;
    const completedOrders = orders.filter((o) => o.status === 'completed').length;
    const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;
    const rejectedOrders = orders.filter((o) => o.status === 'rejected').length;

    // 3. Format Recent Orders (limit 10, ordered by created_at DESC)
    const recentOrders = orders.slice(0, 10).map((o) => {
      const items = o.order_items || [];
      const itemsCount = items.reduce((acc, curr) => acc + Number(curr.quantity || 1), 0);
      return {
        id: o.id,
        userId: o.user_id,
        shippingName: o.shipping_name || 'Customer',
        shippingCity: o.shipping_city || 'N/A',
        status: o.status || 'pending',
        total: Number(o.total || 0),
        subtotal: Number(o.subtotal || 0),
        itemsCount,
        createdAt: o.created_at,
      };
    });

    return {
      success: true,
      data: {
        products: {
          total: totalProducts,
          active: activeProducts,
          outOfStock: outOfStockProducts,
          lowStock: lowStockProducts,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          confirmed: confirmedOrders,
          completed: completedOrders,
          cancelled: cancelledOrders,
          rejected: rejectedOrders,
        },
        recentOrders,
        lowStockList,
      },
    };
  } catch (err) {
    console.error('Exception in getAdminDashboardOverview:', err);
    return {
      success: false,
      error: 'Unable to load dashboard data.',
    };
  }
};

export default {
  getAdminDashboardOverview,
};
