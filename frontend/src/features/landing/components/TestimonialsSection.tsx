import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface Testimonial {
  quote: string;
  name: string;
  title: string;
  camp: string;
  initials: string;
  color: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      'Camp Connect transformed how we manage registration. We went from spreadsheets to a fully automated system in one week.',
    name: 'Sarah Mitchell',
    title: 'Director',
    camp: 'Pine Ridge Adventures',
    initials: 'SM',
    color: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    quote:
      'The facial recognition feature is incredible. Parents love being able to see all photos of their child instantly.',
    name: 'Marcus Johnson',
    title: 'Operations Manager',
    camp: 'Lakewood Camp',
    initials: 'MJ',
    color: 'bg-blue-500/20 text-blue-400',
  },
  {
    quote:
      'Onboarding new staff used to take days. Now it\'s completely self-service and trackable.',
    name: 'Emily Rodriguez',
    title: 'HR Director',
    camp: 'Summit Youth Programs',
    initials: 'ER',
    color: 'bg-purple-500/20 text-purple-400',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

export function TestimonialsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <section id="testimonials" className="py-24 px-6 bg-[#0a0a0f]">
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
            Trusted by Camp Directors Nationwide
          </motion.h2>
        </div>

        {/* Testimonial Cards */}
        <motion.div
          ref={containerRef}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              variants={cardVariants}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/[0.08] transition-colors duration-300"
            >
              {/* Quote */}
              <div className="mb-6">
                <svg
                  className="w-8 h-8 text-emerald-500/40 mb-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {testimonial.quote}
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${testimonial.color}`}
                >
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">
                    {testimonial.name}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {testimonial.title}, {testimonial.camp}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
