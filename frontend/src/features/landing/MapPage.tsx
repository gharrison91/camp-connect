/**
 * Camp Connect - Interactive Camp Map Page
 * Illustrated camp map with clickable location markers and detail popups.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Waves,
  Target,
  Palette,
  Mountain,
  UtensilsCrossed,
  Flame,
  Trophy,
  TreePine,
  Home,
  Building2,
  Droplets,
  Drama,
  MapPin,
  X,
  Clock,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { ScrollReveal } from './components/ScrollReveal';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface CampLocation {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  colorBg: string;
  colorBorder: string;
  colorGlow: string;
  /** Position as percentage of the map container */
  top: string;
  left: string;
  description: string;
  capacity: string;
  schedule: string;
  highlights: string[];
}

const campLocations: CampLocation[] = [
  {
    id: 'lake',
    name: 'Lake / Swimming',
    icon: Waves,
    color: 'text-blue-400',
    colorBg: 'bg-blue-500/20',
    colorBorder: 'border-blue-500/40',
    colorGlow: 'shadow-blue-500/30',
    top: '25%',
    left: '18%',
    description: 'Crystal-clear lake with a sandy beach, swimming docks, and canoe launch. Certified lifeguards on duty during all swim periods.',
    capacity: '60 campers',
    schedule: '9:00 AM - 12:00 PM, 2:00 PM - 5:00 PM',
    highlights: ['Swimming lessons', 'Canoeing & kayaking', 'Fishing dock'],
  },
  {
    id: 'archery',
    name: 'Archery Range',
    icon: Target,
    color: 'text-red-400',
    colorBg: 'bg-red-500/20',
    colorBorder: 'border-red-500/40',
    colorGlow: 'shadow-red-500/30',
    top: '18%',
    left: '58%',
    description: 'Professional-grade archery range with 12 lanes, adjustable targets, and certified instructors for all skill levels.',
    capacity: '24 campers',
    schedule: '10:00 AM - 12:00 PM, 3:00 PM - 5:00 PM',
    highlights: ['Beginner to advanced', 'Tournament events', 'Safety certified'],
  },
  {
    id: 'arts',
    name: 'Arts & Crafts',
    icon: Palette,
    color: 'text-purple-400',
    colorBg: 'bg-purple-500/20',
    colorBorder: 'border-purple-500/40',
    colorGlow: 'shadow-purple-500/30',
    top: '42%',
    left: '72%',
    description: 'Bright, open-air studio with supplies for painting, pottery, jewelry making, tie-dye, and more creative activities.',
    capacity: '30 campers',
    schedule: '9:00 AM - 12:00 PM, 1:00 PM - 4:00 PM',
    highlights: ['Pottery wheel studio', 'Tie-dye station', 'Art exhibitions'],
  },
  {
    id: 'climbing',
    name: 'Rock Climbing',
    icon: Mountain,
    color: 'text-orange-400',
    colorBg: 'bg-orange-500/20',
    colorBorder: 'border-orange-500/40',
    colorGlow: 'shadow-orange-500/30',
    top: '12%',
    left: '82%',
    description: 'A 40-foot climbing wall with routes for every skill level, plus a bouldering cave. All equipment provided.',
    capacity: '16 campers',
    schedule: '10:00 AM - 12:00 PM, 2:00 PM - 4:30 PM',
    highlights: ['Belayed top-rope routes', 'Bouldering wall', 'Rappelling'],
  },
  {
    id: 'dining',
    name: 'Dining Hall',
    icon: UtensilsCrossed,
    color: 'text-amber-400',
    colorBg: 'bg-amber-500/20',
    colorBorder: 'border-amber-500/40',
    colorGlow: 'shadow-amber-500/30',
    top: '55%',
    left: '45%',
    description: 'Spacious dining hall serving three meals daily with salad bar, allergy-friendly options, and themed dinner nights.',
    capacity: '250 campers',
    schedule: 'Breakfast 7:30 AM, Lunch 12:30 PM, Dinner 6:00 PM',
    highlights: ['Farm-to-table options', 'Allergy accommodations', 'Theme nights'],
  },
  {
    id: 'campfire',
    name: 'Campfire Circle',
    icon: Flame,
    color: 'text-rose-400',
    colorBg: 'bg-rose-500/20',
    colorBorder: 'border-rose-500/40',
    colorGlow: 'shadow-rose-500/30',
    top: '70%',
    left: '25%',
    description: 'Stone-ringed campfire amphitheater surrounded by log seating. The heart of evening programs, songs, and s\'mores.',
    capacity: '200 campers',
    schedule: 'Evening programs 7:30 PM - 9:00 PM',
    highlights: ['Nightly sing-alongs', 'S\'mores nights', 'Stargazing events'],
  },
  {
    id: 'sports',
    name: 'Sports Fields',
    icon: Trophy,
    color: 'text-green-400',
    colorBg: 'bg-green-500/20',
    colorBorder: 'border-green-500/40',
    colorGlow: 'shadow-green-500/30',
    top: '35%',
    left: '35%',
    description: 'Multi-purpose fields including a full soccer pitch, baseball diamond, basketball courts, and volleyball courts.',
    capacity: '80 campers',
    schedule: '9:00 AM - 5:00 PM daily',
    highlights: ['Soccer & baseball', 'Basketball courts', 'Color War events'],
  },
  {
    id: 'trails',
    name: 'Hiking Trails',
    icon: TreePine,
    color: 'text-emerald-400',
    colorBg: 'bg-emerald-500/20',
    colorBorder: 'border-emerald-500/40',
    colorGlow: 'shadow-emerald-500/30',
    top: '8%',
    left: '38%',
    description: 'Over 5 miles of marked trails winding through forest, meadows, and scenic overlooks. Nature guides available.',
    capacity: '40 campers per group',
    schedule: 'Morning hikes 8:00 AM, Sunset hikes 5:30 PM',
    highlights: ['Nature identification', 'Scenic overlooks', 'Wildlife spotting'],
  },
  {
    id: 'cabins',
    name: 'Cabins / Bunks',
    icon: Home,
    color: 'text-indigo-400',
    colorBg: 'bg-indigo-500/20',
    colorBorder: 'border-indigo-500/40',
    colorGlow: 'shadow-indigo-500/30',
    top: '78%',
    left: '70%',
    description: 'Comfortable wooden cabins housing 8-10 campers each, with bunk beds, cubbies, and screened porches.',
    capacity: '8-10 per cabin, 20 cabins',
    schedule: 'Quiet hours 9:30 PM - 7:00 AM',
    highlights: ['Screened porches', 'Bathroom facilities', 'Counselor quarters'],
  },
  {
    id: 'lodge',
    name: 'Main Lodge',
    icon: Building2,
    color: 'text-teal-400',
    colorBg: 'bg-teal-500/20',
    colorBorder: 'border-teal-500/40',
    colorGlow: 'shadow-teal-500/30',
    top: '60%',
    left: '58%',
    description: 'Central hub with front office, nurse station, camp store, indoor lounge, and rainy-day activity space.',
    capacity: '150 people',
    schedule: 'Office hours 8:00 AM - 8:00 PM',
    highlights: ['Camp store', 'Nurse station', 'Indoor activities'],
  },
  {
    id: 'pool',
    name: 'Pool',
    icon: Droplets,
    color: 'text-cyan-400',
    colorBg: 'bg-cyan-500/20',
    colorBorder: 'border-cyan-500/40',
    colorGlow: 'shadow-cyan-500/30',
    top: '40%',
    left: '12%',
    description: 'Olympic-size heated pool with diving boards, water slide, and shallow wading area for beginners.',
    capacity: '50 campers',
    schedule: '10:00 AM - 12:00 PM, 1:00 PM - 4:00 PM',
    highlights: ['Water slide', 'Diving boards', 'Swim instruction'],
  },
  {
    id: 'amphitheater',
    name: 'Amphitheater',
    icon: Drama,
    color: 'text-violet-400',
    colorBg: 'bg-violet-500/20',
    colorBorder: 'border-violet-500/40',
    colorGlow: 'shadow-violet-500/30',
    top: '82%',
    left: '42%',
    description: 'Outdoor performance venue with tiered seating, stage lighting, and a full sound system for talent shows and plays.',
    capacity: '300 spectators',
    schedule: 'Shows Fri & Sat 7:00 PM',
    highlights: ['Talent shows', 'Camp plays', 'Movie nights'],
  },
];

