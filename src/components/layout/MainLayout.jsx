import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import SmoothScrollProvider from '../common/SmoothScrollProvider.jsx';
import ScrollProgressBar from '../common/ScrollProgressBar.jsx';
import BackToTop from '../common/BackToTop.jsx';

export default function MainLayout() {
  return (
    <SmoothScrollProvider>
      <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-neutral-900 font-sans selection:bg-[#FF5722]/20 selection:text-[#FF5722]">
        <ScrollProgressBar />
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <BackToTop />
      </div>
    </SmoothScrollProvider>
  );
}
