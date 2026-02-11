/**
 * Camp Connect - Meal Planning & Dietary Management Page
 * Weekly calendar view with meal cards, allergen warnings, and dietary restriction management.
 */

import { useState, useMemo, useCallback } from 'react'
import {
  Utensils,
  AlertTriangle,
  Apple,
  Coffee,
  Sun,
  Moon,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Edit3,
  Shield,
  Users,
  Calendar,
  BarChart3,
  Cookie,
} from 'lucide-react'
import {
  useMeals,
  useCreateMeal,
  useUpdateMeal,
  useDeleteMeal,
  useDietaryRestrictions,
  useMealStats,
  type MealCreateData,
} from '@/hooks/useMeals'
import { useToast } from '@/components/ui/Toast'
import type { Meal, DietaryRestriction } from '@/types'

// ---- Constants ----

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const MEAL_TYPE_CONFIG: Record<string, { label: string; icon: typeof Coffee; color: string }> = {
  breakfast: { label: 'Breakfast', icon: Coffee, color: 'text-amber-500' },
  lunch: { label: 'Lunch', icon: Sun, color: 'text-orange-500' },
  dinner: { label: 'Dinner', icon: Moon, color: 'text-indigo-500' },
  snack: { label: 'Snack', icon: Apple, color: 'text-emerald-500' },
}

const COMMON_ALLERGENS = [
  'Milk', 'Eggs', 'Peanuts', 'Tree Nuts', 'Fish', 'Shellfish',
  'Wheat', 'Soy', 'Sesame', 'Gluten', 'Corn', 'Sulfites',
]

const RESTRICTION_TYPES = [
  { value: 'allergy', label: 'Allergy', color: 'bg-red-100 text-red-700' },
  { value: 'intolerance', label: 'Intolerance', color: 'bg-orange-100 text-orange-700' },
  { value: 'preference', label: 'Preference', color: 'bg-blue-100 text-blue-700' },
  { value: 'religious', label: 'Religious', color: 'bg-purple-100 text-purple-700' },
]

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  mild: { label: 'Mild', color: 'bg-yellow-100 text-yellow-700' },
  moderate: { label: 'Moderate', color: 'bg-orange-100 text-orange-700' },
  severe: { label: 'Severe', color: 'bg-red-100 text-red-700' },
}

// ---- Helpers ----

function getWeekStart(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + n)
  return result
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ---- MealCard Subcomponent ----

