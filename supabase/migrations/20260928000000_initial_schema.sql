-- ==============================================================================
-- SHOPEE E-COMMERCE DATABASE INITIAL SCHEMA & SEED MIGRATION (PHASE 3)
-- Description: Complete fresh database setup for Supabase PostgreSQL
-- Includes: Extensions, Functions, Triggers, Tables, Indexes, RLS Policies, Storage & 20 Seed Products
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. REUSABLE FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Trigger function for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Secure admin verification helper (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 3. PROFILES TABLE (Linked to auth.users)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger function for auto-creating profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'customer' -- Explicitly enforce customer role on signup (no privilege escalation)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hook into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. PRODUCTS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Men', 'Women', 'Kids', 'Electronic Gadgets')),
  brand TEXT,
  description TEXT,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  original_price NUMERIC(12,2) CHECK (original_price >= 0),
  discount NUMERIC(5,2) CHECK (discount >= 0 AND discount <= 100),
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  rating NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5.00),
  reviews_count INTEGER NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_new BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for products updated_at
DROP TRIGGER IF EXISTS tr_products_updated_at ON public.products;
CREATE TRIGGER tr_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Product Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- ==============================================================================
-- 5. ORDERS & ORDER ITEMS TABLES (Cash on Delivery)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  shipping_name TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  notes TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery' CHECK (payment_method IN ('cash_on_delivery')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  shipping_fee NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (shipping_fee >= 0),
  discount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
  total NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for orders updated_at
DROP TRIGGER IF EXISTS tr_orders_updated_at ON public.orders;
CREATE TRIGGER tr_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Snapshot order items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_price NUMERIC(12,2) NOT NULL CHECK (product_price >= 0),
  selected_size TEXT,
  selected_color TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- ==============================================================================
-- 6. CART ITEMS TABLE (For Persistent User Carts in Phase 5)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  selected_size TEXT,
  selected_color TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

DROP TRIGGER IF EXISTS tr_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER tr_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);

-- ==============================================================================
-- 7. CONTACT SUBMISSIONS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tr_contact_submissions_updated_at ON public.contact_submissions;
CREATE TRIGGER tr_contact_submissions_updated_at
  BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- 8.1 PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'customer'); -- Prevent self-elevation to admin

DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
CREATE POLICY "Admins have full access to profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- 8.2 PRODUCTS POLICIES
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products"
  ON public.products FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins have full management on products" ON public.products;
CREATE POLICY "Admins have full management on products"
  ON public.products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8.3 ORDERS POLICIES
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL
  USING (public.is_admin());

-- 8.4 ORDER ITEMS POLICIES
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
CREATE POLICY "Users can insert own order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- 8.5 CART ITEMS POLICIES
DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart_items;
CREATE POLICY "Users can view own cart items"
  ON public.cart_items FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cart items" ON public.cart_items;
CREATE POLICY "Users can insert own cart items"
  ON public.cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart_items;
CREATE POLICY "Users can update own cart items"
  ON public.cart_items FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart_items;
CREATE POLICY "Users can delete own cart items"
  ON public.cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- 8.6 CONTACT SUBMISSIONS POLICIES
DROP POLICY IF EXISTS "Anyone can submit contact message" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact message"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins can view and manage contact submissions" ON public.contact_submissions;
CREATE POLICY "Admins can view and manage contact submissions"
  ON public.contact_submissions FOR ALL
  USING (public.is_admin());

-- ==============================================================================
-- 9. SUPABASE STORAGE BUCKET PREPARATION (product-images)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Public read policy for storage
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;
CREATE POLICY "Product images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Admin upload policy for storage
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

-- ==============================================================================
-- 10. SEED DATA: THE INITIAL 20 PRODUCTS (5 Men, 5 Women, 5 Kids, 5 Gadgets)
-- ==============================================================================

