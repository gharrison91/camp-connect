/**
 * Camp Connect - Photo Gallery Page
 * Masonry-style gallery with category filters and lightbox.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GalleryImage {
  id: number;
  category: string;
  alt: string;
  color: string; // Placeholder gradient color
  aspect: 'square' | 'tall' | 'wide';
}

const categories = ['All', 'Activities', 'Nature', 'Campers', 'Facilities', 'Events'];

// Placeholder gallery data (will use colored gradient cards until real images)
const images: GalleryImage[] = [
  { id: 1, category: 'Activities', alt: 'Swimming at the lake', color: 'from-blue-500/30 to-cyan-500/30', aspect: 'wide' },
  { id: 2, category: 'Nature', alt: 'Sunrise over the mountains', color: 'from-amber-500/30 to-orange-500/30', aspect: 'tall' },
  { id: 3, category: 'Campers', alt: 'Campfire sing-along', color: 'from-red-500/30 to-amber-500/30', aspect: 'square' },
  { id: 4, category: 'Facilities', alt: 'Main lodge exterior', color: 'from-emerald-500/30 to-teal-500/30', aspect: 'square' },
  { id: 5, category: 'Activities', alt: 'Arts and crafts session', color: 'from-purple-500/30 to-pink-500/30', aspect: 'tall' },
  { id: 6, category: 'Events', alt: 'Color war opening ceremony', color: 'from-pink-500/30 to-rose-500/30', aspect: 'wide' },
  { id: 7, category: 'Nature', alt: 'Trail through the forest', color: 'from-green-500/30 to-emerald-500/30', aspect: 'square' },
  { id: 8, category: 'Activities', alt: 'Rock climbing wall', color: 'from-indigo-500/30 to-blue-500/30', aspect: 'square' },
  { id: 9, category: 'Campers', alt: 'Bunk group photo', color: 'from-yellow-500/30 to-amber-500/30', aspect: 'wide' },
  { id: 10, category: 'Facilities', alt: 'Pool and waterslide', color: 'from-cyan-500/30 to-blue-500/30', aspect: 'tall' },
  { id: 11, category: 'Events', alt: 'Talent show performance', color: 'from-violet-500/30 to-purple-500/30', aspect: 'square' },
  { id: 12, category: 'Nature', alt: 'Stargazing by the lake', color: 'from-slate-500/30 to-indigo-500/30', aspect: 'wide' },
  { id: 13, category: 'Activities', alt: 'Archery range', color: 'from-teal-500/30 to-green-500/30', aspect: 'square' },
  { id: 14, category: 'Campers', alt: 'Friendship bracelets', color: 'from-rose-500/30 to-pink-500/30', aspect: 'tall' },
  { id: 15, category: 'Facilities', alt: 'Dining hall interior', color: 'from-orange-500/30 to-red-500/30', aspect: 'square' },
];

export function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const filtered = activeCategory === 'All'
    ? images
    : images.filter((img) => img.category === activeCategory);

  const openLightbox = (idx: number) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);
  const nextImage = () => {
    if (lightboxIdx !== null) setLightboxIdx((lightboxIdx + 1) % filtered.length);
  };
  const prevImage = () => {
    if (lightboxIdx !== null) setLightboxIdx((lightboxIdx - 1 + filtered.length) % filtered.length);
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
              <Camera className="w-3.5 h-3.5" />
              Camp Life
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
              Moments That{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Matter
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
              Explore the camp experience through our gallery. Every adventure, friendship, and memory captured in one place.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="px-6 pb-8">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-medium transition-all duration-200',
                activeCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Masonry Grid */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            layout
            className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((img, idx) => (
                <motion.div
                  key={img.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                  className="break-inside-avoid"
                >
                  <button
                    onClick={() => openLightbox(idx)}
                    className={cn(
                      'group relative w-full overflow-hidden rounded-2xl bg-gradient-to-br border border-white/10 transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-emerald-500/5',
                      img.color,
                      img.aspect === 'tall' ? 'aspect-[3/4]' : img.aspect === 'wide' ? 'aspect-[4/3]' : 'aspect-square',
                    )}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white/20" />
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end">
                      <div className="p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-sm font-medium text-white">{img.alt}</p>
                        <p className="text-xs text-gray-300 mt-0.5">{img.category}</p>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 md:left-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <motion.div
              key={lightboxIdx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                'w-[80vw] max-w-3xl rounded-2xl bg-gradient-to-br border border-white/10 aspect-video flex items-center justify-center',
                filtered[lightboxIdx]?.color,
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <Camera className="w-12 h-12 text-white/30 mx-auto" />
                <p className="mt-3 text-white font-medium">{filtered[lightboxIdx]?.alt}</p>
                <p className="text-sm text-gray-400 mt-1">{filtered[lightboxIdx]?.category}</p>
              </div>
            </motion.div>

            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 md:right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-gray-400">
              {lightboxIdx + 1} / {filtered.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
