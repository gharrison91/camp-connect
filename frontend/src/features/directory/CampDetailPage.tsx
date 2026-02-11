/**
 * Camp Connect - Public Camp Detail Page
 * Full profile view of a single camp from the directory.
 */

import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Users, DollarSign, Calendar, Star, Globe, Phone, Mail, ExternalLink, Tent, Award, Loader2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCampBySlug } from '@/hooks/useCampDirectory'
import { Navbar } from '@/features/landing/components/Navbar'
import { Footer } from '@/features/landing/components/Footer'

function InfoCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (<div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"><div className="flex items-center gap-3"><div className="rounded-lg bg-emerald-500/10 p-2"><Icon className="h-5 w-5 text-emerald-400" /></div><div><p className="text-xs text-slate-500">{label}</p><p className="text-sm font-semibold text-white">{value}</p></div></div></div>)
}

export function CampDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: camp, isLoading, isError } = useCampBySlug(slug || '')

  if (isLoading) return (<div className="min-h-screen bg-[#0a0a0f]"><Navbar /><div className="flex items-center justify-center pt-40"><Loader2 className="h-10 w-10 animate-spin text-emerald-500" /></div></div>)

  if (isError || !camp) return (
    <div className="min-h-screen bg-[#0a0a0f]"><Navbar />
      <div className="flex flex-col items-center justify-center pt-40 text-center"><Tent className="h-16 w-16 text-slate-600 mb-4" /><h2 className="text-2xl font-bold text-white">Camp Not Found</h2><p className="mt-2 text-slate-400">This camp profile doesn't exist or isn't published.</p><Link to="/directory" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"><ArrowLeft className="h-4 w-4" /> Back to Directory</Link></div>
      <Footer />
    </div>
  )

  const locationStr = [camp.address, camp.city, camp.state, camp.zip_code].filter(Boolean).join(', ')

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />
      <section className="relative pt-20">
        <div className="relative h-72 sm:h-96 overflow-hidden">
          {camp.cover_image_url ? (<img src={camp.cover_image_url} alt={camp.name} className="h-full w-full object-cover" />) : (<div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700"><Tent className="h-24 w-24 text-white/20" /></div>)}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />
        </div>
        <div className="relative mx-auto -mt-24 max-w-5xl px-6">
          <div className="flex items-end gap-5">
            {camp.logo_url && <img src={camp.logo_url} alt="" className="h-20 w-20 rounded-2xl border-4 border-[#0a0a0f] bg-white object-contain shadow-xl" />}
            <div className="pb-1">
              <Link to="/directory" className="mb-2 inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"><ArrowLeft className="h-3 w-3" /> Back to Directory</Link>
              <h1 className="text-3xl font-bold sm:text-4xl">{camp.name}</h1>
              {camp.tagline && <p className="mt-1 text-lg text-slate-400">{camp.tagline}</p>}
              <div className="mt-2 flex items-center gap-4">
                {camp.rating && <div className="flex items-center gap-1">{[1,2,3,4,5].map((s) => (<Star key={s} className={cn('h-4 w-4', s <= Math.round(camp.rating!) ? 'fill-amber-400 text-amber-400' : 'text-slate-600')} />))}<span className="ml-1 text-sm text-slate-400">({camp.review_count} reviews)</span></div>}
                {camp.camp_type?.map((type) => (<span key={type} className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">{type}</span>))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-10">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(camp.age_range_min || camp.age_range_max) && <InfoCard icon={Users} label="Ages" value={`${camp.age_range_min || '?'} - ${camp.age_range_max || '?'}`} />}
              {camp.price_range_min != null && <InfoCard icon={DollarSign} label="Price" value={`$${camp.price_range_min.toLocaleString()}${camp.price_range_max ? ` - $${camp.price_range_max.toLocaleString()}` : '+'}`} />}
              {locationStr && <InfoCard icon={MapPin} label="Location" value={[camp.city, camp.state].filter(Boolean).join(', ') || 'See below'} />}
              {camp.session_dates && camp.session_dates.length > 0 && <InfoCard icon={Calendar} label="Sessions" value={`${camp.session_dates.length} available`} />}
            </div>
            {camp.description && <div><h2 className="mb-4 text-xl font-semibold">About This Camp</h2><div className="text-slate-300 leading-relaxed whitespace-pre-wrap">{camp.description}</div></div>}
            {camp.activities && camp.activities.length > 0 && <div><h2 className="mb-4 text-xl font-semibold">Activities</h2><div className="flex flex-wrap gap-2">{camp.activities.map((a) => (<span key={a} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">{a}</span>))}</div></div>}
            {camp.amenities && camp.amenities.length > 0 && <div><h2 className="mb-4 text-xl font-semibold">Amenities</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{camp.amenities.map((a) => (<div key={a} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3"><ChevronRight className="h-4 w-4 text-emerald-400" /><span className="text-sm text-slate-300">{a}</span></div>))}</div></div>}
            {camp.session_dates && camp.session_dates.length > 0 && <div><h2 className="mb-4 text-xl font-semibold">Session Dates</h2><div className="overflow-hidden rounded-xl border border-white/10"><table className="w-full"><thead><tr className="border-b border-white/10 bg-white/5"><th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Session</th><th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Start</th><th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">End</th><th className="px-4 py-3 text-right text-xs font-semibold text-slate-400">Price</th></tr></thead><tbody>{camp.session_dates.map((s, i) => (<tr key={i} className="border-b border-white/5 last:border-0"><td className="px-4 py-3 text-sm font-medium text-white">{s.name}</td><td className="px-4 py-3 text-sm text-slate-400">{s.start}</td><td className="px-4 py-3 text-sm text-slate-400">{s.end}</td><td className="px-4 py-3 text-right text-sm font-medium text-emerald-400">${s.price.toLocaleString()}</td></tr>))}</tbody></table></div></div>}
            {camp.accreditations && camp.accreditations.length > 0 && <div><h2 className="mb-4 text-xl font-semibold">Accreditations</h2><div className="flex flex-wrap gap-3">{camp.accreditations.map((a) => (<div key={a} className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2"><Award className="h-4 w-4 text-amber-400" /><span className="text-sm font-medium text-amber-300">{a}</span></div>))}</div></div>}
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4">Interested?</h3>
              <div className="space-y-3">
                {camp.website_url && <a href={camp.website_url} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700"><ExternalLink className="h-4 w-4" /> Visit Website</a>}
                {camp.email && <a href={`mailto:${camp.email}`} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10"><Mail className="h-4 w-4" /> Request Info</a>}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <div className="space-y-3 text-sm">
                {camp.email && <div className="flex items-center gap-3 text-slate-300"><Mail className="h-4 w-4 text-slate-500" /><a href={`mailto:${camp.email}`} className="hover:text-emerald-400">{camp.email}</a></div>}
                {camp.phone && <div className="flex items-center gap-3 text-slate-300"><Phone className="h-4 w-4 text-slate-500" /><a href={`tel:${camp.phone}`} className="hover:text-emerald-400">{camp.phone}</a></div>}
                {camp.website_url && <div className="flex items-center gap-3 text-slate-300"><Globe className="h-4 w-4 text-slate-500" /><a href={camp.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 truncate">{camp.website_url.replace(/^https?:\/\//, '')}</a></div>}
                {locationStr && <div className="flex items-start gap-3 text-slate-300"><MapPin className="h-4 w-4 mt-0.5 text-slate-500 shrink-0" /><span>{locationStr}</span></div>}
              </div>
            </div>
            {camp.social_links && Object.values(camp.social_links).some(Boolean) && (<div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"><h3 className="text-lg font-semibold mb-4">Follow Us</h3><div className="flex flex-wrap gap-3">
              {camp.social_links.facebook && <a href={camp.social_links.facebook} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">Facebook</a>}
              {camp.social_links.instagram && <a href={camp.social_links.instagram} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">Instagram</a>}
              {camp.social_links.twitter && <a href={camp.social_links.twitter} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">Twitter</a>}
              {camp.social_links.youtube && <a href={camp.social_links.youtube} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">YouTube</a>}
            </div></div>)}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
