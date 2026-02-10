/**
 * Camp Connect - Contact Page
 * Split layout: form on left, info on right. FAQ accordion below.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  ChevronDown,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollReveal } from './components/ScrollReveal';
import { GlassCard } from './components/GlassCard';

const faqs = [
  {
    q: 'How long does it take to get set up?',
    a: 'Most camps are up and running within 24 hours. Our onboarding wizard walks you through importing your data and configuring your first event.',
  },
  {
    q: 'Can I import data from my existing system?',
    a: 'Yes! We support CSV imports for contacts, campers, and registrations. Our team can also help with custom migrations from popular platforms.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Absolutely. Every plan comes with a 14-day free trial, no credit card required. You get full access to all features.',
  },
  {
    q: 'Do you offer training for staff?',
    a: 'Yes, we provide live onboarding sessions, video tutorials, and a comprehensive help center. Premium plans include dedicated account management.',
  },
  {
    q: 'What about data security?',
    a: 'Camp Connect uses bank-level encryption, SOC 2 compliance, and regular security audits. All data is stored in secure, US-based data centers.',
  },
  {
    q: 'Can parents access the platform?',
    a: 'Yes! The Parent Portal gives families access to photos, schedules, invoices, and health forms for their campers.',
  },
];

const interestOptions = [
  'General Inquiry',
  'Schedule a Demo',
  'Pricing Questions',
  'Technical Support',
  'Partnership',
  'Other',
];

export function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    phone: '',
    interest: 'General Inquiry',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to an API
    setSubmitted(true);
  };

  return (
    <main>
      {/* Hero */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.08)_0%,_transparent_50%)]" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 mb-6">
              <MessageCircle className="w-3.5 h-3.5" />
              Get in Touch
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
              Let&apos;s{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Talk Camp
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
              Have questions? Want a demo? We&apos;d love to hear from you and help you find the right solution for your camp.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form + Info */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Form (3 cols) */}
          <ScrollReveal className="lg:col-span-3">
            <GlassCard padding="lg">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Message Sent!</h3>
                  <p className="mt-2 text-gray-400">
                    Thanks for reaching out. We&apos;ll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                        placeholder="you@camp.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Organization</label>
                      <input
                        type="text"
                        value={formData.organization}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                        placeholder="Camp name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">I&apos;m interested in...</label>
                    <select
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                    >
                      {interestOptions.map((opt) => (
                        <option key={opt} value={opt} className="bg-[#0a0a0f]">
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Message</label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 resize-none"
                      placeholder="Tell us about your camp and what you're looking for..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    <Send className="w-4 h-4" />
                    Send Message
                  </button>
                </form>
              )}
            </GlassCard>
          </ScrollReveal>

          {/* Contact Info (2 cols) */}
          <ScrollReveal direction="right" className="lg:col-span-2 space-y-6">
            <GlassCard padding="md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Email Us</p>
                  <p className="text-sm text-gray-400">hello@campconnect.com</p>
                </div>
              </div>
            </GlassCard>
            <GlassCard padding="md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Call Us</p>
                  <p className="text-sm text-gray-400">(555) 123-CAMP</p>
                </div>
              </div>
            </GlassCard>
            <GlassCard padding="md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Visit Us</p>
                  <p className="text-sm text-gray-400">Austin, Texas</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard padding="md" hover={false}>
              <p className="text-sm text-gray-400 leading-relaxed">
                <strong className="text-white">Response time:</strong> We typically respond within 4 business hours during weekdays. For urgent matters, give us a call.
              </p>
            </GlassCard>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Frequently Asked Questions
            </h2>
          </ScrollReveal>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <ScrollReveal key={i} delay={i * 0.05}>
                <GlassCard padding="sm" hover={false}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-3 text-left"
                  >
                    <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200',
                        openFaq === i && 'rotate-180',
                      )}
                    />
                  </button>
                  {openFaq === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-3 pb-3"
                    >
                      <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
