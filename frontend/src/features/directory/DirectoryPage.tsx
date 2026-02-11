/**
 * Camp Connect - Public Camp Directory
 * Searchable, filterable grid of published camp profiles.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Users, DollarSign, Star, SlidersHorizontal, X, Tent, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDirectorySearch, useFeaturedCamps } from '@/hooks/useCampDirectory'
import type { CampProfile } from '@/types'
import { Navbar } from '@/features/landing/components/Navbar'
import { Footer } from '@/features/landing/components/Footer'

const CAMP_TYPES = ['Day Camp', 'Overnight', 'Sports', 'Arts', 'Nature', 'Science & Tech', 'Music', 'Adventure', 'Special Needs', 'Academic']
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

function StarRating({ rating, count }: { rating: number | null; count: number }) {
  if (!rating) return null
  return (<div className="flex items-center gap-1">{[1,2,3,4,5].map((s) => (<Star key={s} className={cn('h-3.5 w-3.5', s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />))}<span className="ml-1 text-xs text-slate-400">({count})</span></div>)
}

function CampCard({ camp }: { camp: CampProfile }) {
  return (
    <Link to={`/directory/${camp.slug}`} className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:border-emerald-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-emerald-500/5">
      <div className="relative h-48 overflow-hidden">
        {camp.cover_image_url ? (<img src={camp.cover_image_url} alt={camp.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />) : (<div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700"><Tent className="h-12 w-12 text-white/30" /></div>)}
        {camp.is_featured && <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-white">Featured</span>}
        {camp.logo_url && <img src={camp.logo_url} alt="" className="absolute bottom-3 right-3 h-10 w-10 rounded-lg border-2 border-white bg-white object-contain shadow-md" />}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">{camp.name}</h3>
        {camp.tagline && <p className="mt-1 text-sm text-slate-400 line-clamp-2">{camp.tagline}</p>}
        <div className="mt-3 flex flex-wrap gap-1.5">{camp.camp_type?.slice(0, 3).map((type) => (<span key={type} className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">{type}</span>))}</div>
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
          {(camp.city || camp.state) && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{[camp.city, camp.state].filter(Boolean).join(', ')}</span>}
          {(camp.age_range_min || camp.age_range_max) && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />Ages {camp.age_range_min || '?'}-{camp.age_range_max || '?'}</span>}
          {camp.price_range_min != null && <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />From ${camp.price_range_min.toLocaleString()}</span>}
        </div>
        <div className="mt-3"><StarRating rating={camp.rating} count={camp.review_count} /></div>
      </div>
    </Link>
  )
}

export function DirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [campType, setCampType] = useState('')
  const [state, setState] = useState('')
  const [ageMin, setAgeMin] = useState<number | undefined>()
  const [ageMax, setAgeMax] = useState<number | undefined>()
  const [priceMin, setPriceMin] = useState<number | undefined>()
  const [priceMax, setPriceMax] = useState<number | undefined>()
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(0)
  const LIMIT = 24

  const { data: results, isLoading } = useDirectorySearch({ q: searchQuery || undefined, camp_type: campType || undefined, state: state || undefined, age_min: ageMin, age_max: ageMax, price_min: priceMin, price_max: priceMax, skip: page * LIMIT, limit: LIMIT })
  const { data: featured } = useFeaturedCamps()
  const hasActiveFilters = campType || state || ageMin || ageMax || priceMin || priceMax
  function clearFilters() { setCampType(''); setState(''); setAgeMin(undefined); setAgeMax(undefined); setPriceMin(undefined); setPriceMax(undefined); setPage(0) }
  const camps = results?.items || []
  const total = results?.total || 0
  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />
      <section className="relative overflow-hidden pt-32 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/20 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Find the Perfect <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Camp</span></h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">Browse camps, compare programs, and find the ideal summer experience for your child.</p>
          <div className="mx-auto mt-8 flex max-w-2xl items-center gap-2">
            <div className="relative flex-1"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" /><input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(0) }} placeholder="Search camps by name, location, or activity..." className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white placeholder-slate-500 backdrop-blur-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" /></div>
            <button onClick={() => setShowFilters(!showFilters)} className={cn('rounded-xl border px-4 py-3.5 transition-colors', showFilters ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20')}><SlidersHorizontal className="h-5 w-5" /></button>
          </div>
        </div>
      </section>
      {showFilters && (<section className="mx-auto max-w-7xl px-6 pb-8"><div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"><div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-white">Filters</h3>{hasActiveFilters && <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"><X className="h-3 w-3" /> Clear all</button>}</div><div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div><label className="mb-1 block text-xs text-slate-400">Camp Type</label><select value={campType} onChange={(e) => { setCampType(e.target.value); setPage(0) }} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"><option value="">All Types</option>{CAMP_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}</select></div>
        <div><label className="mb-1 block text-xs text-slate-400">State</label><select value={state} onChange={(e) => { setState(e.target.value); setPage(0) }} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"><option value="">All States</option>{US_STATES.map((s) => (<option key={s} value={s}>{s}</option>))}</select></div>
        <div><label className="mb-1 block text-xs text-slate-400">Age Min</label><input type="number" min={0} max={18} value={ageMin ?? ''} onChange={(e) => { setAgeMin(e.target.value ? Number(e.target.value) : undefined); setPage(0) }} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" /></div>
        <div><label className="mb-1 block text-xs text-slate-400">Age Max</label><input type="number" min={0} max={18} value={ageMax ?? ''} onChange={(e) => { setAgeMax(e.target.value ? Number(e.target.value) : undefined); setPage(0) }} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" /></div>
        <div><label className="mb-1 block text-xs text-slate-400">Price Min ($)</label><input type="number" min={0} value={priceMin ?? ''} onChange={(e) => { setPriceMin(e.target.value ? Number(e.target.value) : undefined); setPage(0) }} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" /></div>
        <div><label className="mb-1 block text-xs text-slate-400">Price Max ($)</label><input type="number" min={0} value={priceMax ?? ''} onChange={(e) => { setPriceMax(e.target.value ? Number(e.target.value) : undefined); setPage(0) }} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" /></div>
      </div></div></section>)}
      {!searchQuery && !hasActiveFilters && featured && featured.length > 0 && (<section className="mx-auto max-w-7xl px-6 pb-12"><h2 className="mb-6 text-xl font-semibold text-white">Featured Camps</h2><div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{featured.map((camp) => (<CampCard key={camp.id} camp={camp} />))}</div></section>)}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-6 flex items-center justify-between"><h2 className="text-xl font-semibold text-white">{searchQuery || hasActiveFilters ? 'Search Results' : 'All Camps'}<span className="ml-2 text-base font-normal text-slate-500">({total} camps)</span></h2></div>
        {isLoading ? (<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>) : camps.length === 0 ? (<div className="flex flex-col items-center justify-center py-20 text-center"><Tent className="h-16 w-16 text-slate-600 mb-4" /><h3 className="text-lg font-semibold text-slate-400">No camps found</h3><p className="mt-2 text-sm text-slate-500">Try adjusting your search or filters.</p></div>) : (<><div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{camps.map((camp) => (<CampCard key={camp.id} camp={camp} />))}</div>{totalPages > 1 && (<div className="mt-10 flex items-center justify-center gap-2"><button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 hover:bg-white/5 disabled:opacity-30">Previous</button><span className="px-4 text-sm text-slate-500">Page {page + 1} of {totalPages}</span><button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 hover:bg-white/5 disabled:opacity-30">Next</button></div>)}</>)}
      </section>
      <Footer />
    </div>
  )
}
