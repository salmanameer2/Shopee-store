import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertCircle, FiHome, FiShoppingBag } from 'react-icons/fi';
import Container from '../components/common/Container.jsx';
import Button from '../components/common/Button.jsx';

export default function NotFound() {
  return (
    <div className="py-20">
      <Container>
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-[#FF5722]">
            <FiAlertCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-[#FF5722] tracking-wider uppercase">
              Error 404
            </span>
            <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
              Page Not Found
            </h1>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Sorry, the page you are looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link to="/">
              <Button variant="primary">
                <FiHome className="w-4 h-4" /> Go to Home
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="outline">
                <FiShoppingBag className="w-4 h-4" /> Browse Catalog
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
