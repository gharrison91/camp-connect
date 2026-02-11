/**
 * Camp Connect - School Autocomplete Component
 * Searchable dropdown with debounced autocomplete and manual entry.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { School, Search, X, MapPin, Loader2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSchoolSearch, useCreateSchool } from '@/hooks/useSchools'
import { useToast } from '@/components/ui/Toast'

interface SchoolAutocompleteProps {
  value: string | null
  onChange: (school_id: string, school_name: string) => void
  placeholder?: string
}

export function SchoolAutocomplete({
  value,
  onChange,
  placeholder = 'Search for a school...',
}: SchoolAutocompleteProps) {
  const { toast } = useToast()

  const [inputValue, setInputValue] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [selectedName, setSelectedName] = useState<string | null>(null)

  // Manual form state
  const [manualName, setManualName] = useState('')
  const [manualCity, setManualCity] = useState('')
  const [manualState, setManualState] = useState('')
  const [manualZip, setManualZip] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: schools, isLoading } = useSchoolSearch(debouncedQuery)
  const createSchool = useCreateSchool()

  // Debounce search input
  const handleInputChange = useCallback((val: string) => {
    setInputValue(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(val.trim())
    }, 300)
  }, [])

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setShowManualForm(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(school: { id: string; name: string }) {
    onChange(school.id, school.name)
    setSelectedName(school.name)
    setInputValue('')
    setDebouncedQuery('')
    setIsOpen(false)
    setShowManualForm(false)
  }

  function handleClear() {
    onChange('', '')
    setSelectedName(null)
    setInputValue('')
    setDebouncedQuery('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manualName.trim()) return

    try {
      const school = await createSchool.mutateAsync({
        name: manualName.trim(),
        city: manualCity.trim() || undefined,
        state: manualState.trim() || undefined,
        zip_code: manualZip.trim() || undefined,
      })
      handleSelect({ id: school.id, name: school.name })
      setManualName('')
      setManualCity('')
      setManualState('')
      setManualZip('')
      toast({ type: 'success', message: `Added "${school.name}" successfully` })
    } catch {
      toast({ type: 'error', message: 'Failed to add school. It may already exist.' })
    }
  }

  const hasSelection = value && value.length > 0

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Selected chip */}
      {hasSelection && selectedName ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <School className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="text-sm text-slate-700 truncate flex-1">{selectedName}</span>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        /* Search input */
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              handleInputChange(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => {
              if (inputValue.length >= 2) setIsOpen(true)
            }}
            placeholder={placeholder}
            className={cn(
              'w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-700',
              'placeholder:text-slate-400',
              'focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500',
              'transition-colors'
            )}
          />
          {isLoading && debouncedQuery.length >= 2 && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
          )}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !hasSelection && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-72 overflow-auto">
          {/* Results */}
          {debouncedQuery.length >= 2 ? (
            <>
              {schools && schools.length > 0 ? (
                <ul className="py-1">
                  {schools.map((school) => (
                    <li key={school.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect({ id: school.id, name: school.name })}
                        className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-emerald-50 transition-colors"
                      >
                        <School className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-700 truncate">
                            {school.name}
                          </p>
                          {(school.city || school.state) && (
                            <p className="flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {[school.city, school.state].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : !isLoading ? (
                <p className="px-3 py-4 text-sm text-slate-500 text-center">
                  No schools found for &ldquo;{debouncedQuery}&rdquo;
                </p>
              ) : null}

              {/* Add manually link */}
              {!showManualForm && (
                <button
                  type="button"
                  onClick={() => {
                    setShowManualForm(true)
                    setManualName(inputValue)
                  }}
                  className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  {"Can't find your school? Add it manually"}
                </button>
              )}

              {/* Manual form */}
              {showManualForm && (
                <form
                  onSubmit={handleManualSubmit}
                  className="border-t border-slate-100 p-3 space-y-2.5"
                >
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Add a school
                  </p>
                  <input
                    type="text"
                    placeholder="School name *"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={manualCity}
                      onChange={(e) => setManualCity(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={manualState}
                      onChange={(e) => setManualState(e.target.value)}
                      maxLength={2}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase"
                    />
                    <input
                      type="text"
                      placeholder="ZIP"
                      value={manualZip}
                      onChange={(e) => setManualZip(e.target.value)}
                      maxLength={10}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={createSchool.isPending || !manualName.trim()}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white',
                        'hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                      )}
                    >
                      {createSchool.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      Add School
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowManualForm(false)}
                      className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <p className="px-3 py-4 text-sm text-slate-400 text-center">
              Type at least 2 characters to search
            </p>
          )}
        </div>
      )}
    </div>
  )
}
