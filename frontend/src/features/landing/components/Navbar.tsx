import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Tent, Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Gallery', href: '/gallery' },
  {
    label: 'Explore',
    href: '#',
    children: [
      { label: 'Schedule Demo', href: '/schedule-demo' },
      { label: 'Dashboard Preview', href: '/dashboard-preview' },
    ],
  },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 100], [0, 1]);
  const borderOpacity = useTransform(scrollY, [0, 100], [0, 0.1]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  function handleClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    if (href.startsWith('#')) {
      e.preventDefault();
      setMobileOpen(false);
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
    if (href.startsWith('/#') && location.pathname === '/') {
      e.preventDefault();
      setMobileOpen(false);
      const anchor = href.replace('/', '');
      const target = document.querySelector(anchor);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          backgroundColor: useTransform(bgOpacity, (v) => `rgba(10, 10, 15, ${v})`),
          borderBottomColor: useTransform(borderOpacity, (v) => `rgba(255, 255, 255, ${v})`),
          borderBottomWidth: '1px',
          backdropFilter: useTransform(scrollY, [0, 100], ['blur(0px)', 'blur(12px)']),
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
              <Tent className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              Camp Connect
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label} className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={cn(
                      'flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors duration-200',
                      dropdownOpen ? 'text-white bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5',
                    )}
                  >
                    {link.label}
                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', dropdownOpen && 'rotate-180')} />
                  </button>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 mt-1 w-48 rounded-xl bg-[#141420] border border-white/10 shadow-xl shadow-black/20 py-1 backdrop-blur-xl"
                    >
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          onClick={() => setDropdownOpen(false)}
                          className={cn(
                            'block px-4 py-2.5 text-sm transition-colors',
                            isActive(child.href) ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5',
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={(e) => handleClick(e, link.href)}
                  className={cn(
                    'px-3 py-2 text-sm rounded-lg transition-colors duration-200',
                    isActive(link.href) ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5',
                  )}
                >
                  {link.label}
                </Link>
              ),
            )}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-400 hover:text-white px-3 py-2 rounded-lg transition-colors duration-200">
              Sign In
            </Link>
            <Link to="/register" className="text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg transition-colors duration-200 shadow-lg shadow-emerald-600/20">
              Get Started
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            className="md:hidden text-gray-400 hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-xl pt-20 px-6 md:hidden overflow-y-auto"
        >
          <div className="flex flex-col gap-2">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label}>
                  <span className="block text-xs uppercase tracking-wider text-gray-600 px-3 pt-4 pb-2">{link.label}</span>
                  {link.children.map((child) => (
                    <Link
                      key={child.href}
                      to={child.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'block px-3 py-3 text-lg rounded-lg transition-colors',
                        isActive(child.href) ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-300 hover:text-white hover:bg-white/5',
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={(e) => { handleClick(e, link.href); setMobileOpen(false); }}
                  className={cn(
                    'block px-3 py-3 text-lg rounded-lg transition-colors',
                    isActive(link.href) ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-300 hover:text-white hover:bg-white/5',
                  )}
                >
                  {link.label}
                </Link>
              ),
            )}
            <hr className="border-white/10 my-4" />
            <Link to="/login" onClick={() => setMobileOpen(false)} className="px-3 py-3 text-lg text-gray-300 hover:text-white rounded-lg transition-colors">
              Sign In
            </Link>
            <Link to="/register" onClick={() => setMobileOpen(false)} className="text-center text-lg font-medium text-white bg-emerald-600 hover:bg-emerald-500 px-6 py-3.5 rounded-xl transition-colors">
              Get Started
            </Link>
          </div>
        </motion.div>
      )}
    </>
  );
}