INSERT INTO public.products (
  id, name, category, brand, description, price, original_price, discount,
  image_url, stock, rating, reviews_count, sizes, colors, tags, featured, is_new, is_active
) VALUES
-- ==================== MEN (5) ====================
(
  'e1a10001-0000-0000-0000-000000000001',
  'Classic Oxford Slim-Fit Button Down Shirt',
  'Men',
  'Shopee Studio',
  'Crafted from 100% breathable organic cotton with a refined button-down collar and tailored silhouette. Ideal for both smart-casual office wear and weekend dinners.',
  3899.00,
  5499.00,
  29.00,
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop',
  18,
  4.80,
  148,
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  ARRAY['Sky Blue', 'Crisp White', 'Charcoal Grey'],
  ARRAY['Best Seller', 'Formal', 'Cotton'],
  TRUE,
  TRUE,
  TRUE
),
(
  'e1a10001-0000-0000-0000-000000000002',
  'Vintage Wash Straight-Leg Denim Jeans',
  'Men',
  'UrbanCraft',
  'Premium heavyweight 13oz stretch denim treated with an authentic vintage enzyme wash. Features reinforced bar-tack stitching and antique brass hardware.',
  5299.00,
  6999.00,
  24.00,
  'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1000&auto=format&fit=crop',
  14,
  4.70,
  92,
  ARRAY['30/32', '32/32', '34/32', '36/32'],
  ARRAY['Washed Indigo', 'Deep Charcoal'],
  ARRAY['Denim', 'Casual'],
  FALSE,
  FALSE,
  TRUE
),
(
  'e1a10001-0000-0000-0000-000000000003',
  'Apex Flow Lightweight Aerodynamic Sneakers',
  'Men',
  'AeroAthletics',
  'Engineered breathable mesh upper with responsive EVA foam cushioning and anti-slip rubber outsoles. Designed for all-day comfort and energetic movement.',
  8499.00,
  11999.00,
  29.00,
  'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1000&auto=format&fit=crop',
  8,
  4.90,
  230,
  ARRAY['40 EU', '41 EU', '42 EU', '43 EU', '44 EU', '45 EU'],
  ARRAY['Triple White', 'Phantom Black', 'Grey Pulse'],
  ARRAY['Footwear', 'Trending', 'Sport'],
  TRUE,
  TRUE,
  TRUE
),
(
  'e1a10001-0000-0000-0000-000000000004',
  'Water-Resistant City Commuter Bomber Jacket',
  'Men',
  'Shopee Studio',
  'A modern minimalist bomber jacket lined with temperature-regulating satin and finished with a durable water-repellent micro-twill exterior.',
  9999.00,
  13999.00,
  28.00,
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop',
  3,
  4.60,
  64,
  ARRAY['M', 'L', 'XL'],
  ARRAY['Olive Green', 'Midnight Navy', 'Matte Black'],
  ARRAY['Outerwear', 'Winter', 'Limited'],
  FALSE,
  FALSE,
  TRUE
),
(
  'e1a10001-0000-0000-0000-000000000005',
  'Chronograph Minimalist Sapphire Steel Wristwatch',
  'Men',
  'Vanguard Timepieces',
  'High-precision Japanese quartz movement housed in surgical 316L stainless steel with scratch-resistant sapphire crystal glass and genuine leather strap.',
  14499.00,
  18999.00,
  23.00,
  'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=1000&auto=format&fit=crop',
  0,
  4.90,
  175,
  ARRAY['One Size (42mm)'],
  ARRAY['Silver / Brown Leather', 'All Black'],
  ARRAY['Luxury', 'Accessories', 'Steel'],
  TRUE,
  FALSE,
  TRUE
),

