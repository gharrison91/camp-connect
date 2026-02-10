/**
 * Camp Connect - Interactive Schedule Demo Page
 * Shows a sample camp weekly schedule with color-coded activities.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, X, Clock, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollReveal } from './components/ScrollReveal';

interface ActivityBlock {
  name: string;
  time: string;
  location: string;
  ageRange: string;
  color: string;
  bg: string;
  row: number; // time slot index
  col: number; // day index (0=Mon)
  span?: number; // row span
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
  '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
  '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
];

const activities: ActivityBlock[] = [
  { name: 'Breakfast', time: '7:00 - 8:00 AM', location: 'Dining Hall', ageRange: 'All Ages', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30', row: 0, col: 0, span: 1 },
  { name: 'Breakfast', time: '7:00 - 8:00 AM', location: 'Dining Hall', ageRange: 'All Ages', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30', row: 0, col: 1, span: 1 },
  { name: 'Breakfast', time: '7:00 - 8:00 AM', location: 'Dining Hall', ageRange: 'All Ages', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30', row: 0, col: 2, span: 1 },
  { name: 'Breakfast', time: '7:00 - 8:00 AM', location: 'Dining Hall', ageRange: 'All Ages', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30', row: 0, col: 3, span: 1 },
  { name: 'Breakfast', time: '7:00 - 8:00 AM', location: 'Dining Hall', ageRange: 'All Ages', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30', row: 0, col: 4, span: 1 },

  { name: 'Swimming', time: '9:00 - 10:00 AM', location: 'Lake', ageRange: '8-12', color: 'text-blue-300', bg: 'bg-blue-500/15 border-blue-500/30', row: 2, col: 0, span: 1 },
  { name: 'Arts & Crafts', time: '9:00 - 10:30 AM', location: 'Arts Center', ageRange: '6-10', color: 'text-purple-300', bg: 'bg-purple-500/15 border-purple-500/30', row: 2, col: 1, span: 2 },
  { name: 'Archery', time: '9:00 - 10:00 AM', location: 'Range', ageRange: '10-15', color: 'text-green-300', bg: 'bg-green-500/15 border-green-500/30', row: 2, col: 2, span: 1 },
  { name: 'Ropes Course', time: '9:00 - 11:00 AM', location: 'Adventure Area', ageRange: '12-16', color: 'text-red-300', bg: 'bg-red-500/15 border-red-500/30', row: 2, col: 3, span: 2 },
  { name: 'Swimming', time: '9:00 - 10:00 AM', location: 'Pool', ageRange: '6-8', color: 'text-blue-300', bg: 'bg-blue-500/15 border-blue-500/30', row: 2, col: 4, span: 1 },

  { name: 'Basketball', time: '10:00 - 11:00 AM', location: 'Courts', ageRange: '10-14', color: 'text-orange-300', bg: 'bg-orange-500/15 border-orange-500/30', row: 3, col: 0, span: 1 },
  { name: 'Nature Hike', time: '10:00 - 11:30 AM', location: 'Trail', ageRange: '8-12', color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/30', row: 3, col: 2, span: 2 },
  { name: 'Theater', time: '10:00 - 11:00 AM', location: 'Amphitheater', ageRange: 'All Ages', color: 'text-pink-300', bg: 'bg-pink-500/15 border-pink-500/30', row: 3, col: 4, span: 1 },

  { name: 'Lunch', time: '12:00 - 1:00 PM', location: 'Dining Hall', ageRange: 'All Ages', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30', row: 5, col: 0, span: 1 },
  { name: 'Lunch', time: '12:00 - 1:00 PM', location: 'Dining Hall', ageRange: 'All Ages', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30', row: 5, col: 1, span: 1 },
  { name: 'Lunch', time: '12:00 - 1:00 PM', location: 'Dining Hall', ageRange: 'All Ages', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30', row: 5, col: 2, span: 1 },
  { name: 'Lunch', time: '12:00 - 1:00 PM', location: 'Dining Hall', ageRange: 'All Ages', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30', row: 5, col: 3, span: 1 },
  { name: 'Lunch', time: '12:00 - 1:00 PM', location: 'Dining Hall', ageRange: 'All Ages', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30', row: 5, col: 4, span: 1 },

  { name: 'Canoeing', time: '2:00 - 3:00 PM', location: 'Lake', ageRange: '10-16', color: 'text-cyan-300', bg: 'bg-cyan-500/15 border-cyan-500/30', row: 7, col: 0, span: 1 },
  { name: 'Soccer', time: '2:00 - 3:30 PM', location: 'Field', ageRange: '8-14', color: 'text-green-300', bg: 'bg-green-500/15 border-green-500/30', row: 7, col: 1, span: 2 },
  { name: 'Music', time: '2:00 - 3:00 PM', location: 'Music Room', ageRange: 'All Ages', color: 'text-violet-300', bg: 'bg-violet-500/15 border-violet-500/30', row: 7, col: 2, span: 1 },
  { name: 'Ceramics', time: '2:00 - 3:30 PM', location: 'Arts Center', ageRange: '10-16', color: 'text-rose-300', bg: 'bg-rose-500/15 border-rose-500/30', row: 7, col: 3, span: 2 },
  { name: 'Free Swim', time: '2:00 - 3:00 PM', location: 'Pool', ageRange: 'All Ages', color: 'text-blue-300', bg: 'bg-blue-500/15 border-blue-500/30', row: 7, col: 4, span: 1 },

  { name: 'Campfire', time: '8:00 PM', location: 'Fire Pit', ageRange: 'All Ages', color: 'text-orange-300', bg: 'bg-orange-500/15 border-orange-500/30', row: 13, col: 0, span: 1 },
  { name: 'Movie Night', time: '8:00 PM', location: 'Amphitheater', ageRange: 'All Ages', color: 'text-indigo-300', bg: 'bg-indigo-500/15 border-indigo-500/30', row: 13, col: 2, span: 1 },
  { name: 'Stargazing', time: '8:00 PM', location: 'Hilltop', ageRange: '10+', color: 'text-slate-300', bg: 'bg-slate-500/15 border-slate-500/30', row: 13, col: 4, span: 1 },
];

export function ScheduleDemoPage() {
  const [selectedActivity, setSelectedActivity] = useState<ActivityBlock | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState(0);

  const visibleActivities = viewMode === 'week'
    ? activities
    : activities.filter((a) => a.col === selectedDay);

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
              <CalendarDays className="w-3.5 h-3.5" />
              Interactive Preview
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
              A Week at{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Camp Connect
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
              See how a typical camp week looks with our interactive schedule. Click any activity for details.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Controls */}
      <section className="px-6 pb-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            <button
              onClick={() => setViewMode('week')}
              className={cn('px-4 py-2 text-sm font-medium transition-colors', viewMode === 'week' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white hover:bg-white/5')}
            >
              Week View
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={cn('px-4 py-2 text-sm font-medium transition-colors', viewMode === 'day' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white hover:bg-white/5')}
            >
              Day View
            </button>
          </div>

          {viewMode === 'day' && (
            <div className="flex gap-2">
              {days.map((day, idx) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(idx)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                    selectedDay === idx ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 border border-white/10 hover:text-white hover:bg-white/5',
                  )}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Schedule Grid */}
      <section className="px-6 pb-24">
        <ScrollReveal>
          <div className="max-w-7xl mx-auto overflow-x-auto">
            <div className="min-w-[800px] rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm overflow-hidden">
              {/* Header */}
              <div className={cn('grid border-b border-white/10', viewMode === 'week' ? 'grid-cols-[80px_repeat(5,1fr)]' : 'grid-cols-[80px_1fr]')}>
                <div className="p-3 border-r border-white/10" />
                {viewMode === 'week'
                  ? days.map((day) => (
                      <div key={day} className="p-3 text-center text-sm font-semibold text-white border-r border-white/5 last:border-r-0">
                        {day}
                      </div>
                    ))
                  : (
                      <div className="p-3 text-center text-sm font-semibold text-white">
                        {days[selectedDay]}
                      </div>
                    )
                }
              </div>

              {/* Time Rows */}
              {timeSlots.map((time, rowIdx) => (
                <div
                  key={time}
                  className={cn('grid border-b border-white/5 last:border-b-0', viewMode === 'week' ? 'grid-cols-[80px_repeat(5,1fr)]' : 'grid-cols-[80px_1fr]')}
                >
                  <div className="p-2 text-xs text-gray-500 border-r border-white/10 flex items-start justify-end pr-3 pt-3">
                    {time}
                  </div>
                  {viewMode === 'week'
                    ? days.map((_, colIdx) => {
                        const activity = visibleActivities.find((a) => a.row === rowIdx && a.col === colIdx);
                        return (
                          <div key={colIdx} className="p-1 min-h-[48px] border-r border-white/5 last:border-r-0">
                            {activity && (
                              <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: (rowIdx * 0.02) + (colIdx * 0.05) }}
                                onClick={() => setSelectedActivity(activity)}
                                className={cn(
                                  'w-full text-left rounded-lg border px-2.5 py-2 text-xs transition-all hover:scale-[1.02] hover:shadow-lg',
                                  activity.bg,
                                )}
                                style={activity.span && activity.span > 1 ? { minHeight: `${activity.span * 48}px` } : undefined}
                              >
                                <span className={cn('font-semibold block', activity.color)}>{activity.name}</span>
                                <span className="text-gray-500 text-[10px]">{activity.time}</span>
                              </motion.button>
                            )}
                          </div>
                        );
                      })
                    : (() => {
                        const activity = visibleActivities.find((a) => a.row === rowIdx);
                        return (
                          <div className="p-1 min-h-[48px]">
                            {activity && (
                              <motion.button
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: rowIdx * 0.03 }}
                                onClick={() => setSelectedActivity(activity)}
                                className={cn('w-full text-left rounded-lg border px-3 py-3 text-sm transition-all hover:scale-[1.01]', activity.bg)}
                              >
                                <span className={cn('font-semibold', activity.color)}>{activity.name}</span>
                                <span className="text-gray-400 ml-2">&middot; {activity.location}</span>
                              </motion.button>
                            )}
                          </div>
                        );
                      })()
                  }
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setSelectedActivity(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={cn('w-full max-w-md rounded-2xl border bg-[#12121a] p-6', selectedActivity.bg.replace('bg-', 'border-').split(' ')[1])}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h3 className={cn('text-xl font-bold', selectedActivity.color)}>
                {selectedActivity.name}
              </h3>
              <button onClick={() => setSelectedActivity(null)} className="rounded p-1 text-gray-400 hover:text-white hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                {selectedActivity.time}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4" />
                {selectedActivity.location}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Users className="w-4 h-4" />
                Ages {selectedActivity.ageRange}
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              This is a sample activity from the Camp Connect schedule demo. In the real app, you can customize every detail.
            </p>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
