import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: PricingFeature[];
  popular: boolean;
  cta: string;
}

const tiers: PricingTier[] = [
  {
    name: 'Starter',
    price: '$49',
    period: '/mo',
    description: 'Perfect for small camps getting started.',
    features: [
      { text: 'Up to 50 campers', included: true },
      { text: '2 staff accounts', included: true },
      { text: 'Email support', included: true },
      { text: 'Basic registration', included: true },
      { text: '5GB photo storage', included: true },
      { text: 'AI facial recognition', included: false },
      { text: 'Custom integrations', included: false },
      { text: 'Advanced security', included: false },
    ],
    popular: false,
    cta: 'Get Started',
  },
  {
    name: 'Professional',
    price: '$149',
    period: '/mo',
    description: 'For growing camps that need the full toolkit.',
    features: [
      { text: 'Up to 500 campers', included: true },
      { text: '25 staff accounts', included: true },
      { text: 'Priority support', included: true },
      { text: 'All features included', included: true },
      { text: '50GB photo storage', included: true },
      { text: 'AI facial recognition', included: true },
      { text: 'Custom integrations', included: false },
      { text: 'Advanced security', included: false },
    ],
    popular: true,
    cta: 'Get Started',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with advanced needs.',
    features: [
      { text: 'Unlimited campers', included: true },
      { text: 'Unlimited staff', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'All features included', included: true },
      { text: 'Unlimited storage', included: true },
      { text: 'AI facial recognition', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Advanced security & SLA', included: true },
    ],
    popular: false,
    cta: 'Contact Sales',
  },
];

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

export function PricingSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <section id="pricing" className="py-24 px-6 bg-[#08080d]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-bold text-white"
          >
            Simple, Transparent Pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-gray-400"
          >
            Choose the plan that fits your camp
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <motion.div
          ref={containerRef}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          transition={{ staggerChildren: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch"
        >
          {tiers.map((tier) => (
            <motion.div
              key={tier.name}
              variants={cardVariants}
              className={cn(
                'relative rounded-2xl p-8 flex flex-col',
                tier.popular
                  ? 'bg-white/[0.08] border-2 border-emerald-500/60 shadow-lg shadow-emerald-500/10 scale-[1.02]'
                  : 'bg-white/5 border border-white/10',
              )}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Tier Info */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white">
                  {tier.name}
                </h3>
                <p className="text-gray-500 text-sm mt-1">{tier.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-gray-500 text-sm">{tier.period}</span>
                  )}
                </div>
              </div>

              {/* Feature List */}
              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
                    )}
                    <span
                      className={cn(
                        'text-sm',
                        feature.included ? 'text-gray-300' : 'text-gray-600',
                      )}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                to={tier.name === 'Enterprise' ? '#' : '/register'}
                className={cn(
                  'block text-center py-3 px-6 rounded-xl font-medium transition-all duration-200',
                  tier.popular
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-white/10 hover:bg-white/15 text-white',
                )}
              >
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
