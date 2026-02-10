import { Link } from 'react-router-dom';
import { Tent } from 'lucide-react';

const productLinks = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Schedule Demo', href: '/schedule-demo' },
  { label: 'Dashboard Preview', href: '/dashboard-preview' },
  { label: 'Gallery', href: '/gallery' },
];

const companyLinks = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Blog', href: '#' },
  { label: 'Careers', href: '#' },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Cookie Policy', href: '#' },
];

function FooterLinkGroup({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
        {title}
      </h4>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            {link.href.startsWith('/') ? (
              <Link
                to={link.href}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors duration-200"
              >
                {link.label}
              </Link>
            ) : (
              <a
                href={link.href}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors duration-200"
              >
                {link.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#06060a] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Tent className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">
                Camp Connect
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              The modern platform for camp management. Streamline registration,
              communications, and operations in one place.
            </p>
            <p className="text-xs text-gray-600 mt-6">
              &copy; {new Date().getFullYear()} Camp Connect. All rights
              reserved.
            </p>
          </div>

          <FooterLinkGroup title="Product" links={productLinks} />
          <FooterLinkGroup title="Company" links={companyLinks} />
          <FooterLinkGroup title="Legal" links={legalLinks} />
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Camp Connect, Inc. All rights
            reserved.
          </p>

          <div className="flex items-center gap-4">
            {['Twitter', 'LinkedIn', 'GitHub'].map((platform) => (
              <a
                key={platform}
                href="#"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label={platform}
              >
                <span className="text-xs text-gray-500 font-medium">
                  {platform[0]}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
