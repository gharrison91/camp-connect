/**
 * Camp Connect - Blog / Resources Page
 * Marketing page showcasing camp management articles, insights, and best practices.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Clock,
  ArrowRight,
  Search,
  Mail,
  Sparkles,
  Shield,
  Cpu,
  MessageCircle,
  Users,
  TrendingUp,
} from 'lucide-react';
import { ScrollReveal } from './components/ScrollReveal';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const categories = [
  { key: 'all', label: 'All', icon: BookOpen },
  { key: 'management', label: 'Camp Management', icon: TrendingUp },
  { key: 'safety', label: 'Safety & Compliance', icon: Shield },
  { key: 'technology', label: 'Technology', icon: Cpu },
  { key: 'communication', label: 'Parent Communication', icon: MessageCircle },
  { key: 'training', label: 'Staff Training', icon: Users },
] as const;

type CategoryKey = (typeof categories)[number]['key'];

interface Article {
  id: number;
  title: string;
  excerpt: string;
  category: CategoryKey;
  categoryLabel: string;
  author: string;
  authorInitials: string;
  authorColor: string;
  date: string;
  readTime: string;
  gradient: string;
  featured?: boolean;
}

const articles: Article[] = [
  {
    id: 1,
    title: '10 Ways to Improve Camper Safety This Summer',
    excerpt:
      'From digital check-in systems to real-time GPS tracking, discover the latest strategies that leading camps are using to keep every camper safe and accounted for.',
    category: 'safety',
    categoryLabel: 'Safety & Compliance',
    author: 'Dr. Sarah Mitchell',
    authorInitials: 'SM',
    authorColor: 'bg-rose-500/20 text-rose-400',
    date: 'Jan 28, 2026',
    readTime: '8 min read',
    gradient: 'from-rose-500/20 via-orange-500/20 to-amber-500/20',
    featured: true,
  },
  {
    id: 2,
    title: 'Digital Transformation in Camp Management',
    excerpt:
      'How modern camps are replacing clipboards and spreadsheets with integrated platforms that save hours every week and reduce errors.',
    category: 'technology',
    categoryLabel: 'Technology',
    author: 'Alex Rivera',
    authorInitials: 'AR',
    authorColor: 'bg-blue-500/20 text-blue-400',
    date: 'Jan 22, 2026',
    readTime: '6 min read',
    gradient: 'from-blue-500/20 via-indigo-500/20 to-purple-500/20',
  },
  {
    id: 3,
    title: 'Building Stronger Parent-Camp Communication',
    excerpt:
      'Parents want to stay connected. Learn how automated updates, photo sharing, and real-time messaging can build trust and boost enrollment.',
    category: 'communication',
    categoryLabel: 'Parent Communication',
    author: 'Jordan Kim',
    authorInitials: 'JK',
    authorColor: 'bg-purple-500/20 text-purple-400',
    date: 'Jan 15, 2026',
    readTime: '5 min read',
    gradient: 'from-purple-500/20 via-pink-500/20 to-rose-500/20',
  },
  {
    id: 4,
    title: 'Staff Training Best Practices for Summer 2026',
    excerpt:
      'A comprehensive guide to onboarding seasonal staff quickly and effectively, with checklists, certification tracking, and mentorship programs.',
    category: 'training',
    categoryLabel: 'Staff Training',
    author: 'Morgan Lee',
    authorInitials: 'ML',
    authorColor: 'bg-amber-500/20 text-amber-400',
    date: 'Jan 10, 2026',
    readTime: '10 min read',
    gradient: 'from-amber-500/20 via-yellow-500/20 to-lime-500/20',
  },
  {
    id: 5,
    title: 'How to Use Data Analytics to Grow Your Camp',
    excerpt:
      'Enrollment trends, retention rates, and revenue forecasting -- learn how data-driven decisions can give your camp a competitive edge.',
    category: 'management',
    categoryLabel: 'Camp Management',
    author: 'Casey Zhang',
    authorInitials: 'CZ',
    authorColor: 'bg-cyan-500/20 text-cyan-400',
    date: 'Jan 5, 2026',
    readTime: '7 min read',
    gradient: 'from-emerald-500/20 via-teal-500/20 to-cyan-500/20',
  },
  {
    id: 6,
    title: 'The Complete Guide to ACA Accreditation',
    excerpt:
      'Step-by-step walkthrough of the American Camp Association accreditation process, what to expect, and how to prepare your documentation.',
    category: 'safety',
    categoryLabel: 'Safety & Compliance',
    author: 'Dr. Sarah Mitchell',
    authorInitials: 'SM',
    authorColor: 'bg-rose-500/20 text-rose-400',
    date: 'Dec 28, 2025',
    readTime: '12 min read',
    gradient: 'from-rose-500/20 via-red-500/20 to-orange-500/20',
  },
  {
    id: 7,
    title: 'AI-Powered Photo Tagging: A Game Changer for Camps',
    excerpt:
      'How facial recognition technology is helping camps deliver personalized photo albums to parents, boosting satisfaction and saving staff time.',
    category: 'technology',
    categoryLabel: 'Technology',
    author: 'Alex Rivera',
    authorInitials: 'AR',
    authorColor: 'bg-blue-500/20 text-blue-400',
    date: 'Dec 20, 2025',
    readTime: '6 min read',
    gradient: 'from-indigo-500/20 via-blue-500/20 to-sky-500/20',
  },
  {
    id: 8,
    title: 'Creating an Inclusive Camp Environment',
    excerpt:
      'Practical strategies for making your camp welcoming and accessible to campers of all abilities, backgrounds, and needs.',
    category: 'management',
    categoryLabel: 'Camp Management',
    author: 'Sam Taylor',
    authorInitials: 'ST',
    authorColor: 'bg-emerald-500/20 text-emerald-400',
    date: 'Dec 15, 2025',
    readTime: '9 min read',
    gradient: 'from-emerald-500/20 via-green-500/20 to-lime-500/20',
  },
  {
    id: 9,
    title: 'Mastering the Parent Portal Experience',
    excerpt:
      'Tips for configuring your parent-facing portal so families feel informed, involved, and confident in your camp every step of the way.',
    category: 'communication',
    categoryLabel: 'Parent Communication',
    author: 'Jordan Kim',
    authorInitials: 'JK',
    authorColor: 'bg-purple-500/20 text-purple-400',
    date: 'Dec 8, 2025',
    readTime: '5 min read',
    gradient: 'from-violet-500/20 via-purple-500/20 to-fuchsia-500/20',
  },
  {
    id: 10,
    title: 'Reducing Staff Turnover: Retention Strategies That Work',
    excerpt:
      'Camp staff turnover can be costly. Explore proven techniques for keeping your best counselors coming back summer after summer.',
    category: 'training',
    categoryLabel: 'Staff Training',
    author: 'Morgan Lee',
    authorInitials: 'ML',
    authorColor: 'bg-amber-500/20 text-amber-400',
    date: 'Dec 1, 2025',
    readTime: '7 min read',
    gradient: 'from-orange-500/20 via-amber-500/20 to-yellow-500/20',
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CategoryBadge({ label }: { label: string }) {
  return (
    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
      {label}
    </span>
  );
}

function AuthorPill({
  initials,
  name,
  color,
}: {
  initials: string;
  name: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-7 h-7 rounded-full ${color} flex items-center justify-center text-[10px] font-bold`}
      >
        {initials}
      </div>
      <span className="text-sm text-gray-400">{name}</span>
    </div>
  );
}

function FeaturedCard({ article }: { article: Article }) {
  return (
    <ScrollReveal>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.25 }}
        className="group relative rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden cursor-pointer transition-shadow duration-300 hover:shadow-xl hover:shadow-emerald-500/5 hover:border-white/20"
      >
        <div className="grid md:grid-cols-2 gap-0">
          {/* Gradient image placeholder */}
          <div
            className={`relative h-60 md:h-full min-h-[280px] bg-gradient-to-br ${article.gradient}`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-white/20" />
            </div>
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur text-white border border-white/20">
                Featured
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 flex flex-col justify-center">
            <CategoryBadge label={article.categoryLabel} />
            <h3 className="mt-4 text-2xl md:text-3xl font-bold text-white leading-tight group-hover:text-emerald-300 transition-colors">
              {article.title}
            </h3>
            <p className="mt-3 text-gray-400 leading-relaxed line-clamp-3">
              {article.excerpt}
            </p>
            <div className="mt-6 flex items-center justify-between">
              <AuthorPill
                initials={article.authorInitials}
                name={article.author}
                color={article.authorColor}
              />
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{article.date}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.readTime}
                </span>
              </div>
            </div>
            <div className="mt-6">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 group-hover:gap-3 transition-all">
                Read Article
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </ScrollReveal>
  );
}

