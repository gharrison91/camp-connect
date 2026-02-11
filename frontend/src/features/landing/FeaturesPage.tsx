/**
 * Camp Connect - Features Deep-Dive Page
 * Alternating left/right sections for each major module with scroll animations.
 */

import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import {
  ClipboardList,
  CalendarDays,
  Heart,
  CreditCard,
  Users,
  UserCog,
  BarChart3,
  ShoppingBag,
  MessageSquare,
  Camera,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { ScrollReveal } from './components/ScrollReveal';
import { GlassCard } from './components/GlassCard';

interface FeatureModule {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  color: string;
  gradient: string;
}

const modules: FeatureModule[] = [
  {
    icon: ClipboardList,
    title: 'Registration & Enrollment',
    subtitle: 'Streamlined onboarding',
    description: 'Accept registrations online with custom forms, waitlists, and automatic confirmations. Manage capacity, age groups, and gender restrictions effortlessly.',
    features: ['Online registration forms', 'Waitlist management', 'Automatic confirmations', 'Custom pricing tiers', 'Multi-session support'],
    color: 'text-emerald-400',
    gradient: 'from-emerald-500/20 to-emerald-500/0',
  },
  {
    icon: CalendarDays,
    title: 'Smart Scheduling',
    subtitle: 'Activity planning made easy',
    description: 'Build weekly schedules with drag-and-drop, assign activities to time slots, and manage counselor assignments across multiple sessions.',
    features: ['Drag-and-drop scheduler', 'Activity management', 'Counselor assignments', 'Conflict detection', 'Print-ready schedules'],
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-blue-500/0',
  },
  {
    icon: Heart,
    title: 'Health & Safety',
    subtitle: 'Keep campers safe',
    description: 'Digital health forms, allergy tracking, medication management, and emergency contact information all in one secure location.',
    features: ['Digital health forms', 'Allergy alerts', 'Medication tracking', 'Emergency contacts', 'Incident reporting'],
    color: 'text-rose-400',
    gradient: 'from-rose-500/20 to-rose-500/0',
  },
  {
    icon: CreditCard,
    title: 'Payments & Invoicing',
    subtitle: 'Get paid faster',
    description: 'Create invoices, accept online payments, offer payment plans, and track revenue in real-time. Supports partial payments and refunds.',
    features: ['Online payments', 'Payment plans', 'Invoice generation', 'Revenue tracking', 'Refund management'],
    color: 'text-amber-400',
    gradient: 'from-amber-500/20 to-amber-500/0',
  },
  {
    icon: Users,
    title: 'Parent Portal',
    subtitle: 'Keep families connected',
    description: 'Parents can view photos, check schedules, update health forms, review invoices, and stay informed about their camper\u2019s experience.',
    features: ['Photo viewing', 'Schedule access', 'Invoice management', 'Health form updates', 'Real-time notifications'],
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-purple-500/0',
  },
  {
    icon: UserCog,
    title: 'Staff Management',
    subtitle: 'Empower your team',
    description: 'Onboard staff with digital checklists, manage certifications, track seasonal access, and maintain a comprehensive staff directory.',
    features: ['Digital onboarding', 'Certification tracking', 'Role-based access', 'Staff directory', 'Background check status'],
    color: 'text-cyan-400',
    gradient: 'from-cyan-500/20 to-cyan-500/0',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reporting',
    subtitle: 'Data-driven decisions',
    description: 'Comprehensive dashboards with enrollment trends, revenue analysis, demographic breakdowns, and exportable reports.',
    features: ['Enrollment analytics', 'Revenue reports', 'Demographic insights', 'Custom exports', 'Year-over-year trends'],
    color: 'text-indigo-400',
    gradient: 'from-indigo-500/20 to-indigo-500/0',
  },
  {
    icon: MessageSquare,
    title: 'Communications Hub',
    subtitle: 'Stay connected',
    description: 'Send targeted emails and SMS messages to parents, staff, or specific groups. Template library, bulk sending, and event-based quick contacts.',
    features: ['Email campaigns', 'SMS messaging', 'Template library', 'Event quick-send', 'Communication history'],
    color: 'text-teal-400',
    gradient: 'from-teal-500/20 to-teal-500/0',
  },
  {
    icon: Camera,
    title: 'Photo Management & AI',
    subtitle: 'Capture every moment',
    description: 'Upload, organize, and share camp photos. AI-powered facial recognition automatically tags campers so parents can easily find their child\u2019s photos.',
    features: ['Bulk photo upload', 'AI facial recognition', 'Automatic tagging', 'Album organization', 'Parent photo sharing'],
    color: 'text-pink-400',
    gradient: 'from-pink-500/20 to-pink-500/0',
  },
  {
    icon: ShoppingBag,
    title: 'Camp Store',
    subtitle: 'Merchandise & essentials',
    description: 'Set up an online camp store for merchandise, supplies, and add-ons. Manage inventory, process orders, and track fulfillment.',
    features: ['Product catalog', 'Inventory tracking', 'Order processing', 'Category management', 'Sales reporting'],
    color: 'text-orange-400',
    gradient: 'from-orange-500/20 to-orange-500/0',
  },
];

export function FeaturesPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <main>
      {/* Hero */}
      <section ref={heroRef} className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.1)_0%,_transparent_50%)]" />
        <motion.div style={{ y: heroY }} className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 mb-6">
              <Zap className="w-3.5 h-3.5" />
              10 Powerful Modules
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Run Your Camp
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
              From registration to reporting, Camp Connect gives you a complete platform to manage every aspect of your camp operations.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Modules */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto space-y-32">
          {modules.map((mod, idx) => {
            const Icon = mod.icon;
            const isReversed = idx % 2 === 1;

            return (
              <div
                key={mod.title}
                className={`flex flex-col gap-12 items-center ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}
              >
                {/* Info Side */}
                <ScrollReveal
                  direction={isReversed ? 'right' : 'left'}
                  delay={0.1}
                  className="flex-1"
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${mod.gradient} border border-white/10 mb-6`}>
                    <Icon className={`w-7 h-7 ${mod.color}`} />
                  </div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    {mod.subtitle}
                  </p>
                  <h2 className="mt-2 text-3xl md:text-4xl font-bold text-white">
                    {mod.title}
                  </h2>
                  <p className="mt-4 text-gray-400 leading-relaxed max-w-lg">
                    {mod.description}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {mod.features.map((feat, featIdx) => (
                      <motion.li
                        key={feat}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.3, delay: featIdx * 0.1 }}
                        className="flex items-center gap-3 text-sm text-gray-300"
                      >
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${mod.color}`} />
                        {feat}
                      </motion.li>
                    ))}
                  </ul>
                </ScrollReveal>

                {/* Visual Side */}
                <ScrollReveal
                  direction={isReversed ? 'left' : 'right'}
                  delay={0.2}
                  scale
                  className="flex-1 w-full"
                >
                  <GlassCard padding="lg" className="relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${mod.gradient} opacity-30`} />
                    <div className="relative">
                      {/* Mock UI representation */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${mod.gradient} flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 ${mod.color}`} />
                          </div>
                          <span className="text-sm font-medium text-white">{mod.title}</span>
                        </div>
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
                            <div
                              className="h-3 rounded-full bg-white/10"
                              style={{ width: `${60 + Math.random() * 30}%` }}
                            />
                          </div>
                        ))}
                        <div className="mt-4 grid grid-cols-3 gap-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 rounded-xl bg-white/5 border border-white/5" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </ScrollReveal>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-emerald-950/30 to-emerald-900/20" />
        <ScrollReveal className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/15 mb-6">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to See It in Action?
          </h2>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto">
            Start your free trial today and experience the power of Camp Connect firsthand.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-white border border-white/20 hover:border-white/40 hover:bg-white/5 rounded-xl transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