-- ==================== WOMEN (5) ====================
(
  'e1a10002-0000-0000-0000-000000000001',
  'Pleated Tiered Floral Midi Chiffon Dress',
  'Women',
  'Aura Couture',
  'Flowing airy chiffon dress with delicate botanic print, elasticated smocked bodice, and graceful tiered A-line skirt designed for effortless daytime poise.',
  6499.00,
  8999.00,
  27.00,
  'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=1000&auto=format&fit=crop',
  15,
  4.90,
  184,
  ARRAY['XS', 'S', 'M', 'L'],
  ARRAY['Blush Blossom', 'Sage Green', 'Ivory Floral'],
  ARRAY['Dresses', 'Summer', 'Trending'],
  TRUE,
  TRUE,
  TRUE
),
(
  'e1a10002-0000-0000-0000-000000000002',
  'Structured Vegan Leather Crossbody Handbag',
  'Women',
  'Maison Luxe',
  'Architectural silhouette made from premium scratch-resistant vegan saffiano leather, featuring gold-toned lock clasp and adjustable shoulder strap.',
  7899.00,
  10499.00,
  25.00,
  'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000&auto=format&fit=crop',
  9,
  4.80,
  120,
  ARRAY['Medium (26x18x8cm)'],
  ARRAY['Caramel Tan', 'Burgundy', 'Noir Black'],
  ARRAY['Bags', 'Accessories', 'Leather'],
  TRUE,
  FALSE,
  TRUE
),
(
  'e1a10002-0000-0000-0000-000000000003',
  'CloudKnit Platform Lifestyle Runners',
  'Women',
  'AeroAthletics',
  'Chunky elevated platform silhouette with lightweight foam core and breathable dual-knit upper. Matches effortlessly with denim and athleisure.',
  7299.00,
  9499.00,
  23.00,
  'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1000&auto=format&fit=crop',
  22,
  4.70,
  88,
  ARRAY['36 EU', '37 EU', '38 EU', '39 EU', '40 EU'],
  ARRAY['Rose Dust', 'Pure Cream', 'Chalk White'],
  ARRAY['Shoes', 'Sneakers'],
  FALSE,
  TRUE,
  TRUE
),
(
  'e1a10002-0000-0000-0000-000000000004',
  'Oversized Silk-Blend Relaxed Casual Blouse',
  'Women',
  'Aura Couture',
  'Drapey mulberry silk-viscose blend with wide cuff sleeves, mother-of-pearl buttons, and a clean curved hem for tucked or untucked styling.',
  4599.00,
  5999.00,
  23.00,
  'https://images.unsplash.com/photo-1551803091-e20673f15770?q=80&w=1000&auto=format&fit=crop',
  11,
  4.60,
  71,
  ARRAY['S', 'M', 'L', 'XL'],
  ARRAY['Champagne Pearl', 'Terracotta', 'Sky Blue'],
  ARRAY['Tops', 'Casual', 'Silk'],
  FALSE,
  FALSE,
  TRUE
),
(
  'e1a10002-0000-0000-0000-000000000005',
  'Rose Gold Milanese Mesh Slim Dial Watch',
  'Women',
  'Vanguard Timepieces',
  'Ultra-thin 6mm case with shimmering sunray dial, minimalist indices, and flexible magnetic Milanese steel mesh strap that fits any wrist perfectly.',
  11999.00,
  15999.00,
  25.00,
  'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=1000&auto=format&fit=crop',
  7,
  4.90,
  160,
  ARRAY['One Size (34mm)'],
  ARRAY['Rose Gold', 'Silver Frost', 'Champagne Gold'],
  ARRAY['Watches', 'Jewelry', 'Best Seller'],
  TRUE,
  FALSE,
  TRUE
),

