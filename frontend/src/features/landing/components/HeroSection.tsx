import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[#0a0a0f] overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
      </div>

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.08)_0%,_transparent_70%)]" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center py-32">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold leading-tight tracking-tight text-white"
        >
          The Modern Platform for{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
            Camp Management
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-6 text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed"
        >
          Registration, communications, health forms, photo management, and
          AI-powered facial recognition &mdash; all in one platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors duration-200 shadow-lg shadow-emerald-600/20"
          >
            Start Free Trial
          </Link>
          <button
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white border border-white/20 hover:border-white/40 hover:bg-white/5 rounded-xl transition-all duration-200"
          >
            Watch Demo
          </button>
        </motion.div>
      </div>

      {/* CSS keyframe animations for orbs */}
      <style>{`
        .hero-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
        }

        .hero-orb-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(16,185,129,0.3), transparent 70%);
          top: -10%;
          left: -10%;
          animation: float1 20s ease-in-out infinite;
        }

        .hero-orb-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(59,130,246,0.25), transparent 70%);
          bottom: -15%;
          right: -10%;
          animation: float2 25s ease-in-out infinite;
        }

        .hero-orb-3 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(139,92,246,0.2), transparent 70%);
          top: 40%;
          right: 20%;
          animation: float3 18s ease-in-out infinite;
        }

        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(60px, 40px) scale(1.1); }
          66% { transform: translate(-30px, 70px) scale(0.95); }
        }

        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-50px, -30px) scale(1.05); }
          66% { transform: translate(40px, -60px) scale(0.9); }
        }

        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -50px) scale(1.08); }
          66% { transform: translate(-60px, 30px) scale(0.92); }
        }
      `}</style>
    </section>
  );
}
