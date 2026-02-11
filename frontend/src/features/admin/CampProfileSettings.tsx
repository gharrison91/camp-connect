/**
 * Camp Connect - Camp Profile Settings
 * Admin page for editing the organization's public directory profile.
 */

import { useState, useEffect } from 'react'
import {
  Save, Loader2, Globe, Eye, EyeOff, ExternalLink, Plus, X, Tent,
  MapPin, Phone, Users, Calendar, Award, Image, Link as LinkIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import {
  useCampProfile, useUpdateCampProfile, usePublishCampProfile,
} from '@/hooks/useCampDirectory'
import type { CampProfile, CampProfileUpdate } from '@/types'

const CAMP_TYPE_OPTIONS = [
  'Day Camp', 'Overnight', 'Sports', 'Arts', 'Nature', 'Science & Tech',
  'Music', 'Adventure', 'Special Needs', 'Academic', 'Religious', 'Travel',
]

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

interface SessionDateRow { name: string; start: string; end: string; price: number }

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('')
  function addTag() { const val = input.trim(); if (val && !tags.includes(val)) { onChange([...tags, val]) } setInput('') }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            {tag}
            <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} className="ml-1 text-emerald-400 hover:text-emerald-600"><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} placeholder={placeholder} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
        <button type="button" onClick={addTag} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"><Plus className="h-4 w-4" /></button>
      </div>
    </div>
  )
}

