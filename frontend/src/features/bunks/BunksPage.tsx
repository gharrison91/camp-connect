/**
 * Camp Connect - BunksPage
 * Drag-and-drop bunk assignment board.
 *
 * Left panel: unassigned campers (droppable pool).
 * Right panel: bunk columns, each a droppable zone with assigned CamperCards.
 */

import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import {
  Loader2,
  BedDouble,
  Users,
  Settings2,
  UserCheck,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEvents } from '@/hooks/useEvents'
import { usePermissions } from '@/hooks/usePermissions'
import {
  useBunks,
  useBunkAssignments,
  useUnassignedCampers,
  useAssignCamper,
  useUnassignCamper,
  useMoveCamper,
} from '@/hooks/useBunks'
import type { Bunk, BunkAssignment } from '@/hooks/useBunks'
import { useToast } from '@/components/ui/Toast'
import { CamperCard, CamperCardOverlay } from './CamperCard'
import { BunkManageModal } from './BunkManageModal'
import { EventBunkConfigModal } from './EventBunkConfigModal'

// ─── Drag metadata stored during onDragStart ────────────────

interface DragData {
  /** 'unassigned' or a bunk id */
  source: string
  /** Set when the camper is currently assigned (so we can move/unassign) */
  assignmentId?: string
  /** Camper info for the overlay */
  name: string
  age: number | null
  gender: string | null
  /** The camper_id (needed for new assignments) */
  camperId: string
}

// ─── Droppable wrapper for bunk columns + unassigned pool ───

function DroppableZone({
  id,
  children,
  className,
}: {
  id: string
  children: React.ReactNode
  className?: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        className,
        isOver && 'ring-2 ring-blue-400 ring-offset-2 bg-blue-50/30'
      )}
    >
      {children}
    </div>
  )
}

// ─── Capacity bar helpers ───────────────────────────────────

