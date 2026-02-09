import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function CTASection() {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-emerald-950/40 to-emerald-900/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(16,185,129,0.15)_0%,_transparent_60%)]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-4xl mx-auto text-center"
      >
        <h2 className="text-3xl md:text-5xl font-bold text-white">
          Ready to Transform Your Camp?
        </h2>
        <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
          Join hundreds of camps already using Camp Connect. Start your free
          trial today.
        </p>

        <div className="mt-10">
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-[#0a0a0f] bg-white hover:bg-gray-100 rounded-xl transition-colors duration-200 shadow-xl shadow-white/10"
          >
            Get Started Free
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            No credit card required
          </p>
        </div>
      </motion.div>
    </section>
  );
}
