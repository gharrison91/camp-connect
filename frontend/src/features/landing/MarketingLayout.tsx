/**
 * Shared layout wrapper for all marketing pages.
 * Provides Navbar + Footer + dark background.
 */

import { Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

export function MarketingLayout() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}