function ArticleCard({ article, index }: { article: Article; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      layout
    >
      <motion.div
        whileHover={{ y: -6, scale: 1.02 }}
        transition={{ duration: 0.25 }}
        className="group h-full rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden cursor-pointer transition-shadow duration-300 hover:shadow-xl hover:shadow-emerald-500/5 hover:border-white/20 flex flex-col"
      >
        {/* Gradient image placeholder */}
        <div
          className={`relative h-44 bg-gradient-to-br ${article.gradient} shrink-0`}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-white/20" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          <CategoryBadge label={article.categoryLabel} />
          <h3 className="mt-3 text-lg font-semibold text-white leading-snug group-hover:text-emerald-300 transition-colors line-clamp-2">
            {article.title}
          </h3>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed line-clamp-2 flex-1">
            {article.excerpt}
          </p>

          <div className="mt-5 flex items-center justify-between pt-4 border-t border-white/5">
            <AuthorPill
              initials={article.authorInitials}
              name={article.author}
              color={article.authorColor}
            />
            <div className="flex flex-col items-end gap-0.5 text-xs text-gray-500">
              <span>{article.date}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {article.readTime}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const featuredArticle = articles.find((a) => a.featured)!;

  const filteredArticles = articles
    .filter((a) => !a.featured)
    .filter(
      (a) => activeCategory === 'all' || a.category === activeCategory,
    )
    .filter(
      (a) =>
        searchQuery === '' ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()),
    );

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
              <Sparkles className="w-3.5 h-3.5" />
              Blog &amp; Resources
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Resources &amp; Insights
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Best practices, expert guides, and actionable tips to help you run
              a safer, smarter, and more connected camp. Written by camp
              professionals, for camp professionals.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search + Category Filters */}
      <section className="px-6 pb-10">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal delay={0.1}>
            <div className="relative max-w-md mx-auto mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
              />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                      isActive
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Featured Article */}
      <section className="px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          {(activeCategory === 'all' ||
            featuredArticle.category === activeCategory) &&
          searchQuery === '' ? (
            <FeaturedCard article={featuredArticle} />
          ) : null}
        </div>
      </section>

      {/* Article Grid */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {filteredArticles.length > 0 ? (
              <motion.div
                key={activeCategory + searchQuery}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredArticles.map((article, i) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    index={i}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white">
                  No articles found
                </h3>
                <p className="mt-2 text-gray-400">
                  Try adjusting your search or filter to find what you are
                  looking for.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="px-6 pb-24">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white/5 to-blue-500/10 border border-white/10 backdrop-blur-sm p-8 md:p-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 mb-6">
              <Mail className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Stay in the Loop
            </h2>
            <p className="mt-3 text-gray-400 max-w-lg mx-auto">
              Get the latest camp management insights, product updates, and
              expert tips delivered straight to your inbox. No spam, unsubscribe
              anytime.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="you@yourcamp.com"
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
              />
              <button
                type="button"
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-600/20 whitespace-nowrap"
              >
                Subscribe
              </button>
            </div>
            <p className="mt-4 text-xs text-gray-600">
              Join 2,500+ camp professionals who read our weekly newsletter.
            </p>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
