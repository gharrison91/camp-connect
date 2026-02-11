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
  src: string;
  color: string;
  aspect: 'square' | 'tall' | 'wide';
}

const categories = ['All', 'Activities', 'Nature', 'Campers', 'Facilities', 'Events'];

const images: GalleryImage[] = [
  { id: 1, category: 'Activities', alt: 'Swimming at the lake', src: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&h=400&fit=crop', color: 'from-blue-500/30 to-cyan-500/30', aspect: 'wide' },
  { id: 2, category: 'Nature', alt: 'Sunrise over the mountains', src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=400&fit=crop', color: 'from-amber-500/30 to-orange-500/30', aspect: 'tall' },
  { id: 3, category: 'Campers', alt: 'Campfire sing-along', src: 'https://images.unsplash.com/photo-1475483768296-6163e08872a1?w=600&h=400&fit=crop', color: 'from-red-500/30 to-amber-500/30', aspect: 'square' },
  { id: 4, category: 'Facilities', alt: 'Main lodge exterior', src: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=600&h=400&fit=crop', color: 'from-emerald-500/30 to-teal-500/30', aspect: 'square' },
  { id: 5, category: 'Activities', alt: 'Arts and crafts session', src: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop', color: 'from-purple-500/30 to-pink-500/30', aspect: 'tall' },
  { id: 6, category: 'Events', alt: 'Color war opening ceremony', src: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&h=400&fit=crop', color: 'from-pink-500/30 to-rose-500/30', aspect: 'wide' },
  { id: 7, category: 'Nature', alt: 'Trail through the forest', src: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop', color: 'from-green-500/30 to-emerald-500/30', aspect: 'square' },
  { id: 8, category: 'Activities', alt: 'Rock climbing wall', src: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&h=400&fit=crop', color: 'from-indigo-500/30 to-blue-500/30', aspect: 'square' },
  { id: 9, category: 'Campers', alt: 'Bunk group photo', src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop', color: 'from-yellow-500/30 to-amber-500/30', aspect: 'wide' },
  { id: 10, category: 'Facilities', alt: 'Pool and waterslide', src: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&h=400&fit=crop', color: 'from-cyan-500/30 to-blue-500/30', aspect: 'tall' },
  { id: 11, category: 'Events', alt: 'Talent show performance', src: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=400&fit=crop', color: 'from-violet-500/30 to-purple-500/30', aspect: 'square' },
  { id: 12, category: 'Nature', alt: 'Stargazing by the lake', src: 'https://images.unsplash.com/photo-1475274047050-1d0c55b0033b?w=600&h=400&fit=crop', color: 'from-slate-500/30 to-indigo-500/30', aspect: 'wide' },
  { id: 13, category: 'Activities', alt: 'Archery range', src: 'https://images.unsplash.com/photo-1510925758641-869d353cecc7?w=600&h=400&fit=crop', color: 'from-teal-500/30 to-green-500/30', aspect: 'square' },
  { id: 14, category: 'Campers', alt: 'Friendship bracelets', src: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=600&h=400&fit=crop', color: 'from-rose-500/30 to-pink-500/30', aspect: 'tall' },
  { id: 15, category: 'Facilities', alt: 'Dining hall interior', src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop', color: 'from-orange-500/30 to-red-500/30', aspect: 'square' },
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
                      'group relative w-full overflow-hidden rounded-2xl border border-white/10 transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-emerald-500/5',
                      img.aspect === 'tall' ? 'aspect-[3/4]' : img.aspect === 'wide' ? 'aspect-[4/3]' : 'aspect-square',
                    )}
                  >
                    {/* Fallback gradient background */}
                    <div className={cn('absolute inset-0 bg-gradient-to-br', img.color)} />
                    {/* Actual image */}
                    <img
                      src={img.src}
                      alt={img.alt}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end">
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
              className="relative w-[80vw] max-w-4xl max-h-[80vh] rounded-2xl overflow-hidden border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={filtered[lightboxIdx]?.src}
                alt={filtered[lightboxIdx]?.alt}
                className="w-full h-full object-contain bg-black/80"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <p className="text-white font-medium">{filtered[lightboxIdx]?.alt}</p>
                <p className="text-sm text-gray-300 mt-0.5">{filtered[lightboxIdx]?.category}</p>
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
