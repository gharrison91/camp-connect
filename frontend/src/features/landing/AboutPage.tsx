/**
 * Camp Connect - About Page
 * Team, mission, story, values, and timeline.
 */

import { motion } from 'framer-motion';
import {
  Heart,
  Shield,
  Zap,
  Users,
  Target,
  Sparkles,
  Award,
} from 'lucide-react';
import { ScrollReveal } from './components/ScrollReveal';
import { GlassCard } from './components/GlassCard';
import { AnimatedCounter } from './components/AnimatedCounter';

const values = [
  {
    icon: Heart,
    title: 'Camp First',
    description: 'Every feature we build starts with the question: does this help camps create better experiences for kids?',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Shield,
    title: 'Safety & Trust',
    description: 'We treat camper data with the highest level of security. SOC 2 compliant, encrypted, and always protected.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Zap,
    title: 'Simplicity',
    description: 'Powerful doesn\u2019t have to mean complicated. We design intuitive tools that anyone on your team can use.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'We\u2019re building more than software \u2014 we\u2019re building a community of camp professionals who share best practices.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
];

const team = [
  { name: 'Gray Harrison', role: 'Founder & CEO', initials: 'GH', color: 'bg-emerald-500/20 text-emerald-400' },
  { name: 'Alex Rivera', role: 'Head of Product', initials: 'AR', color: 'bg-blue-500/20 text-blue-400' },
  { name: 'Jordan Kim', role: 'Lead Engineer', initials: 'JK', color: 'bg-purple-500/20 text-purple-400' },
  { name: 'Sam Taylor', role: 'Head of Design', initials: 'ST', color: 'bg-amber-500/20 text-amber-400' },
  { name: 'Morgan Lee', role: 'Customer Success', initials: 'ML', color: 'bg-rose-500/20 text-rose-400' },
  { name: 'Casey Zhang', role: 'Growth Lead', initials: 'CZ', color: 'bg-cyan-500/20 text-cyan-400' },
];

const milestones = [
  { year: '2023', title: 'Founded', description: 'Camp Connect was born from a simple idea: camps deserve modern tools.' },
  { year: '2024', title: 'Beta Launch', description: 'First 50 camps joined the beta program and helped shape the product.' },
  { year: '2024', title: 'Full Platform', description: 'Launched all 10 modules including AI photo recognition and parent portal.' },
  { year: '2025', title: 'Growing Fast', description: 'Serving hundreds of camps across North America with 99.9% uptime.' },
];

const stats = [
  { label: 'Camps Served', value: 500, suffix: '+' },
  { label: 'Campers Managed', value: 25000, suffix: '+' },
  { label: 'Photos Processed', value: 1200000, suffix: '+' },
  { label: 'Uptime', value: 99, suffix: '.9%' },
];

export function AboutPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.08)_0%,_transparent_50%)]" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Our Story
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
              Built by Camp People, for{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Camp People
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              We grew up at camp. We understand the magic of those summers and the operational challenges of making them happen. Camp Connect exists to take the busywork off your plate so you can focus on what matters: the kids.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 0.1}>
                <GlassCard padding="md" hover={false} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-white">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} duration={2} />
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="px-6 pb-24">
        <ScrollReveal className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/15 mb-6">
            <Target className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Our Mission</h2>
          <p className="mt-6 text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto">
            To empower camp directors and staff with technology that simplifies operations, enhances safety, and strengthens the connection between camps and families \u2014 so every camper gets the best summer of their life.
          </p>
        </ScrollReveal>
      </section>

      {/* Values */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">What We Believe</h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((val, i) => {
              const Icon = val.icon;
              return (
                <ScrollReveal key={val.title} delay={i * 0.1}>
                  <GlassCard padding="lg">
                    <div className={`w-12 h-12 rounded-xl ${val.bg} flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 ${val.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{val.title}</h3>
                    <p className="mt-2 text-sm text-gray-400 leading-relaxed">{val.description}</p>
                  </GlassCard>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Meet the Team</h2>
            <p className="mt-3 text-gray-400">
              A passionate group of engineers, designers, and camp veterans.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {team.map((member, i) => (
              <ScrollReveal key={member.name} delay={i * 0.08} scale>
                <GlassCard padding="md" className="text-center">
                  <div className={`w-16 h-16 rounded-2xl ${member.color} flex items-center justify-center text-xl font-bold mx-auto`}>
                    {member.initials}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">{member.name}</h3>
                  <p className="text-sm text-gray-500">{member.role}</p>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Our Journey</h2>
          </ScrollReveal>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10" />
            <div className="space-y-10">
              {milestones.map((ms, i) => (
                <ScrollReveal key={`${ms.year}-${ms.title}`} direction="left" delay={i * 0.15}>
                  <div className="flex gap-6">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                        <Award className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <span className="text-xs font-medium text-emerald-400">{ms.year}</span>
                      <h3 className="text-lg font-semibold text-white mt-0.5">{ms.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{ms.description}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