-- ==================== KIDS (5) ====================
(
  'e1a10003-0000-0000-0000-000000000001',
  'Organic Cotton Dinosaur Graphic Hoodie Set',
  'Kids',
  'LittleShopee',
  'Ultra-soft fleece hoodie and matching jogger pants crafted from GOTS certified organic cotton. Features fun textured 3D spine details on the hood.',
  3499.00,
  4799.00,
  27.00,
  'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=1000&auto=format&fit=crop',
  25,
  4.90,
  114,
  ARRAY['2-3 Yrs', '3-4 Yrs', '4-5 Yrs', '6-7 Yrs', '8-9 Yrs'],
  ARRAY['Forest Green', 'Sunburst Yellow', 'Navy Dino'],
  ARRAY['Kids Apparel', 'Hoodie', 'Organic'],
  TRUE,
  TRUE,
  TRUE
),
(
  'e1a10003-0000-0000-0000-000000000002',
  'ActivePlay Flexible Light-Up Kids Sneakers',
  'Kids',
  'LittleShopee',
  'Easy dual hook-and-loop Velcro straps with cushioned ankle collars and impact-activated LED light soles made with non-marking rubber.',
  3999.00,
  5299.00,
  24.00,
  'https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=80&w=1000&auto=format&fit=crop',
  16,
  4.80,
  95,
  ARRAY['26 EU', '28 EU', '30 EU', '32 EU', '34 EU'],
  ARRAY['Cosmic Blue', 'Electric Pink', 'Neon Lime'],
  ARRAY['Kids Shoes', 'Light-up', 'Velcro'],
  FALSE,
  FALSE,
  TRUE
),
(
  'e1a10003-0000-0000-0000-000000000003',
  'Ergonomic Waterproof Astronaut School Backpack',
  'Kids',
  'Explorer Junior',
  'Designed by pediatric orthopedists with cushioned S-curve shoulder straps, chest clip, reflective safety strips, and multi-compartment lunch pocket.',
  2999.00,
  3999.00,
  25.00,
  'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1000&auto=format&fit=crop',
  19,
  4.70,
  82,
  ARRAY['Capacity 18L'],
  ARRAY['Space Navy', 'Galaxy Purple', 'Rocket Red'],
  ARRAY['Bags', 'School', 'Ergonomic'],
  TRUE,
  TRUE,
  TRUE
),
(
  'e1a10003-0000-0000-0000-000000000004',
  'STEM Magnetic Building Blocks Creative Set (108 Pcs)',
  'Kids',
  'MindBuild',
  'Non-toxic ultrasonic sealed magnetic geometric tiles that promote 3D spatial intelligence, engineering creativity, and hours of collaborative play.',
  4999.00,
  6999.00,
  28.00,
  'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=1000&auto=format&fit=crop',
  12,
  4.90,
  210,
  ARRAY['108 Pieces Deluxe Box'],
  ARRAY['Rainbow Vibrant'],
  ARRAY['Toys', 'STEM', 'Educational'],
  TRUE,
  FALSE,
  TRUE
),
(
  'e1a10003-0000-0000-0000-000000000005',
  'Kids Polarized Flexible Silicone Sunglasses',
  'Kids',
  'LittleShopee',
  'Virtually unbreakable flexible silicone frames with 100% UV400 polarized scratch-resistant lenses and an elastic head-strap for active outdoor fun.',
  1499.00,
  1999.00,
  25.00,
  'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1000&auto=format&fit=crop',
  30,
  4.60,
  46,
  ARRAY['Ages 3-8 Yrs'],
  ARRAY['Ocean Teal', 'Coral Peach', 'Matte Black'],
  ARRAY['Accessories', 'Eyewear', 'UV Protection'],
  FALSE,
  FALSE,
  TRUE
),