export function CampProfileSettings() {
  const { data: profileData, isLoading } = useCampProfile()
  const updateMutation = useUpdateCampProfile()
  const publishMutation = usePublishCampProfile()
  const { toast: addToast } = useToast()
  const [form, setForm] = useState<CampProfileUpdate>({})
  const [isPublished, setIsPublished] = useState(false)
  const [slug, setSlug] = useState('')
  const [sessionDates, setSessionDates] = useState<SessionDateRow[]>([])
  const [campTypes, setCampTypes] = useState<string[]>([])
  const [amenities, setAmenities] = useState<string[]>([])
  const [activities, setActivities] = useState<string[]>([])
  const [accreditations, setAccreditations] = useState<string[]>([])
  const [socialLinks, setSocialLinks] = useState({ facebook: '', instagram: '', twitter: '', youtube: '' })

  useEffect(() => {
    if (!profileData || 'profile' in profileData) return
    const p = profileData as CampProfile
    setForm({ name: p.name || '', tagline: p.tagline || '', description: p.description || '', logo_url: p.logo_url || '', cover_image_url: p.cover_image_url || '', website_url: p.website_url || '', email: p.email || '', phone: p.phone || '', address: p.address || '', city: p.city || '', state: p.state || '', zip_code: p.zip_code || '', age_range_min: p.age_range_min ?? undefined, age_range_max: p.age_range_max ?? undefined, price_range_min: p.price_range_min ?? undefined, price_range_max: p.price_range_max ?? undefined })
    setIsPublished(p.is_published); setSlug(p.slug || ''); setSessionDates(p.session_dates || []); setCampTypes(p.camp_type || []); setAmenities(p.amenities || []); setActivities(p.activities || []); setAccreditations(p.accreditations || [])
    setSocialLinks({ facebook: p.social_links?.facebook || '', instagram: p.social_links?.instagram || '', twitter: p.social_links?.twitter || '', youtube: p.social_links?.youtube || '' })
  }, [profileData])

  function updateField(field: keyof CampProfileUpdate, value: unknown) { setForm((prev) => ({ ...prev, [field]: value })) }

  async function handleSave() {
    const data: CampProfileUpdate = { ...form, slug: slug || undefined, camp_type: campTypes.length ? campTypes : undefined, amenities: amenities.length ? amenities : undefined, activities: activities.length ? activities : undefined, accreditations: accreditations.length ? accreditations : undefined, session_dates: sessionDates.length ? sessionDates : undefined, social_links: Object.values(socialLinks).some(Boolean) ? socialLinks : undefined }
    try { await updateMutation.mutateAsync(data); addToast({ type: 'success', message: 'Camp profile saved!' }) } catch { addToast({ type: 'error', message: 'Failed to save profile.' }) }
  }

  async function handleTogglePublish() {
    try { await publishMutation.mutateAsync(!isPublished); setIsPublished(!isPublished); addToast({ type: 'success', message: isPublished ? 'Profile unpublished.' : 'Profile published to directory!' }) } catch { addToast({ type: 'error', message: 'Failed to update publish status.' }) }
  }

  function addSessionDate() { setSessionDates((prev) => [...prev, { name: '', start: '', end: '', price: 0 }]) }
  function updateSessionDate(index: number, field: keyof SessionDateRow, value: string | number) { setSessionDates((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))) }
  function removeSessionDate(index: number) { setSessionDates((prev) => prev.filter((_, i) => i !== index)) }

  if (isLoading) return (<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>)

  const isSaving = updateMutation.isPending || publishMutation.isPending
  const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500'

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Camp Directory Profile</h2>
          <p className="mt-1 text-sm text-slate-500">Manage your camp&apos;s public listing in the Camp Connect directory.</p>
        </div>
        <div className="flex items-center gap-3">
          {slug && (<a href={`/directory/${slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700"><ExternalLink className="h-4 w-4" />Preview</a>)}
          <button onClick={handleTogglePublish} disabled={isSaving} className={cn('inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors', isPublished ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100')}>
            {isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{isPublished ? 'Unpublish' : 'Publish'}
          </button>
          <button onClick={handleSave} disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Changes
          </button>
        </div>
      </div>
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700"><Image className="h-4 w-4" /> Cover Image & Logo</h3>
        <div className="relative mb-4 overflow-hidden rounded-xl">
          {form.cover_image_url ? (<img src={form.cover_image_url} alt="Cover" className="h-48 w-full object-cover" />) : (<div className="flex h-48 items-center justify-center bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600"><Tent className="h-16 w-16 text-white/40" /></div>)}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Cover Image URL</label><input type="url" value={(form.cover_image_url as string) || ''} onChange={(e) => updateField('cover_image_url', e.target.value)} placeholder="https://..." className={inputCls} /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Logo URL</label><input type="url" value={(form.logo_url as string) || ''} onChange={(e) => updateField('logo_url', e.target.value)} placeholder="https://..." className={inputCls} /></div>
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700"><Tent className="h-4 w-4" /> Basic Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium text-slate-700">Camp Name</label><input type="text" value={(form.name as string) || ''} onChange={(e) => updateField('name', e.target.value)} placeholder="Camp Sunshine" className={inputCls} /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">URL Slug</label><div className="flex items-center rounded-lg border border-slate-300 bg-slate-50"><span className="px-3 text-sm text-slate-400">/directory/</span><input type="text" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} className="flex-1 rounded-r-lg border-0 bg-transparent px-1 py-2 text-sm focus:outline-none focus:ring-0" /></div></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Tagline</label><input type="text" value={(form.tagline as string) || ''} onChange={(e) => updateField('tagline', e.target.value)} className={inputCls} /></div>
          <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium text-slate-700">Description</label><textarea rows={5} value={(form.description as string) || ''} onChange={(e) => updateField('description', e.target.value)} className={inputCls} /></div>
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700"><Phone className="h-4 w-4" /> Contact</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Email</label><input type="email" value={(form.email as string) || ''} onChange={(e) => updateField('email', e.target.value)} className={inputCls} /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Phone</label><input type="tel" value={(form.phone as string) || ''} onChange={(e) => updateField('phone', e.target.value)} className={inputCls} /></div>
          <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium text-slate-700">Website</label><input type="url" value={(form.website_url as string) || ''} onChange={(e) => updateField('website_url', e.target.value)} className={inputCls} /></div>
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700"><MapPin className="h-4 w-4" /> Location</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium text-slate-700">Address</label><input type="text" value={(form.address as string) || ''} onChange={(e) => updateField('address', e.target.value)} className={inputCls} /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">City</label><input type="text" value={(form.city as string) || ''} onChange={(e) => updateField('city', e.target.value)} className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1 block text-sm font-medium text-slate-700">State</label><select value={(form.state as string) || ''} onChange={(e) => updateField('state', e.target.value)} className={inputCls}><option value="">Select</option>{US_STATES.map((s) => (<option key={s} value={s}>{s}</option>))}</select></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700">ZIP</label><input type="text" value={(form.zip_code as string) || ''} onChange={(e) => updateField('zip_code', e.target.value)} className={inputCls} /></div>
          </div>
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700"><Tent className="h-4 w-4" /> Camp Types</h3>
        <div className="flex flex-wrap gap-3">{CAMP_TYPE_OPTIONS.map((type) => (<label key={type} className={cn('inline-flex cursor-pointer items-center rounded-lg border px-3 py-2 text-sm transition-colors', campTypes.includes(type) ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-slate-300')}><input type="checkbox" checked={campTypes.includes(type)} onChange={(e) => { if (e.target.checked) setCampTypes([...campTypes, type]); else setCampTypes(campTypes.filter((t) => t !== type)) }} className="sr-only" />{type}</label>))}</div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700"><Users className="h-4 w-4" /> Age Range & Pricing</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Min Age</label><input type="number" min={0} max={18} value={form.age_range_min ?? ''} onChange={(e) => updateField('age_range_min', e.target.value ? Number(e.target.value) : undefined)} className={inputCls} /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Max Age</label><input type="number" min={0} max={18} value={form.age_range_max ?? ''} onChange={(e) => updateField('age_range_max', e.target.value ? Number(e.target.value) : undefined)} className={inputCls} /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Price Min</label><input type="number" min={0} value={form.price_range_min ?? ''} onChange={(e) => updateField('price_range_min', e.target.value ? Number(e.target.value) : undefined)} className={inputCls} /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Price Max</label><input type="number" min={0} value={form.price_range_max ?? ''} onChange={(e) => updateField('price_range_max', e.target.value ? Number(e.target.value) : undefined)} className={inputCls} /></div>
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-6"><h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700"><Globe className="h-4 w-4" /> Amenities</h3><TagInput tags={amenities} onChange={setAmenities} placeholder="Add amenity (Pool, Lake...)" /></section>
      <section className="rounded-xl border border-slate-200 bg-white p-6"><h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700"><Tent className="h-4 w-4" /> Activities</h3><TagInput tags={activities} onChange={setActivities} placeholder="Add activity (Archery...)" /></section>
      <section className="rounded-xl border border-slate-200 bg-white p-6"><h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700"><Award className="h-4 w-4" /> Accreditations</h3><TagInput tags={accreditations} onChange={setAccreditations} placeholder="Add accreditation..." /></section>
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 flex items-center justify-between text-sm font-semibold text-slate-700"><span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Session Dates</span><button onClick={addSessionDate} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"><Plus className="h-3 w-3" /> Add</button></h3>
        {sessionDates.length === 0 ? <p className="text-sm text-slate-400">No sessions added yet.</p> : <div className="space-y-3">{sessionDates.map((row, idx) => (<div key={idx} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3"><input type="text" value={row.name} onChange={(e) => updateSessionDate(idx, 'name', e.target.value)} placeholder="Name" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" /><input type="date" value={row.start} onChange={(e) => updateSessionDate(idx, 'start', e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><input type="date" value={row.end} onChange={(e) => updateSessionDate(idx, 'end', e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><div className="flex items-center rounded-lg border border-slate-300 bg-white"><span className="px-2 text-sm text-slate-400">$</span><input type="number" min={0} value={row.price || ''} onChange={(e) => updateSessionDate(idx, 'price', Number(e.target.value))} className="w-24 rounded-r-lg border-0 px-1 py-2 text-sm" /></div><button onClick={() => removeSessionDate(idx)} className="rounded p-1 text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></button></div>))}</div>}
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700"><LinkIcon className="h-4 w-4" /> Social Links</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{(['facebook', 'instagram', 'twitter', 'youtube'] as const).map((p) => (<div key={p}><label className="mb-1 block text-sm font-medium capitalize text-slate-700">{p}</label><input type="url" value={socialLinks[p]} onChange={(e) => setSocialLinks({ ...socialLinks, [p]: e.target.value })} placeholder={`https://${p}.com/...`} className={inputCls} /></div>))}</div>
      </section>
    </div>
  )
}
