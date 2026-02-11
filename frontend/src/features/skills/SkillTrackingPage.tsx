/**
 * Camp Connect – Camper Skill Tracking & Progress
 * Tabs: Skills Library | Camper Progress | Evaluations
 */

import { useState, useMemo } from 'react'
import {
  GraduationCap,
  TrendingUp,
  Target,
  Star,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
  Search,
  Trash2,
} from 'lucide-react'
import {
  useSkillCategories,
  useSkills,
  useCreateSkillCategory,
  useCreateSkill,
  useDeleteSkill,
  useEvaluateCamper,
  useCamperSkillProgress,
  useSkillLeaderboard,
  useSkillCategoryStats,
} from '@/hooks/useSkillTracking'
import { useToast } from '@/components/ui/Toast'
import type { SkillCategory, Skill, CamperSkillProgress } from '@/types'

const TABS = ['Skills Library', 'Camper Progress', 'Evaluations'] as const
type Tab = (typeof TABS)[number]

const LEVEL_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-green-600']

function LevelDots({ current, max }: { current: number; max: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`h-3 w-3 rounded-full transition-all ${
            i < current ? LEVEL_COLORS[Math.min(i, LEVEL_COLORS.length - 1)] : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  )
}

function ProgressBar({ current, target, max }: { current: number; target: number; max: number }) {
  const pct = max > 0 ? (current / max) * 100 : 0
  const targetPct = max > 0 ? (target / max) * 100 : 0
  return (
    <div className="relative h-2.5 w-full rounded-full bg-slate-100">
      <div className="absolute h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      {target > current && (
        <div
          className="absolute top-0 h-full w-0.5 bg-slate-400"
          style={{ left: `${targetPct}%` }}
          title={`Target: Level ${target}`}
        />
      )}
    </div>
  )
}

function AddCategoryModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const createCategory = useCreateSkillCategory()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#10b981')
  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16']

  const submit = () => {
    if (!name.trim()) return
    createCategory.mutate({ name, description, color, icon: 'star' } as any, {
      onSuccess: () => { toast({ message: 'Category created', type: 'success' }); onClose() },
      onError: () => toast({ message: 'Failed to create category', type: 'error' }),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">New Skill Category</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Category name" value={name} onChange={e => setName(e.target.value)} />
          <textarea className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
          <div>
            <label className="mb-1 block text-xs text-slate-500">Color</label>
            <div className="flex gap-2">
              {colors.map(c => (
                <button key={c} onClick={() => setColor(c)} className={`h-7 w-7 rounded-full border-2 ${color === c ? 'border-slate-900' : 'border-transparent'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={createCategory.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {createCategory.isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddSkillModal({ categories, onClose }: { categories: SkillCategory[]; onClose: () => void }) {
  const { toast } = useToast()
  const createSkill = useCreateSkill()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [maxLevel, setMaxLevel] = useState(5)

  const submit = () => {
    if (!name.trim() || !categoryId) return
    const levels = Array.from({ length: maxLevel }, (_, i) => ({ level: i + 1, name: `Level ${i + 1}`, description: '', criteria: '' }))
    createSkill.mutate({ name, description, category_id: categoryId, max_level: maxLevel, levels } as any, {
      onSuccess: () => { toast({ message: 'Skill created', type: 'success' }); onClose() },
      onError: () => toast({ message: 'Failed to create skill', type: 'error' }),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">New Skill</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Skill name" value={name} onChange={e => setName(e.target.value)} />
          <textarea className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
          <select className="w-full rounded-lg border px-3 py-2 text-sm" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Max Level (1-10)</label>
            <input type="number" min={1} max={10} className="w-24 rounded-lg border px-3 py-2 text-sm" value={maxLevel} onChange={e => setMaxLevel(+e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={createSkill.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {createSkill.isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function SkillTrackingPage() {
  const [tab, setTab] = useState<Tab>('Skills Library')
  const [search, setSearch] = useState('')
  const [selectedCamper, setSelectedCamper] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showSkillModal, setShowSkillModal] = useState(false)
  const [evalCamperId, setEvalCamperId] = useState('')
  const [evalSkillId, setEvalSkillId] = useState('')
  const [evalLevel, setEvalLevel] = useState(1)
  const [evalNotes, setEvalNotes] = useState('')

  const { data: categories = [], isLoading: loadingCats } = useSkillCategories()
  const { data: skills = [], isLoading: loadingSkills } = useSkills()
  const { data: progress = [] } = useCamperSkillProgress(selectedCamper || undefined)
  const { data: leaderboard = [] } = useSkillLeaderboard()
  const { data: stats = [] } = useSkillCategoryStats()
  const evaluateCamper = useEvaluateCamper()
  const deleteSkill = useDeleteSkill()
  const { toast } = useToast()

  const filteredSkills = useMemo(() => {
    if (!search) return skills
    const q = search.toLowerCase()
    return skills.filter(s => s.name.toLowerCase().includes(q) || s.category_name?.toLowerCase().includes(q))
  }, [skills, search])

  const skillsByCategory = useMemo(() => {
    const map = new Map<string, Skill[]>()
    for (const s of filteredSkills) {
      const catId = s.category_id
      if (!map.has(catId)) map.set(catId, [])
      map.get(catId)!.push(s)
    }
    return map
  }, [filteredSkills])

  const handleEvaluate = () => {
    if (!evalCamperId || !evalSkillId) return
    evaluateCamper.mutate(
      { camper_id: evalCamperId, skill_id: evalSkillId, level: evalLevel, evaluator: 'current_user', notes: evalNotes },
      {
        onSuccess: () => {
          toast({ message: 'Evaluation recorded', type: 'success' })
          setEvalCamperId(''); setEvalSkillId(''); setEvalLevel(1); setEvalNotes('')
        },
        onError: () => toast({ message: 'Failed to record evaluation', type: 'error' }),
      }
    )
  }

  const handleDeleteSkill = (skill: Skill) => {
    if (!confirm(`Delete skill "${skill.name}"?`)) return
    deleteSkill.mutate(skill.id, {
      onSuccess: () => toast({ message: 'Skill deleted', type: 'success' }),
      onError: () => toast({ message: 'Failed to delete', type: 'error' }),
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Skill Tracking</h1>
          <p className="text-sm text-slate-500">Track camper progress and evaluate skill development</p>
        </div>
        <div className="flex gap-2">
          {tab === 'Skills Library' && (
            <>
              <button onClick={() => setShowCategoryModal(true)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50">New Category</button>
              <button onClick={() => setShowSkillModal(true)} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700" disabled={categories.length === 0}>
                <Plus className="h-4 w-4" /> Add Skill
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50"><GraduationCap className="h-5 w-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold">{categories.length}</p><p className="text-xs text-slate-500">Categories</p></div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50"><Target className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{skills.length}</p><p className="text-xs text-slate-500">Skills</p></div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
            <div><p className="text-2xl font-bold">{leaderboard.length}</p><p className="text-xs text-slate-500">Active Learners</p></div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50"><Star className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{stats.reduce((sum: number, s: any) => sum + (s.total_evaluations ?? 0), 0)}</p><p className="text-xs text-slate-500">Evaluations</p></div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex gap-1 rounded-lg bg-white p-1 shadow-sm border">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${tab === t ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Skills Library' && (
        <div>
          <div className="mb-4 relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm" placeholder="Search skills…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {(loadingCats || loadingSkills) ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : categories.length === 0 ? (
            <div className="rounded-xl border bg-white p-12 text-center">
              <GraduationCap className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">No skill categories yet</p>
              <button onClick={() => setShowCategoryModal(true)} className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700">+ Create Category</button>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map(cat => {
                const catSkills = skillsByCategory.get(cat.id) ?? []
                const isExpanded = expandedCategory === cat.id
                return (
                  <div key={cat.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    <div className="flex cursor-pointer items-center gap-3 p-4" onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}>
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                      <span className="flex-1 font-medium">{cat.name} <span className="ml-1 text-xs text-slate-400">({catSkills.length})</span></span>
                    </div>
                    {isExpanded && (
                      <div className="border-t divide-y">
                        {catSkills.length === 0 ? (
                          <div className="p-4 text-center text-sm text-slate-400">No skills in this category</div>
                        ) : catSkills.map(skill => (
                          <div key={skill.id} className="flex items-center gap-4 px-4 py-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{skill.name}</p>
                              {skill.description && <p className="text-xs text-slate-500">{skill.description}</p>}
                            </div>
                            <LevelDots current={0} max={skill.max_level ?? 5} />
                            <button onClick={() => handleDeleteSkill(skill)} className="rounded p-1 text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'Camper Progress' && (
        <div>
          <div className="mb-4">
            <input className="w-64 rounded-lg border px-3 py-2 text-sm" placeholder="Enter camper ID to view progress…" value={selectedCamper} onChange={e => setSelectedCamper(e.target.value)} />
          </div>
          {selectedCamper && progress.length > 0 ? (
            <div className="space-y-3">
              {progress.map((p: CamperSkillProgress) => (
                <div key={p.id} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{p.skill_name}</p>
                      <p className="text-xs text-slate-500">Level {p.current_level}{p.target_level ? ` / ${p.target_level}` : ''}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.current_level >= (p.target_level || 999) ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {p.current_level >= (p.target_level || 999) ? 'Achieved' : 'In Progress'}
                    </span>
                  </div>
                  <ProgressBar current={p.current_level} target={p.target_level || 5} max={5} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border bg-white p-12 text-center">
              <Target className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">{selectedCamper ? 'No progress records for this camper' : 'Enter a camper ID to view progress'}</p>
            </div>
          )}
          {leaderboard.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Leaderboard</h3>
              <div className="rounded-xl border bg-white shadow-sm divide-y">
                {leaderboard.slice(0, 10).map((entry, i) => (
                  <div key={entry.camper_id} className="flex items-center gap-4 px-4 py-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'}`}>{i + 1}</span>
                    <span className="flex-1 text-sm font-medium">{entry.camper_name}</span>
                    <span className="text-sm font-semibold text-emerald-600">{entry.total_levels} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'Evaluations' && (
        <div className="max-w-lg">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Record Evaluation</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Camper ID</label>
                <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Enter camper ID" value={evalCamperId} onChange={e => setEvalCamperId(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Skill</label>
                <select className="w-full rounded-lg border px-3 py-2 text-sm" value={evalSkillId} onChange={e => setEvalSkillId(e.target.value)}>
                  <option value="">Select a skill…</option>
                  {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Level</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(l => (
                    <button key={l} onClick={() => setEvalLevel(l)} className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 text-sm font-bold transition ${evalLevel >= l ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
                <textarea className="w-full rounded-lg border px-3 py-2 text-sm" rows={3} placeholder="Evaluation notes…" value={evalNotes} onChange={e => setEvalNotes(e.target.value)} />
              </div>
              <button onClick={handleEvaluate} disabled={!evalCamperId || !evalSkillId || evaluateCamper.isPending} className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {evaluateCamper.isPending ? 'Recording…' : 'Record Evaluation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && <AddCategoryModal onClose={() => setShowCategoryModal(false)} />}
      {showSkillModal && categories.length > 0 && <AddSkillModal categories={categories} onClose={() => setShowSkillModal(false)} />}
    </div>
  )
}
