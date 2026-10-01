import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import MainLayout from '../components/layout/MainLayout.jsx';
import AdminLayout from '../admin/AdminLayout.jsx';

// Route Guards
import ProtectedRoute from './ProtectedRoute.jsx';
import PublicOnlyRoute from './PublicOnlyRoute.jsx';
import AdminProtectedRoute from './AdminProtectedRoute.jsx';

// Customer Storefront & Content Pages
import Home from '../pages/Home.jsx';
import Products from '../pages/Products.jsx';
import CategoryPage from '../pages/CategoryPage.jsx';
import ProductDetails from '../pages/ProductDetails.jsx';
import About from '../pages/About.jsx';
import Contact from '../pages/Contact.jsx';
import Cart from '../pages/Cart.jsx';
import Checkout from '../pages/Checkout.jsx';
import OrderSuccess from '../pages/OrderSuccess.jsx';
import Login from '../pages/Login.jsx';
import Signup from '../pages/Signup.jsx';
import Profile from '../pages/Profile.jsx';
import Orders from '../pages/Orders.jsx';
import OrderDetails from '../pages/OrderDetails.jsx';
import NotFound from '../pages/NotFound.jsx';

// Admin Pages (Strictly isolated from customer storefront)
import AdminLogin from '../admin/AdminLogin.jsx';
import AdminDashboard from '../admin/AdminDashboard.jsx';
import AdminProducts from '../admin/AdminProducts.jsx';
import AdminOrders from '../admin/AdminOrders.jsx';
import AdminInventory from '../admin/AdminInventory.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Admin Login (Completely separated from customer storefront) */}
      <Route path="admin/login" element={<AdminLogin />} />

      {/* 2. Admin-Only Protected Routes (Requires authenticated admin with role === 'admin') */}
      <Route
        path="admin"
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="inventory" element={<AdminInventory />} />
      </Route>

      {/* 3. Customer Storefront Routes (Wrapped in customer MainLayout with customer Navbar & Footer) */}
      <Route path="/" element={<MainLayout />}>
        {/* Public Storefront Content */}
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="category/:categorySlug" element={<CategoryPage />} />
        <Route path="product/:id" element={<ProductDetails />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="cart" element={<Cart />} />

        {/* Public-Only Customer Auth Routes (Redirects logged-in users to /) */}
        <Route
          path="login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="signup"
          element={
            <PublicOnlyRoute>
              <Signup />
            </PublicOnlyRoute>
          }
        />

        {/* Protected Customer Routes (Redirects unauthenticated users to /login) */}
        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="order-success/:orderId"
          element={
            <ProtectedRoute>
              <OrderSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="order-success"
          element={
            <ProtectedRoute>
              <OrderSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders/:orderId"
          element={
            <ProtectedRoute>
              <OrderDetails />
            </ProtectedRoute>
          }
        />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
