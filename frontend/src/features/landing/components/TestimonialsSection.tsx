import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, MapPin, Quote } from 'lucide-react';

interface Testimonial {
  quote: string;
  name: string;
  title: string;
  camp: string;
  location: string;
  initials: string;
  color: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    quote:
      'Camp Connect transformed how we manage registration. We went from spreadsheets to a fully automated system in one week. Our staff saves 20+ hours weekly.',
    name: 'Sarah Mitchell',
    title: 'Director',
    camp: 'Pine Ridge Adventures',
    location: 'Lake Tahoe, CA',
    initials: 'SM',
    color: 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30',
    rating: 5,
  },
  {
    quote:
      'The facial recognition feature is incredible. Parents love being able to see all photos of their child instantly. It has become our biggest selling point for enrollment.',
    name: 'Marcus Johnson',
    title: 'Operations Manager',
    camp: 'Lakewood Camp',
    location: 'Adirondacks, NY',
    initials: 'MJ',
    color: 'bg-blue-500/20 text-blue-400 ring-blue-500/30',
    rating: 5,
  },
  {
    quote:
      "Onboarding new staff used to take days. Now it's completely self-service and trackable. The workflow builder alone is worth the subscription.",
    name: 'Emily Rodriguez',
    title: 'HR Director',
    camp: 'Summit Youth Programs',
    location: 'Asheville, NC',
    initials: 'ER',
    color: 'bg-purple-500/20 text-purple-400 ring-purple-500/30',
    rating: 5,
  },
  {
    quote:
      'We tried 4 other platforms before Camp Connect. Nothing else comes close to the depth of features and the polish of the interface. Our parents rave about the portal.',
    name: 'David Chen',
    title: 'Executive Director',
    camp: 'Evergreen Day Camp',
    location: 'Portland, OR',
    initials: 'DC',
    color: 'bg-amber-500/20 text-amber-400 ring-amber-500/30',
    rating: 5,
  },
  {
    quote:
      'Health form management used to be our biggest headache. Now everything is digital, organized, and accessible to our nurses in seconds. A total game changer.',
    name: 'Rachel Thompson',
    title: 'Camp Nurse',
    camp: 'Whispering Pines',
    location: 'Pocono Mountains, PA',
    initials: 'RT',
    color: 'bg-rose-500/20 text-rose-400 ring-rose-500/30',
    rating: 5,
  },
  {
    quote:
      'The analytics dashboard gives me a real-time pulse on camp operations. I can make data-driven decisions instead of guessing. Revenue is up 30% since switching.',
    name: 'James Parker',
    title: 'Owner',
    camp: 'Sunshine Valley Camp',
    location: 'Blue Ridge, GA',
    initials: 'JP',
    color: 'bg-teal-500/20 text-teal-400 ring-teal-500/30',
    rating: 5,
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-600'
          }`}
        />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <section id="testimonials" className="py-24 px-6 bg-[#0a0a0f] relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 mb-6"
          >
            Testimonials
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-bold text-white"
          >
            Trusted by Camp Directors{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Nationwide
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-gray-400 max-w-2xl mx-auto"
          >
            See why hundreds of camps have switched to Camp Connect for their management needs.
          </motion.p>
        </div>

        {/* Testimonial Cards */}
        <motion.div
          ref={containerRef}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              variants={cardVariants}
              className="group relative bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-1"
            >
              {/* Gradient accent on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-emerald-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="relative">
                {/* Quote icon + stars row */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Quote className="w-5 h-5 text-emerald-500/60" />
                  </div>
                  <StarRating rating={testimonial.rating} />
                </div>

                {/* Quote text */}
                <p className="text-gray-300 leading-relaxed text-[15px] mb-6">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-5" />

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ring-2 ${testimonial.color}`}
                  >
                    {testimonial.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">
                      {testimonial.name}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {testimonial.title}, {testimonial.camp}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-gray-600" />
                      <p className="text-gray-600 text-xs">{testimonial.location}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