function MealCard({
  meal,
  restrictions,
  onEdit,
  onDelete,
}: {
  meal: Meal
  restrictions: DietaryRestriction[]
  onEdit: (meal: Meal) => void
  onDelete: (id: string) => void
}) {
  const config = MEAL_TYPE_CONFIG[meal.meal_type]
  const Icon = config?.icon ?? Utensils

  // Check for allergen conflicts
  const conflicts = useMemo(() => {
    const mealAllergens = meal.allergens.map((a) => a.toLowerCase())
    return restrictions.filter((r) =>
      mealAllergens.some(
        (a) => a === r.item.toLowerCase() || r.item.toLowerCase().includes(a) || a.includes(r.item.toLowerCase())
      )
    )
  }, [meal.allergens, restrictions])

  const severeConflicts = conflicts.filter((c) => c.severity === 'severe')
  const otherConflicts = conflicts.filter((c) => c.severity !== 'severe')

  return (
    <div className="group relative rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md hover:border-emerald-300">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={`h-4 w-4 shrink-0 ${config?.color ?? 'text-slate-400'}`} />
          <h4 className="text-sm font-semibold text-slate-800 truncate">{meal.name}</h4>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(meal)}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Edit meal"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(meal.id)}
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
            title="Delete meal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {meal.menu_items.length > 0 && (
        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
          {meal.menu_items.slice(0, 4).join(', ')}
          {meal.menu_items.length > 4 && ` +${meal.menu_items.length - 4} more`}
        </p>
      )}

      {/* Allergen badges */}
      {(severeConflicts.length > 0 || otherConflicts.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {severeConflicts.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
              <AlertTriangle className="h-3 w-3" />
              {severeConflicts.length} severe
            </span>
          )}
          {otherConflicts.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              <AlertTriangle className="h-3 w-3" />
              {otherConflicts.length} warning{otherConflicts.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {meal.allergens.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {meal.allergens.slice(0, 3).map((a) => (
            <span
              key={a}
              className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
            >
              {a}
            </span>
          ))}
          {meal.allergens.length > 3 && (
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
              +{meal.allergens.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ---- MealFormModal Subcomponent ----

function MealFormModal({
  isOpen,
  onClose,
  editMeal,
  defaultDate,
  defaultType,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean
  onClose: () => void
  editMeal: Meal | null
  defaultDate: string
  defaultType: string
  onSubmit: (data: MealCreateData & { id?: string }) => void
  isSubmitting: boolean
}) {
  const [name, setName] = useState(editMeal?.name ?? '')
  const [mealType, setMealType] = useState(editMeal?.meal_type ?? defaultType)
  const [date, setDate] = useState(editMeal?.date ?? defaultDate)
  const [description, setDescription] = useState(editMeal?.description ?? '')
  const [menuItemInput, setMenuItemInput] = useState('')
  const [menuItems, setMenuItems] = useState<string[]>(editMeal?.menu_items ?? [])
  const [allergens, setAllergens] = useState<string[]>(editMeal?.allergens ?? [])
  const [calories, setCalories] = useState(
    editMeal?.nutritional_info?.calories?.toString() ?? ''
  )
  const [protein, setProtein] = useState(
    editMeal?.nutritional_info?.protein?.toString() ?? ''
  )

  if (!isOpen) return null

  const handleAddMenuItem = () => {
    const trimmed = menuItemInput.trim()
    if (trimmed && !menuItems.includes(trimmed)) {
      setMenuItems([...menuItems, trimmed])
      setMenuItemInput('')
    }
  }

  const handleMenuItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddMenuItem()
    }
  }

  const handleRemoveMenuItem = (item: string) => {
    setMenuItems(menuItems.filter((i) => i !== item))
  }

  const toggleAllergen = (allergen: string) => {
    setAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const nutritionalInfo: Record<string, unknown> = {}
    if (calories) nutritionalInfo.calories = Number(calories)
    if (protein) nutritionalInfo.protein = Number(protein)

    onSubmit({
      ...(editMeal ? { id: editMeal.id } : {}),
      name,
      meal_type: mealType,
      date,
      description: description || undefined,
      menu_items: menuItems,
      allergens,
      nutritional_info: nutritionalInfo,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-800">
            {editMeal ? 'Edit Meal' : 'Add Meal'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Meal Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g., Grilled Chicken & Veggies"
            />
          </div>

          {/* Type and Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Meal Type *</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {MEAL_TYPE_CONFIG[t].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Optional description..."
            />
          </div>

          {/* Menu Items (tag-style input) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Menu Items</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={menuItemInput}
                onChange={(e) => setMenuItemInput(e.target.value)}
                onKeyDown={handleMenuItemKeyDown}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Type item and press Enter..."
              />
              <button
                type="button"
                onClick={handleAddMenuItem}
                className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
              >
                Add
              </button>
            </div>
            {menuItems.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {menuItems.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => handleRemoveMenuItem(item)}
                      className="rounded-full hover:bg-emerald-200 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Allergens (multi-select checkboxes) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Allergens Present</label>
            <div className="grid grid-cols-3 gap-2">
              {COMMON_ALLERGENS.map((a) => (
                <label
                  key={a}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs cursor-pointer transition-colors ${
                    allergens.includes(a)
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={allergens.includes(a)}
                    onChange={() => toggleAllergen(a)}
                    className="sr-only"
                  />
                  <span>{a}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Nutritional Info */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nutritional Info (optional)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-0.5">Calories</label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="kcal"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-0.5">Protein</label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="grams"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editMeal ? 'Update Meal' : 'Create Meal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- DietaryRestrictionsPanel Subcomponent ----

function DietaryRestrictionsPanel({
  isOpen,
  onClose,
  restrictions,
  isLoading,
}: {
  isOpen: boolean
  onClose: () => void
  restrictions: DietaryRestriction[]
  isLoading: boolean
}) {
  if (!isOpen) return null

  // Group by type
  const grouped = RESTRICTION_TYPES.map((rt) => ({
    ...rt,
    items: restrictions.filter((r) => r.restriction_type === rt.value),
  }))

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white shadow-2xl overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">Dietary Restrictions</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : restrictions.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">No dietary restrictions recorded</p>
              <p className="text-xs text-slate-400 mt-1">
                Add restrictions from camper profiles or the API
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped
                .filter((g) => g.items.length > 0)
                .map((group) => (
                  <div key={group.value}>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${group.color}`}
                      >
                        {group.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({group.items.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.items.map((r) => (
                        <div
                          key={r.id}
                          className="rounded-lg border border-slate-200 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-800">
                              {r.item}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                SEVERITY_CONFIG[r.severity]?.color ?? 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {SEVERITY_CONFIG[r.severity]?.label ?? r.severity}
                            </span>
                          </div>
                          {r.camper_name && (
                            <p className="mt-1 text-xs text-slate-500">
                              Camper: {r.camper_name}
                            </p>
                          )}
                          {r.notes && (
                            <p className="mt-1 text-xs text-slate-400 italic">{r.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Main MealsPage Component ----

export function MealsPage() {
  const { toast } = useToast()
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()))
  const [showMealModal, setShowMealModal] = useState(false)
  const [showRestrictionsPanel, setShowRestrictionsPanel] = useState(false)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [defaultModalDate, setDefaultModalDate] = useState('')
  const [defaultModalType, setDefaultModalType] = useState('breakfast')

  const weekEnd = addDays(currentWeekStart, 6)
  const dateFrom = formatDate(currentWeekStart)
  const dateTo = formatDate(weekEnd)

  const { data: meals = [], isLoading: mealsLoading } = useMeals({ dateFrom, dateTo })
  const { data: restrictions = [], isLoading: restrictionsLoading } = useDietaryRestrictions()
  const { data: stats } = useMealStats()
  const createMeal = useCreateMeal()
  const updateMeal = useUpdateMeal()
  const deleteMeal = useDeleteMeal()

  // Build the calendar grid: meals grouped by day and type
  const calendarGrid = useMemo(() => {
    const grid: Record<string, Record<string, Meal[]>> = {}
    for (let i = 0; i < 7; i++) {
      const dayDate = formatDate(addDays(currentWeekStart, i))
      grid[dayDate] = {}
      for (const type of MEAL_TYPES) {
        grid[dayDate][type] = []
      }
    }
    for (const meal of meals) {
      const mealDate = meal.date
      if (grid[mealDate]) {
        if (!grid[mealDate][meal.meal_type]) {
          grid[mealDate][meal.meal_type] = []
        }
        grid[mealDate][meal.meal_type].push(meal)
      }
    }
    return grid
  }, [meals, currentWeekStart])

  const handlePrevWeek = useCallback(() => {
    setCurrentWeekStart((prev) => addDays(prev, -7))
  }, [])

  const handleNextWeek = useCallback(() => {
    setCurrentWeekStart((prev) => addDays(prev, 7))
  }, [])

  const handleToday = useCallback(() => {
    setCurrentWeekStart(getWeekStart(new Date()))
  }, [])

  const handleCellClick = useCallback((dayDate: string, mealType: string) => {
    setEditingMeal(null)
    setDefaultModalDate(dayDate)
    setDefaultModalType(mealType)
    setShowMealModal(true)
  }, [])

  const handleEditMeal = useCallback((meal: Meal) => {
    setEditingMeal(meal)
    setDefaultModalDate(meal.date)
    setDefaultModalType(meal.meal_type)
    setShowMealModal(true)
  }, [])

  const handleDeleteMeal = useCallback(
    (id: string) => {
      deleteMeal.mutate(id, {
        onSuccess: () => toast({ type: 'success', message: 'Meal deleted' }),
        onError: () => toast({ type: 'error', message: 'Failed to delete meal' }),
      })
    },
    [deleteMeal, toast]
  )

  const handleMealSubmit = useCallback(
    (data: MealCreateData & { id?: string }) => {
      if (data.id) {
        updateMeal.mutate(
          { ...data, id: data.id },
          {
            onSuccess: () => {
              toast({ type: 'success', message: 'Meal updated' })
              setShowMealModal(false)
              setEditingMeal(null)
            },
            onError: () => toast({ type: 'error', message: 'Failed to update meal' }),
          }
        )
      } else {
        createMeal.mutate(data, {
          onSuccess: () => {
            toast({ type: 'success', message: 'Meal created' })
            setShowMealModal(false)
          },
          onError: () => toast({ type: 'error', message: 'Failed to create meal' }),
        })
      }
    },
    [createMeal, updateMeal, toast]
  )

  // Count allergen conflicts for this week
  const weekConflictCount = useMemo(() => {
    let count = 0
    for (const meal of meals) {
      const mealAllergens = meal.allergens.map((a) => a.toLowerCase())
      for (const r of restrictions) {
        if (
          mealAllergens.some(
            (a) =>
              a === r.item.toLowerCase() ||
              r.item.toLowerCase().includes(a) ||
              a.includes(r.item.toLowerCase())
          )
        ) {
          count++
        }
      }
    }
    return count
  }, [meals, restrictions])

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Top bar */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <Utensils className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Meal Planning</h1>
              <p className="text-sm text-slate-500">
                {formatShortDate(currentWeekStart)} &mdash; {formatShortDate(weekEnd)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRestrictionsPanel(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Shield className="h-4 w-4" />
              Dietary Restrictions
              {restrictions.length > 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  {restrictions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setEditingMeal(null)
                setDefaultModalDate(formatDate(new Date()))
                setDefaultModalType('breakfast')
                setShowMealModal(true)
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Add Meal
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left sidebar: week navigation + stats */}
        <div className="w-64 shrink-0 border-r border-slate-200 bg-slate-50/50 p-4 overflow-y-auto">
          {/* Week navigation */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Week Navigation
            </h3>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={handlePrevWeek}
                className="rounded-lg p-2 text-slate-600 hover:bg-white hover:shadow-sm"
                title="Previous week"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleToday}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
              >
                Today
              </button>
              <button
                onClick={handleNextWeek}
                className="rounded-lg p-2 text-slate-600 hover:bg-white hover:shadow-sm"
                title="Next week"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-lg bg-white border border-slate-200 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Calendar className="h-4 w-4 text-emerald-600" />
                <span>{formatShortDate(currentWeekStart)}</span>
                <span className="text-slate-400">&mdash;</span>
                <span>{formatShortDate(weekEnd)}</span>
              </div>
            </div>
          </div>

          {/* Stats summary */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Statistics
            </h3>
            <div className="space-y-2">
              <div className="rounded-lg bg-white border border-slate-200 p-3">
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs text-slate-500">Meals This Week</span>
                </div>
                <p className="mt-1 text-xl font-bold text-slate-800">{meals.length}</p>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-slate-500">Allergen Conflicts</span>
                </div>
                <p className={`mt-1 text-xl font-bold ${weekConflictCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                  {weekConflictCount}
                </p>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 p-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-slate-500">Campers w/ Restrictions</span>
                </div>
                <p className="mt-1 text-xl font-bold text-slate-800">
                  {stats?.campers_with_restrictions ?? 0}
                </p>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 p-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  <span className="text-xs text-slate-500">Total Meals Planned</span>
                </div>
                <p className="mt-1 text-xl font-bold text-slate-800">
                  {stats?.total_meals ?? 0}
                </p>
              </div>
            </div>

            {/* Top Allergens */}
            {stats?.top_allergens && stats.top_allergens.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Top Allergens
                </h4>
                <div className="space-y-1">
                  {stats.top_allergens.slice(0, 5).map((a) => (
                    <div key={a.name} className="flex items-center justify-between rounded-lg bg-white border border-slate-200 px-3 py-2">
                      <span className="text-xs font-medium text-slate-700">{a.name}</span>
                      <span className="text-xs text-slate-400">{a.count} meals</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main calendar grid */}
        <div className="flex-1 overflow-auto p-4">
          {mealsLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : (
            <div className="min-w-[800px]">
              {/* Header row with day names */}
              <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-2 mb-2">
                <div /> {/* Empty corner cell */}
                {DAYS.map((day, i) => {
                  const dayDate = addDays(currentWeekStart, i)
                  const isToday = formatDate(dayDate) === formatDate(new Date())
                  return (
                    <div
                      key={day}
                      className={`rounded-lg px-3 py-2 text-center ${
                        isToday
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <p className="text-xs font-semibold">{DAYS_SHORT[i]}</p>
                      <p className={`text-lg font-bold ${isToday ? 'text-white' : 'text-slate-800'}`}>
                        {dayDate.getDate()}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Meal type rows */}
              {MEAL_TYPES.map((type) => {
                const config = MEAL_TYPE_CONFIG[type]
                const TypeIcon = config.icon
                return (
                  <div key={type} className="grid grid-cols-[100px_repeat(7,1fr)] gap-2 mb-2">
                    {/* Row label */}
                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                      <TypeIcon className={`h-4 w-4 ${config.color}`} />
                      <span className="text-xs font-semibold text-slate-600">{config.label}</span>
                    </div>

                    {/* Day cells */}
                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                      const dayDate = formatDate(addDays(currentWeekStart, dayIndex))
                      const cellMeals = calendarGrid[dayDate]?.[type] ?? []

                      return (
                        <div
                          key={dayDate}
                          className="min-h-[100px] rounded-lg border border-dashed border-slate-200 bg-white p-2 transition-colors hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer"
                          onClick={() => {
                            if (cellMeals.length === 0) handleCellClick(dayDate, type)
                          }}
                        >
                          {cellMeals.length > 0 ? (
                            <div className="space-y-2">
                              {cellMeals.map((meal) => (
                                <MealCard
                                  key={meal.id}
                                  meal={meal}
                                  restrictions={restrictions}
                                  onEdit={handleEditMeal}
                                  onDelete={handleDeleteMeal}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="flex h-full min-h-[80px] flex-col items-center justify-center text-slate-300">
                              <Plus className="h-5 w-5" />
                              <span className="mt-1 text-[10px]">Add meal</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom stats bar */}
      <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <Cookie className="h-3.5 w-3.5 text-emerald-500" />
              <span>
                <strong className="text-slate-700">{meals.length}</strong> meals planned this week
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className={`h-3.5 w-3.5 ${weekConflictCount > 0 ? 'text-red-500' : 'text-slate-400'}`} />
              <span>
                <strong className={weekConflictCount > 0 ? 'text-red-600' : 'text-slate-700'}>
                  {weekConflictCount}
                </strong>{' '}
                allergen conflicts
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-blue-500" />
              <span>
                <strong className="text-slate-700">{stats?.campers_with_restrictions ?? 0}</strong> campers with
                restrictions
              </span>
            </div>
          </div>
          <div className="text-slate-400">
            Week of {formatShortDate(currentWeekStart)}
          </div>
        </div>
      </div>

      {/* Modals / Panels */}
      <MealFormModal
        isOpen={showMealModal}
        onClose={() => {
          setShowMealModal(false)
          setEditingMeal(null)
        }}
        editMeal={editingMeal}
        defaultDate={defaultModalDate}
        defaultType={defaultModalType}
        onSubmit={handleMealSubmit}
        isSubmitting={createMeal.isPending || updateMeal.isPending}
      />

      <DietaryRestrictionsPanel
        isOpen={showRestrictionsPanel}
        onClose={() => setShowRestrictionsPanel(false)}
        restrictions={restrictions}
        isLoading={restrictionsLoading}
      />
    </div>
  )
}