function getCapacityBarColor(count: number, capacity: number): string {
  if (capacity === 0) return 'bg-gray-300'
  const pct = (count / capacity) * 100
  if (pct >= 100) return 'bg-red-500'
  if (pct >= 80) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function getCapacityTrackColor(count: number, capacity: number): string {
  if (capacity === 0) return 'bg-gray-100'
  const pct = (count / capacity) * 100
  if (pct >= 100) return 'bg-red-100'
  if (pct >= 80) return 'bg-amber-100'
  return 'bg-emerald-100'
}

function formatGenderRestriction(val: string | null): string {
  switch (val?.toLowerCase()) {
    case 'male':
      return 'Male Only'
    case 'female':
      return 'Female Only'
    default:
      return 'All'
  }
}

// ─── Main page component ────────────────────────────────────

export function BunksPage() {
  const { hasPermission } = usePermissions()
  const { toast } = useToast()

  // Event selector
  const { data: events = [], isLoading: eventsLoading } = useEvents()
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(
    undefined
  )

  // Bunks + assignments
  const { data: bunks = [], isLoading: bunksLoading } = useBunks()
  const { data: assignments = [], isLoading: assignmentsLoading } =
    useBunkAssignments(selectedEventId)
  const { data: unassigned = [], isLoading: unassignedLoading } =
    useUnassignedCampers(selectedEventId)

  // Mutations
  const assignCamper = useAssignCamper(selectedEventId)
  const unassignCamper = useUnassignCamper(selectedEventId)
  const moveCamper = useMoveCamper(selectedEventId)

  // Modal state
  const [showManageModal, setShowManageModal] = useState(false)
  const [showBunkConfigModal, setShowBunkConfigModal] = useState(false)

  // Drag state
  const [activeDragData, setActiveDragData] = useState<DragData | null>(null)

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  // Index assignments by bunk_id
  const assignmentsByBunk = useMemo(() => {
    const map: Record<string, BunkAssignment[]> = {}
    for (const a of assignments) {
      if (!map[a.bunk_id]) map[a.bunk_id] = []
      map[a.bunk_id].push(a)
    }
    return map
  }, [assignments])

  // ── Drag handlers ───────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    const dragId = String(event.active.id)

    // Check if it's an unassigned camper
    const camper = unassigned.find((c) => c.id === dragId)
    if (camper) {
      setActiveDragData({
        source: 'unassigned',
        camperId: camper.id,
        name: `${camper.first_name} ${camper.last_name}`,
        age: camper.age,
        gender: camper.gender,
      })
      return
    }

    // Otherwise it's an assignment id
    const assignment = assignments.find((a) => a.id === dragId)
    if (assignment) {
      setActiveDragData({
        source: assignment.bunk_id,
        assignmentId: assignment.id,
        camperId: assignment.camper_id,
        name: assignment.camper_name,
        age: assignment.camper_age,
        gender: assignment.camper_gender,
      })
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { over } = event
    const dragData = activeDragData
    setActiveDragData(null)

    if (!over || !dragData || !selectedEventId) return

    const targetId = String(over.id)

    // Dropped back where it came from — do nothing
    if (targetId === dragData.source) return

    try {
      if (dragData.source === 'unassigned' && targetId !== 'unassigned') {
        // Assign unassigned camper to a bunk
        await assignCamper.mutateAsync({
          bunk_id: targetId,
          camper_id: dragData.camperId,
          event_id: selectedEventId,
        })
        toast({ type: 'success', message: `${dragData.name} assigned to bunk.` })
      } else if (
        dragData.source !== 'unassigned' &&
        targetId === 'unassigned'
      ) {
        // Unassign from bunk back to pool
        if (dragData.assignmentId) {
          await unassignCamper.mutateAsync(dragData.assignmentId)
          toast({
            type: 'success',
            message: `${dragData.name} removed from bunk.`,
          })
        }
      } else if (
        dragData.source !== 'unassigned' &&
        targetId !== 'unassigned'
      ) {
        // Move between bunks
        if (dragData.assignmentId) {
          await moveCamper.mutateAsync({
            assignmentId: dragData.assignmentId,
            newBunkId: targetId,
          })
          toast({ type: 'success', message: `${dragData.name} moved to new bunk.` })
        }
      }
    } catch {
      toast({ type: 'error', message: 'Failed to update assignment.' })
    }
  }

  // ── Loading state ───────────────────────────────────────────

  const isLoading =
    eventsLoading ||
    bunksLoading ||
    (selectedEventId && (assignmentsLoading || unassignedLoading))

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Bunk Assignments
        </h1>
        <div className="flex items-center gap-3">
          {/* Event Selector */}
          <select
            value={selectedEventId ?? ''}
            onChange={(e) =>
              setSelectedEventId(e.target.value || undefined)
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select an event...</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.name}
              </option>
            ))}
          </select>

          {/* Configure Bunks for Event */}
          {selectedEventId && hasPermission('core.bunks.create') && (
            <button
              onClick={() => setShowBunkConfigModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <BedDouble className="h-4 w-4" />
              Configure Bunks
            </button>
          )}

          {/* Manage Bunks button */}
          {hasPermission('core.bunks.create') && (
            <button
              onClick={() => setShowManageModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Settings2 className="h-4 w-4" />
              Manage Bunks
            </button>
          )}
        </div>
      </div>

      {/* Prompt to select event */}
      {!selectedEventId && !isLoading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-20">
          <BedDouble className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            Select an event to manage bunk assignments
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Choose an event from the dropdown above to get started.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Main board */}
      {selectedEventId && !isLoading && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-1 gap-6 overflow-hidden">
            {/* ── Left panel: Unassigned campers ── */}
            <div className="w-[300px] shrink-0">
              <DroppableZone
                id="unassigned"
                className="flex h-full flex-col rounded-xl border border-gray-100 bg-white shadow-sm transition-all"
              >
                {/* Panel header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <h2 className="text-sm font-semibold text-gray-900">
                      Unassigned
                    </h2>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {unassigned.length}
                  </span>
                </div>

                {/* Camper list */}
                <div className="flex-1 space-y-2 overflow-y-auto p-3">
                  {unassigned.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10">
                      <UserCheck className="h-8 w-8 text-emerald-300" />
                      <p className="mt-2 text-sm text-gray-500">
                        All campers assigned!
                      </p>
                    </div>
                  )}
                  {unassigned.map((camper) => (
                    <CamperCard
                      key={camper.id}
                      id={camper.id}
                      name={`${camper.first_name} ${camper.last_name}`}
                      age={camper.age}
                      gender={camper.gender}
                      isDragging={activeDragData?.camperId === camper.id}
                    />
                  ))}
                </div>
              </DroppableZone>
            </div>

            {/* ── Right panel: Bunk columns ── */}
            <div className="flex-1 overflow-x-auto">
              {bunks.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-20">
                  <BedDouble className="h-10 w-10 text-gray-300" />
                  <p className="mt-3 text-sm font-medium text-gray-900">
                    No bunks created yet
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Use "Manage Bunks" to create bunk cabins.
                  </p>
                </div>
              )}

              <div className="grid auto-cols-[280px] grid-flow-col gap-4 pb-4">
                {bunks.map((bunk) => (
                  <BunkColumn
                    key={bunk.id}
                    bunk={bunk}
                    assignments={assignmentsByBunk[bunk.id] || []}
                    activeDragCamperId={activeDragData?.camperId ?? null}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Drag overlay */}
          <DragOverlay dropAnimation={null}>
            {activeDragData ? (
              <CamperCardOverlay
                name={activeDragData.name}
                age={activeDragData.age}
                gender={activeDragData.gender}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Manage Bunks Modal */}
      {showManageModal && (
        <BunkManageModal onClose={() => setShowManageModal(false)} />
      )}

      {/* Event Bunk Config Modal */}
      {showBunkConfigModal && selectedEventId && (
        <EventBunkConfigModal
          eventId={selectedEventId}
          eventName={events.find((e) => e.id === selectedEventId)?.name || ''}
          onClose={() => setShowBunkConfigModal(false)}
        />
      )}
    </div>
  )
}

// ─── BunkColumn ─────────────────────────────────────────────

function BunkColumn({
  bunk,
  assignments,
  activeDragCamperId,
}: {
  bunk: Bunk
  assignments: BunkAssignment[]
  activeDragCamperId: string | null
}) {
  const count = assignments.length
  const capacityPct =
    bunk.capacity > 0 ? Math.round((count / bunk.capacity) * 100) : 0

  return (
    <DroppableZone
      id={bunk.id}
      className="flex flex-col rounded-xl border border-gray-100 bg-white shadow-sm transition-all"
    >
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{bunk.name}</h3>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset',
              bunk.gender_restriction?.toLowerCase() === 'male'
                ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                : bunk.gender_restriction?.toLowerCase() === 'female'
                  ? 'bg-pink-50 text-pink-700 ring-pink-600/20'
                  : 'bg-gray-50 text-gray-600 ring-gray-500/20'
            )}
          >
            {formatGenderRestriction(bunk.gender_restriction)}
          </span>
        </div>

        {/* Counselor */}
        {bunk.counselor_name && (
          <p className="mt-1 text-xs text-gray-500">
            Counselor: {bunk.counselor_name}
          </p>
        )}

        {/* Meta badges */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {(bunk.min_age != null || bunk.max_age != null) && (
            <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
              Ages {bunk.min_age ?? '?'}-{bunk.max_age ?? '?'}
            </span>
          )}
          {bunk.location && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400">
              <MapPin className="h-2.5 w-2.5" />
              {bunk.location}
            </span>
          )}
        </div>

        {/* Capacity bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              {count} / {bunk.capacity}
            </span>
            <span
              className={cn(
                'font-medium',
                capacityPct >= 100
                  ? 'text-red-600'
                  : capacityPct >= 80
                    ? 'text-amber-600'
                    : 'text-gray-600'
              )}
            >
              {capacityPct}%
            </span>
          </div>
          <div
            className={cn(
              'mt-1 h-1.5 w-full overflow-hidden rounded-full',
              getCapacityTrackColor(count, bunk.capacity)
            )}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all',
                getCapacityBarColor(count, bunk.capacity)
              )}
              style={{ width: `${Math.min(capacityPct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Assigned campers */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {assignments.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-8">
            <BedDouble className="h-6 w-6 text-gray-300" />
            <p className="mt-1 text-xs text-gray-400">Drop campers here</p>
          </div>
        )}
        {assignments.map((a) => (
          <CamperCard
            key={a.id}
            id={a.id}
            name={a.camper_name}
            age={a.camper_age}
            gender={a.camper_gender}
            isDragging={activeDragCamperId === a.camper_id}
          />
        ))}
      </div>
    </DroppableZone>
  )
}
