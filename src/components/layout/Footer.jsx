import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiShield,
  FiTruck,
  FiRotateCcw,
  FiHeadphones,
  FiMail,
  FiPhone,
  FiMapPin,
  FiArrowRight,
  FiDollarSign,
} from 'react-icons/fi';
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaYoutube,
} from 'react-icons/fa';
import Container from '../common/Container.jsx';
import { appConfig } from '../../assets/assets.js';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const trustBadges = [
    {
      icon: FiTruck,
      title: 'Free Shipping Nationwide',
      desc: 'On all orders above Rs. 2,000',
    },
    {
      icon: FiDollarSign,
      title: 'Cash on Delivery (COD)',
      desc: 'Pay at your doorstep with confidence',
    },
    {
      icon: FiRotateCcw,
      title: '7-Day Easy Returns',
      desc: 'Hassle-free money-back guarantee',
    },
    {
      icon: FiHeadphones,
      title: '24/7 Priority Support',
      desc: 'Dedicated helpline & WhatsApp care',
    },
  ];

  return (
    <footer className="bg-white border-t border-neutral-200 mt-20">
      {/* Trust & Guarantee Strip */}
      <div className="border-b border-neutral-100 py-10 bg-neutral-50/70">
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {trustBadges.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center text-[#FF5722] shadow-sm shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900">
                      {badge.title}
                    </h4>
                    <p className="text-xs text-neutral-500 mt-0.5 leading-snug">
                      {badge.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </div>

      {/* Main Footer Links */}
      <div className="py-14">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Brand column */}
            <div className="lg:col-span-2 space-y-4">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#FF5722] to-[#FF8A65] flex items-center justify-center text-white font-black text-xl shadow-sm">
                  S
                </div>
                <span className="text-2xl font-black tracking-tight text-neutral-900">
                  Shopee<span className="text-[#FF5722]">.</span>
                </span>
              </Link>
              <p className="text-sm text-neutral-600 max-w-sm leading-relaxed">
                Pakistan's premium online shopping destination for Men, Women, Kids, and Electronic Gadgets. Discover curated lifestyle essentials at authentic prices.
              </p>

              {/* Social icons */}
              <div className="flex items-center gap-2 pt-2">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-neutral-100 hover:bg-[#FF5722] hover:text-white text-neutral-600 flex items-center justify-center transition-colors text-xs"
                  aria-label="Shopee Facebook"
                >
                  <FaFacebookF />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-neutral-100 hover:bg-[#FF5722] hover:text-white text-neutral-600 flex items-center justify-center transition-colors text-xs"
                  aria-label="Shopee Instagram"
                >
                  <FaInstagram />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-neutral-100 hover:bg-[#FF5722] hover:text-white text-neutral-600 flex items-center justify-center transition-colors text-xs"
                  aria-label="Shopee Twitter"
                >
                  <FaTwitter />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-neutral-100 hover:bg-[#FF5722] hover:text-white text-neutral-600 flex items-center justify-center transition-colors text-xs"
                  aria-label="Shopee YouTube"
                >
                  <FaYoutube />
                </a>
              </div>
            </div>

            {/* Department Links */}
            <div>
              <h4 className="text-sm font-bold text-neutral-900 mb-4 tracking-tight">
                Shop Departments
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/category/men" className="text-neutral-600 hover:text-[#FF5722] transition-colors">
                    Men's Collection
                  </Link>
                </li>
                <li>
                  <Link to="/category/women" className="text-neutral-600 hover:text-[#FF5722] transition-colors">
                    Women's Collection
                  </Link>
                </li>
                <li>
                  <Link to="/category/kids" className="text-neutral-600 hover:text-[#FF5722] transition-colors">
                    Kids & Baby Wear
                  </Link>
                </li>
                <li>
                  <Link to="/category/electronic-gadgets" className="text-neutral-600 hover:text-[#FF5722] transition-colors">
                    Electronic Gadgets
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="text-neutral-600 hover:text-[#FF5722] transition-colors">
                    All 20 Catalog Items
                  </Link>
                </li>
              </ul>
            </div>

            {/* Customer Care */}
            <div>
              <h4 className="text-sm font-bold text-neutral-900 mb-4 tracking-tight">
                Customer Care
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/about" className="text-neutral-600 hover:text-[#FF5722] transition-colors">
                    About Shopee
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-neutral-600 hover:text-[#FF5722] transition-colors">
                    Contact Helpline
                  </Link>
                </li>
                <li>
                  <Link to="/orders" className="text-neutral-600 hover:text-[#FF5722] transition-colors">
                    Order Tracking
                  </Link>
                </li>
                <li>
                  <Link to="/cart" className="text-neutral-600 hover:text-[#FF5722] transition-colors">
                    Shopping Cart
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-neutral-600 hover:text-[#FF5722] transition-colors">
                    Customer Account
                  </Link>
                </li>
              </ul>
            </div>

            {/* Newsletter & Helpline */}
            <div>
              <h4 className="text-sm font-bold text-neutral-900 mb-3 tracking-tight">
                Shopee VIP Club
              </h4>
              <p className="text-xs text-neutral-500 mb-3 leading-relaxed">
                Subscribe to get exclusive flash sales and seasonal vouchers.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722]"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-neutral-900 hover:bg-[#FF5722] text-white rounded-lg transition-colors text-xs"
                    aria-label="Subscribe"
                  >
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              <div className="mt-4 pt-4 border-t border-neutral-100 text-[11px] text-neutral-500 space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-neutral-700">
                  <FiPhone className="text-[#FF5722]" /> {appConfig.supportPhone}
                </div>
                <div className="text-neutral-400">Mon - Sat: 9:00 AM - 9:00 PM</div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="border-t border-neutral-100 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
            <p>&copy; {currentYear} Shopee E-Commerce. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <span>Privacy Policy</span>
              <span>&bull;</span>
              <span>Terms of Sale</span>
              <span>&bull;</span>
              <span>Returns Policy</span>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
