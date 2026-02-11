/**
 * Camp Connect – Public Camp Directory
 * Browse and search for camps (marketing page, no auth required).
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Star,
  ChevronLeft,
  ChevronRight,
  Tent,
  Sun,
  ArrowRight,
} from 'lucide-react'
import { useDirectorySearch, useFeaturedCamps } from '@/hooks/useCampDirectory'
import type { CampProfile } from '@/types'

const CAMP_TYPES = ['', 'day_camp', 'overnight', 'specialty', 'sports', 'arts', 'stem', 'religious']
const TYPE_LABELS: Record<string, string> = {
  '': 'All Types',
  day_camp: 'Day Camp',
  overnight: 'Overnight',
  specialty: 'Specialty',
  sports: 'Sports',
  arts: 'Arts',
  stem: 'STEM',
  religious: 'Religious',
}

const US_STATES = [
  '', 'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

const PER_PAGE = 12

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  )
}

function CampCard({ camp, index }: { camp: CampProfile; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100">
        {camp.cover_image_url ? (
          <img src={camp.cover_image_url} alt={camp.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Tent className="h-16 w-16 text-emerald-300" />
          </div>
        )}
        {camp.camp_type && camp.camp_type.length > 0 && (
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-gray-700 backdrop-blur-sm">
            {TYPE_LABELS[camp.camp_type[0]] || camp.camp_type[0]}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{camp.name}</h3>
          {camp.logo_url && (
            <img src={camp.logo_url} alt="" className="h-8 w-8 rounded-md object-contain shrink-0" />
          )}
        </div>

        {(camp.city || camp.state) && (
          <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="h-3.5 w-3.5" />
            {[camp.city, camp.state].filter(Boolean).join(', ')}
          </p>
        )}

        {camp.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{camp.description}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {camp.age_range_min != null && camp.age_range_max != null && (
            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              <Users className="h-3 w-3" /> Ages {camp.age_range_min}–{camp.age_range_max}
            </span>
          )}
          {camp.price_range_min != null && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              <DollarSign className="h-3 w-3" /> From ${camp.price_range_min}
            </span>
          )}
          {camp.session_dates && camp.session_dates.length > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">
              <Calendar className="h-3 w-3" /> {camp.session_dates.length} sessions
            </span>
          )}
        </div>

        {camp.rating != null && camp.rating > 0 && (
          <div className="mt-3">
            <StarRating rating={camp.rating} />
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          {camp.website_url ? (
            <a
              href={camp.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Visit Website
            </a>
          ) : (
            <span />
          )}
          {camp.slug && (
            <Link
              to={`/directory/${camp.slug}`}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            >
              Learn More <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function CampDirectoryPage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [campType, setCampType] = useState('')
  const [state, setState] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useDirectorySearch({
    q: search || undefined,
    camp_type: campType || undefined,
    state: state || undefined,
    skip: page * PER_PAGE,
    limit: PER_PAGE,
  })

  const { data: featured } = useFeaturedCamps()

  const items = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PER_PAGE)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-4 py-20 text-center">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvc3ZnPg==')] opacity-60" />
        <div className="relative mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white/90 backdrop-blur-sm">
              <Sun className="h-4 w-4" /> Summer 2026 Camps
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-4xl font-bold text-white sm:text-5xl"
          >
            Find Your Perfect Camp
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 text-lg text-white/80"
          >
            Browse hundreds of camps across the country
          </motion.p>

          {/* Search bar */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-auto mt-8 flex max-w-xl overflow-hidden rounded-xl bg-white shadow-xl"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by camp name, location, or activity..."
                className="w-full py-4 pl-12 pr-4 text-sm text-gray-900 outline-none placeholder-gray-400"
              />
            </div>
            <button
              type="submit"
              className="bg-emerald-600 px-6 font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Search
            </button>
          </motion.form>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <select
            value={campType}
            onChange={(e) => { setCampType(e.target.value); setPage(0) }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-emerald-500"
          >
            {CAMP_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
          <select
            value={state}
            onChange={(e) => { setState(e.target.value); setPage(0) }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-emerald-500"
          >
            <option value="">All States</option>
            {US_STATES.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="ml-auto text-sm text-gray-500">{total} camps found</div>
        </div>

        {/* Featured (only on first page with no search) */}
        {page === 0 && !search && featured && featured.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Featured Camps</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 3).map((camp, i) => (
                <CampCard key={camp.id} camp={camp} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <Tent className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-xl font-medium text-gray-900">No camps found</h3>
            <p className="mt-1 text-gray-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((camp, i) => (
                <CampCard key={camp.id} camp={camp} index={i} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 text-sm text-gray-600">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">List Your Camp on Camp Connect</h2>
          <p className="mt-2 text-emerald-100">
            Reach thousands of families looking for the perfect camp experience.
          </p>
          <Link
            to="/schedule-demo"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-medium text-emerald-700 shadow-lg transition-transform hover:scale-105"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
