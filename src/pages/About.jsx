import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiShield,
  FiTruck,
  FiUsers,
  FiAward,
  FiArrowRight,
} from 'react-icons/fi';
import Container from '../components/common/Container.jsx';
import Button from '../components/common/Button.jsx';
import SectionHeading from '../components/common/SectionHeading.jsx';
import ScrollReveal, { StaggerContainer, StaggerItem } from '../components/common/ScrollReveal.jsx';

export default function About() {
  const stats = [
    { label: 'Curated Catalog Items', value: '20+' },
    { label: 'Departments', value: '4' },
    { label: 'Satisfied Customers', value: '50K+' },
    { label: 'Nationwide Delivery Coverage', value: '100%' },
  ];

  const pillars = [
    {
      title: 'Uncompromised Quality',
      desc: 'Every garment, pair of shoes, gadget, and toy undergoes thorough inspection before dispatch.',
      icon: FiAward,
    },
    {
      title: 'Fair & Transparent Pricing',
      desc: 'Direct manufacturer partnerships enable authentic PKR prices without hidden middleman markups.',
      icon: FiShield,
    },
    {
      title: 'Lightning Nationwide Dispatch',
      desc: 'Orders processed rapidly with express courier delivery across Karachi, Lahore, Islamabad, and nationwide.',
      icon: FiTruck,
    },
    {
      title: 'Customer-First Guarantee',
      desc: 'Enjoy 7-day hassle-free doorstep returns and dedicated 24/7 customer helpline assistance.',
      icon: FiUsers,
    },
  ];

  return (
    <div className="py-8 sm:py-12 space-y-16">
      <Container>
        {/* About Hero */}
        <ScrollReveal variant="fade-up">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold tracking-widest text-[#FF5722] uppercase">
              Our Story & Values
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-900 tracking-tight leading-tight">
              Elevating Everyday Shopping Across Pakistan
            </h1>
            <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
              Shopee was founded to give discerning shoppers a modern, reliable, and delightful e-commerce experience. From wardrobe staples to the latest smart gadgets, we bring quality directly to your doorstep.
            </p>
          </div>
        </ScrollReveal>

        {/* Stats Grid */}
        <StaggerContainer
          staggerDelay={0.08}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-6"
        >
          {stats.map((stat, idx) => (
            <StaggerItem key={idx}>
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 text-center shadow-sm space-y-1 hover:shadow-md transition-shadow">
                <div className="text-3xl sm:text-4xl font-black text-neutral-900 tabular-nums">
                  {stat.value}
                </div>
                <div className="text-xs font-semibold text-neutral-500">
                  {stat.label}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Brand Pillars */}
        <div className="pt-8">
          <ScrollReveal variant="fade-up">
            <SectionHeading
              title="The Shopee Standard"
              subtitle="Why Customers Choose Us"
              align="center"
            />
          </ScrollReveal>

          <StaggerContainer
            staggerDelay={0.08}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <StaggerItem key={idx}>
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#FF5722]/40 hover:shadow-lg transition-all h-full">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF5722] flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-neutral-900 mb-2">
                        {pillar.title}
                      </h3>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>

        {/* Explore CTA Box */}
        <ScrollReveal variant="scale-up" delay={0.2} className="pt-8">
          <div className="bg-neutral-900 text-white rounded-3xl p-8 sm:p-12 text-center max-w-4xl mx-auto shadow-2xl space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to explore our curated products?
            </h2>
            <p className="text-neutral-300 text-sm max-w-xl mx-auto leading-relaxed">
              Discover Men, Women, Kids, and Electronic Gadget collections designed to bring joy and practicality to your everyday lifestyle.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link to="/products">
                <Button size="lg" variant="primary" className="shadow-lg shadow-[#FF5722]/30 hover:scale-105 transition-transform">
                  Browse All Products <FiArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </div>
  );
}
