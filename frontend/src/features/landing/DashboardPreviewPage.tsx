/**
 * Camp Connect - Animated Dashboard Mockup Page
 * Shows a preview of the admin dashboard with animated charts and counters.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { ScrollReveal } from './components/ScrollReveal';
import { GlassCard } from './components/GlassCard';
import { AnimatedCounter } from './components/AnimatedCounter';

// Mock data for charts
const enrollmentByMonth = [
  { month: 'Jan', value: 12 },
  { month: 'Feb', value: 28 },
  { month: 'Mar', value: 45 },
  { month: 'Apr', value: 72 },
  { month: 'May', value: 110 },
  { month: 'Jun', value: 156 },
  { month: 'Jul', value: 189 },
  { month: 'Aug', value: 175 },
];

const maxEnrollment = Math.max(...enrollmentByMonth.map((d) => d.value));

const ageDistribution = [
  { label: '6-8', pct: 25, color: 'bg-emerald-500' },
  { label: '9-11', pct: 35, color: 'bg-blue-500' },
  { label: '12-14', pct: 28, color: 'bg-purple-500' },
  { label: '15-17', pct: 12, color: 'bg-amber-500' },
];

const recentActivity = [
  { text: 'New registration: Emma Johnson', time: '2m ago', color: 'bg-emerald-500' },
  { text: 'Payment received: $450.00', time: '15m ago', color: 'bg-blue-500' },
  { text: 'Health form submitted: Liam Chen', time: '32m ago', color: 'bg-purple-500' },
  { text: 'Staff onboarding complete: Sarah M.', time: '1h ago', color: 'bg-amber-500' },
  { text: 'New registration: Noah Williams', time: '2h ago', color: 'bg-emerald-500' },
];

const upcomingEvents = [
  { name: 'Summer Camp 2025', date: 'Jun 15 - Aug 10', spots: '156/200', pct: 78 },
  { name: 'Spring Break Camp', date: 'Mar 22 - Mar 28', spots: '45/50', pct: 90 },
  { name: 'Leadership Retreat', date: 'Sep 5 - Sep 7', spots: '22/30', pct: 73 },
];

export function DashboardPreviewPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative pt-32 pb-12 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.08)_0%,_transparent_50%)]" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 mb-6">
              <BarChart3 className="w-3.5 h-3.5" />
              Dashboard Preview
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
              Your Camp at a{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Glance
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
              See real-time enrollment, revenue, and operations data in a beautiful, actionable dashboard.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Mockup */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          {/* Device Frame */}
          <ScrollReveal scale>
            <div className="rounded-2xl border border-white/10 bg-[#0c0c14] p-1 shadow-2xl shadow-emerald-500/5">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-white/5 text-xs text-gray-500">
                    app.campconnect.com/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 space-y-6">
                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Campers', value: 342, prefix: '', suffix: '', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Revenue', value: 89450, prefix: '$', suffix: '', icon: DollarSign, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Growth', value: 28, prefix: '', suffix: '%', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                    { label: 'Events', value: 12, prefix: '', suffix: '', icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                  ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <GlassCard key={stat.label} padding="sm" hover={false}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${stat.color}`} />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">
                              <AnimatedCounter end={stat.value} prefix={stat.prefix} suffix={stat.suffix} duration={1.5} />
                            </p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Bar Chart */}
                  <GlassCard padding="md" hover={false} className="md:col-span-2">
                    <h3 className="text-sm font-semibold text-white mb-4">Enrollment Trend</h3>
                    <div className="flex items-end gap-2 h-40">
                      {enrollmentByMonth.map((d, i) => (
                        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                          <motion.div
                            initial={{ height: 0 }}
                            whileInView={{ height: `${(d.value / maxEnrollment) * 100}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: i * 0.08 }}
                            className="w-full rounded-t-md bg-gradient-to-t from-emerald-600/60 to-emerald-400/40 min-h-[4px]"
                          />
                          <span className="text-[10px] text-gray-500">{d.month}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  {/* Donut Chart (simulated) */}
                  <GlassCard padding="md" hover={false}>
                    <h3 className="text-sm font-semibold text-white mb-4">Age Distribution</h3>
                    <div className="flex justify-center mb-4">
                      <div className="relative w-28 h-28">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          {ageDistribution.reduce(
                            (acc, seg, i) => {
                              const circumference = 2 * Math.PI * 38;
                              const offset = acc.offset;
                              const length = (seg.pct / 100) * circumference;
                              acc.elements.push(
                                <motion.circle
                                  key={seg.label}
                                  cx="50"
                                  cy="50"
                                  r="38"
                                  fill="none"
                                  strokeWidth="12"
                                  className={seg.color.replace('bg-', 'stroke-')}
                                  strokeDasharray={`${length} ${circumference - length}`}
                                  strokeDashoffset={-offset}
                                  initial={{ pathLength: 0 }}
                                  whileInView={{ pathLength: 1 }}
                                  viewport={{ once: true }}
                                  transition={{ duration: 1, delay: i * 0.2 }}
                                  strokeLinecap="round"
                                />,
                              );
                              acc.offset += length;
                              return acc;
                            },
                            { elements: [] as React.ReactNode[], offset: 0 },
                          ).elements}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-bold text-white">
                            <AnimatedCounter end={342} duration={1.5} />
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {ageDistribution.map((seg) => (
                        <div key={seg.label} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${seg.color}`} />
                            <span className="text-gray-400">Ages {seg.label}</span>
                          </div>
                          <span className="text-gray-300 font-medium">{seg.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Recent Activity */}
                  <GlassCard padding="md" hover={false}>
                    <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {recentActivity.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <div className={`w-2 h-2 rounded-full ${item.color}`} />
                          <p className="flex-1 text-xs text-gray-300">{item.text}</p>
                          <span className="text-[10px] text-gray-600">{item.time}</span>
                        </motion.div>
                      ))}
                    </div>
                  </GlassCard>

                  {/* Upcoming Events */}
                  <GlassCard padding="md" hover={false}>
                    <h3 className="text-sm font-semibold text-white mb-4">Upcoming Events</h3>
                    <div className="space-y-4">
                      {upcomingEvents.map((evt, i) => (
                        <motion.div
                          key={evt.name}
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-white">{evt.name}</span>
                            <span className="text-[10px] text-gray-500">{evt.spots}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${evt.pct}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: i * 0.15 }}
                                className={`h-full rounded-full ${evt.pct >= 90 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              />
                            </div>
                            <span className="text-[10px] text-gray-500 w-8">{evt.pct}%</span>
                          </div>
                          <p className="text-[10px] text-gray-600 mt-0.5">{evt.date}</p>
                        </motion.div>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <ScrollReveal className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            See Your Own Data Come to Life
          </h2>
          <p className="mt-4 text-gray-400">
            Start your free trial and get instant access to your personalized dashboard.
          </p>
          <div className="mt-8">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
