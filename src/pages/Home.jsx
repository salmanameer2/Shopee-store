import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  FiArrowRight,
  FiTrendingUp,
  FiTruck,
  FiShield,
  FiRotateCcw,
  FiHeadphones,
  FiChevronRight,
  FiClock,
  FiCheckCircle,
} from 'react-icons/fi';
import Container from '../components/common/Container.jsx';
import Button from '../components/common/Button.jsx';
import SectionHeading from '../components/common/SectionHeading.jsx';
import ProductGrid from '../components/product/ProductGrid.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ScrollReveal, { StaggerContainer, StaggerItem } from '../components/common/ScrollReveal.jsx';
import { categories } from '../assets/assets.js';
import { getNewArrivals, getBestSellers } from '../services/productService.js';
import { useCart } from '../context/CartContext.jsx';

export default function Home() {
  const { addToCart, toastMessage } = useCart();
  const navigate = useNavigate();
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Flash sale countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    hours: 14,
    minutes: 32,
    seconds: 45,
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchHomeProducts() {
      try {
        setLoading(true);
        const [arrivalsData, bestSellersData] = await Promise.all([
          getNewArrivals(4),
          getBestSellers(4),
        ]);

        if (isMounted) {
          setNewArrivals(arrivalsData);
          setBestSellers(bestSellersData);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading homepage products:', err);
          setError('Unable to load latest products from Supabase');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchHomeProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddToCart = async (product) => {
    const res = await addToCart(product, { quantity: 1 });
    if (res.requireLogin) {
      navigate('/login');
    }
  };

  return (
    <div className="space-y-16 pb-16 overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 sm:right-10 z-50 bg-neutral-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm border border-white/10"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. HERO SECTION */}
      <section className="pt-6 sm:pt-10">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-[#F4F4F6] border border-neutral-200/70 p-6 sm:p-12 lg:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Hero Left Content */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-6 space-y-6 z-10"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[#FF5722] text-xs font-bold shadow-sm border border-neutral-200/60 uppercase tracking-wider"
                >
                  <FiTrendingUp className="w-3.5 h-3.5" /> Trending Now &bull; Supabase Live
                </motion.div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 leading-[1.1] text-balance">
                  Discover Products <br />
                  <span className="text-neutral-800">You'll Love</span>
                </h1>

                <p className="text-neutral-600 text-sm sm:text-base lg:text-lg leading-relaxed max-w-lg">
                  Shop the latest trending fashion, kids essentials, and high-tech electronic gadgets curated for modern lifestyles and connected directly to Supabase.
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <Link to="/products">
                    <Button
                      size="lg"
                      variant="primary"
                      className="shadow-lg shadow-[#FF5722]/30 hover:shadow-xl hover:shadow-[#FF5722]/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Shop Now <FiArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/category/electronic-gadgets">
                    <Button
                      size="lg"
                      variant="outline"
                      className="hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Explore Gadgets
                    </Button>
                  </Link>
                </div>

                {/* Social Proof */}
                <div className="pt-4 flex items-center gap-3 text-xs text-neutral-600">
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-sm">
                      A
                    </div>
                    <div className="w-7 h-7 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-sm">
                      S
                    </div>
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-sm">
                      Z
                    </div>
                    <div className="w-7 h-7 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-sm">
                      M
                    </div>
                  </div>
                  <span className="font-medium">
                    Loved by <strong className="text-neutral-900">50,000+</strong> customers across Pakistan
                  </span>
                </div>
              </motion.div>

              {/* Hero Right Visual Showcase */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-6 relative flex items-center justify-center"
              >
                <div className="relative w-full max-w-md aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-neutral-200 group">
                  <img
                    src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop"
                    alt="Shopee Fashion Hero Model"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-[#FF5722] px-2.5 py-1 rounded-md shadow-sm">
                      2026 Season
                    </span>
                    <h3 className="text-lg font-bold mt-1.5 drop-shadow-sm">Urban Lifestyle Essentials</h3>
                  </div>
                </div>

                {/* Floating Widget 1 with gentle hover float */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.7 }}
                  whileHover={{ y: -4 }}
                  className="hidden sm:flex absolute -top-4 -left-6 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-neutral-100 items-center gap-3 cursor-default"
                >
                  <img
                    src="https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=150&auto=format&fit=crop"
                    alt="Aero Sneaker"
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">Men's Footwear</span>
                    <span className="text-xs font-bold text-neutral-900">Apex Flow Runners</span>
                    <span className="text-xs font-black text-[#FF5722] block">Rs. 8,499</span>
                  </div>
                </motion.div>

                {/* Floating Widget 2 */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.7 }}
                  whileHover={{ y: -4 }}
                  className="hidden sm:flex absolute -bottom-4 -right-4 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-neutral-100 items-center gap-3 cursor-default"
                >
                  <img
                    src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=150&auto=format&fit=crop"
                    alt="Headphones"
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">Hi-Res Audio</span>
                    <span className="text-xs font-bold text-neutral-900">StudioPro Over-Ear</span>
                    <span className="text-xs font-black text-[#FF5722] block">Rs. 18,999</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. TRUST / VALUE PROPOSITION BAR */}
      <section>
        <Container>
          <ScrollReveal variant="fade-up" delay={0.1}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white rounded-3xl border border-neutral-200/80 shadow-sm">
              <div className="flex items-center gap-3 p-2 group">
                <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#FF5722] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <FiTruck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900">Free Shipping</h4>
                  <p className="text-[11px] text-neutral-500">Orders above Rs. 2,000</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 group">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <FiShield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900">Secure Payments</h4>
                  <p className="text-[11px] text-neutral-500">100% safe checkout & COD</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 group">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <FiRotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900">Easy Returns</h4>
                  <p className="text-[11px] text-neutral-500">7-day replacement policy</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 group">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <FiHeadphones className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900">24/7 Support</h4>
                  <p className="text-[11px] text-neutral-500">Instant WhatsApp & phone</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </section>

      {/* 3. SHOP BY CATEGORIES */}
      <section>
        <Container>
          <ScrollReveal variant="fade-up">
            <SectionHeading
              title="Shop By Categories"
              subtitle="Curated Departments"
              actionText="View All Products"
              actionLink="/products"
            />
          </ScrollReveal>

          <StaggerContainer
            staggerDelay={0.08}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {categories.map((category) => (
              <StaggerItem key={category.id}>
                <Link
                  to={`/category/${category.slug}`}
                  className="group relative h-72 rounded-3xl overflow-hidden border border-neutral-200/80 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col justify-end p-6 block"
                >
                  <img
                    src={category.bannerImage}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/30 to-transparent" />

                  <div className="relative z-10 text-white space-y-1">
                    <span className="text-[11px] font-bold text-[#FF8A65] tracking-wider uppercase">
                      5 Products
                    </span>
                    <h3 className="text-xl font-bold tracking-tight group-hover:text-[#FF8A65] transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-xs text-neutral-300 line-clamp-1">
                      {category.description}
                    </p>
                    <div className="pt-2 flex items-center text-xs font-semibold text-white group-hover:translate-x-1.5 transition-transform duration-300">
                      <span>Shop Now</span>
                      <FiChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </Container>
      </section>

      {/* 4. NEW ARRIVALS (Fetched from Supabase productService) */}
      <section>
        <Container>
          <ScrollReveal variant="fade-up">
            <SectionHeading
              title="New Arrivals"
              subtitle="Fresh Picks From Supabase"
              actionText="View All New Arrivals"
              actionLink="/products"
            />
          </ScrollReveal>
          {loading ? (
            <LoadingSpinner fullPage={false} message="Loading new arrivals from Supabase..." />
          ) : error ? (
            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-center text-xs">
              {error}
            </div>
          ) : (
            <ProductGrid products={newArrivals} onAddToCart={handleAddToCart} columns={4} />
          )}
        </Container>
      </section>

      {/* 5. FLASH SALE PROMOTIONAL BANNER */}
      <section>
        <Container>
          <ScrollReveal variant="scale-up" duration={0.8}>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FF5722] via-[#E64A19] to-neutral-950 text-white p-8 sm:p-12 lg:p-14 shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                <div className="lg:col-span-7 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
                    <FiClock className="w-3.5 h-3.5" /> Limited Time Flash Deals
                  </div>

                  <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                    Summer Flash Sale <br />
                    <span className="text-amber-300">Up To 30% OFF</span>
                  </h2>

                  <p className="text-neutral-100 text-sm sm:text-base max-w-lg leading-relaxed">
                    Grab top-rated sneakers, chiffon dresses, audio gear, and kids outfits at discounted prices before stock runs out.
                  </p>

                  {/* Countdown Timer */}
                  <div className="flex items-center gap-3 pt-2">
                    <div className="text-center bg-black/40 backdrop-blur-md rounded-2xl px-3.5 py-2 min-w-[60px] border border-white/10">
                      <span className="text-xl sm:text-2xl font-black block tabular-nums">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-300 uppercase">Hours</span>
                    </div>
                    <span className="text-2xl font-bold">:</span>
                    <div className="text-center bg-black/40 backdrop-blur-md rounded-2xl px-3.5 py-2 min-w-[60px] border border-white/10">
                      <span className="text-xl sm:text-2xl font-black block tabular-nums">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-300 uppercase">Mins</span>
                    </div>
                    <span className="text-2xl font-bold">:</span>
                    <div className="text-center bg-black/40 backdrop-blur-md rounded-2xl px-3.5 py-2 min-w-[60px] border border-white/10">
                      <span className="text-xl sm:text-2xl font-black block tabular-nums">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-300 uppercase">Secs</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link to="/products">
                      <Button
                        size="lg"
                        className="bg-white text-neutral-900 hover:bg-neutral-100 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        Shop Sale Now <FiArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Promo Image Showcase */}
                <div className="lg:col-span-5 flex justify-center">
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    transition={{ duration: 0.4 }}
                    className="relative aspect-square w-72 sm:w-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800&auto=format&fit=crop"
                      alt="Sale Showcase"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-[#FF5722] text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
                      HOT DEAL
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </section>

      {/* 6. BEST SELLERS (Fetched from Supabase productService) */}
      <section>
        <Container>
          <ScrollReveal variant="fade-up">
            <SectionHeading
              title="Best Sellers"
              subtitle="Customer Favorites"
              actionText="Explore All Best Sellers"
              actionLink="/products"
            />
          </ScrollReveal>
          {loading ? (
            <LoadingSpinner fullPage={false} message="Loading best sellers..." />
          ) : (
            <ProductGrid products={bestSellers} onAddToCart={handleAddToCart} columns={4} />
          )}
        </Container>
      </section>
    </div>
  );
}