-- ==================== ELECTRONIC GADGETS (5) ====================
(
  'e1a10004-0000-0000-0000-000000000001',
  'SonicPro True Wireless ANC Noise-Cancelling Earbuds',
  'Electronic Gadgets',
  'SonicAcoustics',
  'Hybrid Active Noise Cancellation up to 42dB with transparency mode, high-res audio LDAC support, wireless charging case, and 38-hour battery longevity.',
  8999.00,
  12999.00,
  30.00,
  'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=1000&auto=format&fit=crop',
  14,
  4.90,
  312,
  ARRAY['Universal Fit (S/M/L Tips Included)'],
  ARRAY['Matte Black', 'Arctic White', 'Midnight Blue'],
  ARRAY['Audio', 'Wireless', 'ANC', 'Best Seller'],
  TRUE,
  TRUE,
  TRUE
),
(
  'e1a10004-0000-0000-0000-000000000002',
  'AeroWatch Ultra 1.96-inch AMOLED Smartwatch',
  'Electronic Gadgets',
  'TechPulse',
  'Vivid always-on AMOLED display with aerospace titanium bezel, dual-band GPS, continuous SpO2 and heart-rate tracking, Bluetooth calling, and IP68 waterproof rating.',
  12499.00,
  17999.00,
  30.00,
  'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=1000&auto=format&fit=crop',
  10,
  4.80,
  228,
  ARRAY['49mm Case'],
  ARRAY['Titanium Orange Band', 'Midnight Black', 'Starlight Silver'],
  ARRAY['Smartwatch', 'Fitness', 'GPS'],
  TRUE,
  TRUE,
  TRUE
),
(
  'e1a10004-0000-0000-0000-000000000003',
  'BoomBox 360 IPX7 Waterproof Bluetooth Speaker',
  'Electronic Gadgets',
  'SonicAcoustics',
  'Omnidirectional 360-degree room-filling acoustic sound with punchy deep dual passive bass radiators, customizable RGB beat light, and 24-hour party battery.',
  6999.00,
  9499.00,
  26.00,
  'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=1000&auto=format&fit=crop',
  20,
  4.70,
  140,
  ARRAY['Compact Portable (20W Output)'],
  ARRAY['Graphite Grey', 'Army Camo', 'Sunset Orange'],
  ARRAY['Speaker', 'Bluetooth', 'Waterproof'],
  FALSE,
  FALSE,
  TRUE
),
(
  'e1a10004-0000-0000-0000-000000000004',
  'MagCharge 20000mAh 65W PD Fast Power Bank',
  'Electronic Gadgets',
  'VoltGrid',
  'High-density airline-approved lithium polymer battery with 65W Power Delivery laptop charging, Qi wireless magnetic snap, and real-time digital LED power status.',
  7499.00,
  9999.00,
  25.00,
  'https://images.unsplash.com/photo-1609592426505-1a84f33bfbe4?q=80&w=1000&auto=format&fit=crop',
  15,
  4.80,
  198,
  ARRAY['20,000 mAh High Capacity'],
  ARRAY['Space Grey Metal', 'Matte Carbon'],
  ARRAY['Charging', 'PowerBank', 'FastCharge'],
  FALSE,
  FALSE,
  TRUE
),
(
  'e1a10004-0000-0000-0000-000000000005',
  'StudioPro Over-Ear Hi-Res Wireless Headphones',
  'Electronic Gadgets',
  'SonicAcoustics',
  'Custom 45mm neodymium drivers tuned for studio precision. Features memory foam acoustic earcups, multi-point device switching, and 50 hours playtime.',
  18999.00,
  24999.00,
  24.00,
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop',
  6,
  4.90,
  285,
  ARRAY['Over-Ear Adjustable Headband'],
  ARRAY['Matte Obsidian', 'Silver Birch', 'Midnight Navy'],
  ARRAY['Headphones', 'Audiophile', 'Hi-Res', 'Trending'],
  TRUE,
  FALSE,
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  brand = EXCLUDED.brand,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  discount = EXCLUDED.discount,
  image_url = EXCLUDED.image_url,
  stock = EXCLUDED.stock,
  rating = EXCLUDED.rating,
  reviews_count = EXCLUDED.reviews_count,
  sizes = EXCLUDED.sizes,
  colors = EXCLUDED.colors,
  tags = EXCLUDED.tags,
  featured = EXCLUDED.featured,
  is_new = EXCLUDED.is_new,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