/* ------------------------------------------------------------------ */
/*  Location Pin Component (Desktop Map)                               */
/* ------------------------------------------------------------------ */

function LocationPin({
  location,
  isSelected,
  onClick,
}: {
  location: CampLocation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon = location.icon;

  return (
    <motion.button
      onClick={onClick}
      className="absolute z-10 group flex flex-col items-center"
      style={{ top: location.top, left: location.left }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Pin */}
      <div
        className={`
          relative w-11 h-11 rounded-full flex items-center justify-center
          border-2 ${location.colorBorder} ${location.colorBg}
          backdrop-blur-sm cursor-pointer
          transition-shadow duration-300
          ${isSelected ? `shadow-lg ${location.colorGlow} ring-2 ring-white/30` : `group-hover:shadow-lg ${location.colorGlow}`}
        `}
      >
        <Icon className={`w-5 h-5 ${location.color}`} />
        {/* Pulse ring */}
        <span
          className={`absolute inset-0 rounded-full ${location.colorBg} animate-ping opacity-30`}
          style={{ animationDuration: '3s' }}
        />
      </div>
      {/* Label */}
      <span className="mt-1.5 text-[11px] font-medium text-white/80 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full whitespace-nowrap border border-white/10">
        {location.name}
      </span>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/*  Detail Card (popup)                                                */
/* ------------------------------------------------------------------ */

function DetailCard({
  location,
  onClose,
}: {
  location: CampLocation;
  onClose: () => void;
}) {
  const Icon = location.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[380px] max-w-[calc(100vw-3rem)]"
    >
      <div className={`rounded-2xl bg-[#141420]/95 backdrop-blur-xl border ${location.colorBorder} shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 ${location.colorBg}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${location.colorBg} border ${location.colorBorder} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${location.color}`} />
            </div>
            <h3 className="text-white font-semibold text-lg">{location.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <p className="text-gray-300 text-sm leading-relaxed">{location.description}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Capacity</p>
                <p className="text-sm text-white">{location.capacity}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Schedule</p>
                <p className="text-sm text-white">{location.schedule}</p>
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="flex flex-wrap gap-2">
            {location.highlights.map((h) => (
              <span
                key={h}
                className={`text-xs px-2.5 py-1 rounded-full ${location.colorBg} ${location.color} border ${location.colorBorder}`}
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile Location Card                                               */
/* ------------------------------------------------------------------ */

function MobileLocationCard({
  location,
  isExpanded,
  onToggle,
}: {
  location: CampLocation;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = location.icon;

  return (
    <motion.div
      layout
      className={`rounded-2xl bg-white/5 backdrop-blur-sm border transition-colors duration-300 overflow-hidden ${
        isExpanded ? `${location.colorBorder} bg-white/[0.08]` : 'border-white/10'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div
          className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border ${location.colorBg} ${location.colorBorder}`}
        >
          <Icon className={`w-5 h-5 ${location.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white font-medium text-sm">{location.name}</p>
          <p className="text-gray-500 text-xs truncate">{location.capacity}</p>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-500"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <p className="text-gray-300 text-sm leading-relaxed">{location.description}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Capacity</p>
                    <p className="text-sm text-white">{location.capacity}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Schedule</p>
                    <p className="text-sm text-white">{location.schedule}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {location.highlights.map((h) => (
                  <span
                    key={h}
                    className={`text-xs px-2.5 py-1 rounded-full ${location.colorBg} ${location.color} border ${location.colorBorder}`}
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Legend Sidebar                                                      */
/* ------------------------------------------------------------------ */

function LegendSidebar({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="w-72 shrink-0 space-y-1.5">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
        Locations
      </h3>
      {campLocations.map((loc) => {
        const Icon = loc.icon;
        const isActive = selected === loc.id;
        return (
          <button
            key={loc.id}
            onClick={() => onSelect(loc.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
              isActive
                ? `${loc.colorBg} ${loc.colorBorder} border shadow-lg ${loc.colorGlow}`
                : 'border border-transparent hover:bg-white/5'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${loc.colorBg}`}
            >
              <Icon className={`w-4 h-4 ${loc.color}`} />
            </div>
            <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
              {loc.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Decorative Map Elements                                            */
/* ------------------------------------------------------------------ */

function MapDecorations() {
  return (
    <>
      {/* Subtle tree clusters */}
      {[
        { top: '15%', left: '5%', opacity: 0.15 },
        { top: '50%', left: '90%', opacity: 0.12 },
        { top: '85%', left: '10%', opacity: 0.1 },
        { top: '5%', left: '65%', opacity: 0.13 },
        { top: '65%', left: '85%', opacity: 0.11 },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute text-emerald-400 pointer-events-none"
          style={{ top: pos.top, left: pos.left, opacity: pos.opacity }}
        >
          <TreePine className="w-8 h-8" />
        </div>
      ))}

      {/* Dotted path lines (decorative) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.08 }}>
        <path
          d="M 18% 30% Q 30% 40%, 35% 40% T 45% 55% T 58% 58% T 70% 75%"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeDasharray="6 8"
          className="[vector-effect:non-scaling-stroke]"
        />
        <path
          d="M 12% 45% Q 20% 50%, 35% 40% T 55% 20% T 80% 15%"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeDasharray="6 8"
          className="[vector-effect:non-scaling-stroke]"
        />
      </svg>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export function MapPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileExpandedId, setMobileExpandedId] = useState<string | null>(null);

  const selectedLocation = campLocations.find((l) => l.id === selectedId) ?? null;

  function handlePinClick(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  function handleLegendSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  function handleMobileToggle(id: string) {
    setMobileExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <main>
      {/* ---- Hero ---- */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.08)_0%,_transparent_50%)]" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 mb-6">
              <MapPin className="w-3.5 h-3.5" />
              Virtual Tour
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
              Explore Our{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Campus
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
              Discover every corner of our 200-acre campus. Click any location to learn about
              facilities, activities, and schedules.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ---- Desktop Map + Sidebar ---- */}
      <section className="hidden lg:block pb-24 px-6">
        <ScrollReveal>
          <div className="max-w-7xl mx-auto flex gap-8">
            {/* Sidebar legend */}
            <LegendSidebar selected={selectedId} onSelect={handleLegendSelect} />

            {/* Map container */}
            <div className="flex-1 relative">
              <div
                className="relative w-full rounded-3xl border border-white/10 overflow-hidden"
                style={{
                  aspectRatio: '16 / 10',
                  background:
                    'radial-gradient(ellipse at 30% 40%, rgba(16,100,60,0.25) 0%, transparent 50%), ' +
                    'radial-gradient(ellipse at 70% 60%, rgba(30,80,50,0.2) 0%, transparent 50%), ' +
                    'radial-gradient(ellipse at 50% 80%, rgba(60,40,20,0.15) 0%, transparent 40%), ' +
                    'linear-gradient(135deg, #0d1a12 0%, #0f1510 30%, #111714 60%, #0d130f 100%)',
                }}
              >
                {/* Decorative elements */}
                <MapDecorations />

                {/* Location pins */}
                {campLocations.map((loc) => (
                  <LocationPin
                    key={loc.id}
                    location={loc}
                    isSelected={selectedId === loc.id}
                    onClick={() => handlePinClick(loc.id)}
                  />
                ))}

                {/* Detail popup */}
                <AnimatePresence>
                  {selectedLocation && (
                    <DetailCard
                      key={selectedLocation.id}
                      location={selectedLocation}
                      onClose={() => setSelectedId(null)}
                    />
                  )}
                </AnimatePresence>

                {/* Compass rose (decorative) */}
                <div className="absolute bottom-4 right-4 w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-600 select-none pointer-events-none">
                  <span className="text-[10px] font-bold tracking-widest">N</span>
                  <div className="absolute w-px h-4 bg-gray-600 top-2 left-1/2 -translate-x-1/2" />
                  <div className="absolute w-px h-4 bg-gray-700 bottom-2 left-1/2 -translate-x-1/2" />
                  <div className="absolute h-px w-4 bg-gray-700 left-2 top-1/2 -translate-y-1/2" />
                  <div className="absolute h-px w-4 bg-gray-700 right-2 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ---- Mobile Card Grid ---- */}
      <section className="lg:hidden pb-20 px-6">
        <div className="max-w-lg mx-auto space-y-3">
          {campLocations.map((loc, idx) => (
            <ScrollReveal key={loc.id} delay={idx * 0.04}>
              <MobileLocationCard
                location={loc}
                isExpanded={mobileExpandedId === loc.id}
                onToggle={() => handleMobileToggle(loc.id)}
              />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ---- Stats Bar ---- */}
      <section className="pb-24 px-6">
        <ScrollReveal>
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Acres', value: '200+' },
              { label: 'Facilities', value: '12' },
              { label: 'Activities', value: '40+' },
              { label: 'Camper Capacity', value: '500' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center"
              >
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ---- CTA ---- */}
      <section className="pb-24 px-6">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to See It{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                In Person?
              </span>
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Schedule a campus tour or try an interactive demo of our camp management platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/schedule-demo"
                className="px-8 py-3.5 rounded-xl text-white font-medium bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
              >
                Schedule a Tour
              </a>
              <a
                href="/contact"
                className="px-8 py-3.5 rounded-xl text-gray-300 font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
