/**
 * Camp Connect - BunksPage
 * Drag-and-drop bunk assignment board with cabin grouping.
 *
 * Left panel: unassigned campers (droppable pool).
 * Right panel: bunk columns grouped by cabin, each a droppable zone with assigned CamperCards.
 * Cabins are expandable/collapsible sections. Bunks without a cabin appear in "Unassigned" section.
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
  Shield,
  X,
  Heart,
  ChevronDown,
  ChevronRight,
  Building2,
  Home,
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
  useCounselors,
  useAssignCounselor,
} from '@/hooks/useBunks'
import type { Bunk, BunkAssignment } from '@/hooks/useBunks'
import { useCabins } from '@/hooks/useCabins'
import type { Cabin } from '@/hooks/useCabins'
import { useToast } from '@/components/ui/Toast'
import { CamperCard, CamperCardOverlay } from './CamperCard'
import { CounselorCard, CounselorCardOverlay } from './CounselorCard'
import { BunkManageModal } from './BunkManageModal'
import { EventBunkConfigModal } from './EventBunkConfigModal'
import { BuddyRequestsTab } from './BuddyRequestsTab'

// ---- Drag metadata stored during onDragStart ----

interface CamperDragData {
  type: 'camper'
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

interface CounselorDragData {
  type: 'counselor'
  source: 'counselors'
  counselorId: string
  name: string
  avatarUrl: string | null
}

type DragData = CamperDragData | CounselorDragData

// ---- Droppable wrapper for bunk columns + unassigned pool ----

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

// ---- Capacity bar helpers ----

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

// ---- CabinSection: expandable section for a group of bunks ----

interface CabinSectionProps {
  cabin: Cabin | null
  bunks: Bunk[]
  assignmentsByBunk: Record<string, BunkAssignment[]>
  activeDragCamperId: string | null
  onRemoveCounselor: (bunkId: string) => void
  defaultExpanded?: boolean
}

function CabinSection({
  cabin,
  bunks,
  assignmentsByBunk,
  activeDragCamperId,
  onRemoveCounselor,
  defaultExpanded = true,
}: CabinSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  // Compute aggregate stats
  const totalCampers = bunks.reduce(
    (sum, b) => sum + (assignmentsByBunk[b.id]?.length || 0),
    0
  )
  const totalCapacity = bunks.reduce((sum, b) => sum + b.capacity, 0)

  const isUnassigned = cabin === null
  const sectionName = isUnassigned ? 'Unassigned Bunks' : cabin.name
  const sectionIcon = isUnassigned ? (
    <BedDouble className="h-4 w-4 text-gray-400" />
  ) : (
    <Building2 className="h-4 w-4 text-emerald-600" />
  )

  return (
    <div className="mb-4">
      {/* Section header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors',
          isUnassigned
            ? 'bg-gray-50 hover:bg-gray-100'
            : 'bg-emerald-50 hover:bg-emerald-100'
        )}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
        {sectionIcon}
        <span className="text-sm font-semibold text-gray-900">
          {sectionName}
        </span>
        {cabin?.description && (
          <span className="ml-1 text-xs text-gray-500 truncate max-w-[200px]">
            {cabin.description}
          </span>
        )}
        <span className="ml-auto flex items-center gap-3 text-xs text-gray-500">
          {cabin?.location && (
            <span className="inline-flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {cabin.location}
            </span>
          )}
          <span>
            {bunks.length} bunk{bunks.length !== 1 ? 's' : ''}
          </span>
          <span className="font-medium">
            {totalCampers}/{totalCapacity} campers
          </span>
        </span>
      </button>

      {/* Expandable bunk grid */}
      {expanded && (
        <div className="mt-2 grid auto-cols-[280px] grid-flow-col gap-4 overflow-x-auto pb-2 pl-6">
          {bunks.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-10 col-span-full">
              <Home className="h-6 w-6 text-gray-300" />
              <p className="mt-1 text-xs text-gray-400">
                {isUnassigned
                  ? 'All bunks are assigned to cabins'
                  : 'No bunks in this cabin yet'}
              </p>
            </div>
          )}
          {bunks.map((bunk) => (
            <BunkColumn
              key={bunk.id}
              bunk={bunk}
              assignments={assignmentsByBunk[bunk.id] || []}
              activeDragCamperId={activeDragCamperId}
              onRemoveCounselor={onRemoveCounselor}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Main page component ----

type BunkTab = 'board' | 'buddy-requests'

export function BunksPage() {
  const [activeTab, setActiveTab] = useState<BunkTab>('board')
  const { hasPermission } = usePermissions()
  const { toast } = useToast()

  // Event selector
  const { data: events = [], isLoading: eventsLoading } = useEvents()
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(
    undefined
  )

  // Cabins + Bunks + assignments
  const { data: cabins = [], isLoading: cabinsLoading } = useCabins()
  const { data: bunks = [], isLoading: bunksLoading } = useBunks()
  const { data: assignments = [], isLoading: assignmentsLoading } =
    useBunkAssignments(selectedEventId)
  const { data: unassigned = [], isLoading: unassignedLoading } =
    useUnassignedCampers(selectedEventId)

  // Counselors
  const { data: counselors = [] } = useCounselors(selectedEventId)

  // Compute counselors not yet assigned to any bunk
  const assignedCounselorIds = useMemo(() => {
    const ids = new Set<string>()
    for (const b of bunks) {
      if (b.counselor_user_id) ids.add(b.counselor_user_id)
    }
    return ids
  }, [bunks])

  const unassignedCounselors = useMemo(
    () => counselors.filter((c) => !assignedCounselorIds.has(c.id)),
    [counselors, assignedCounselorIds]
  )

  // Mutations
  const assignCamper = useAssignCamper(selectedEventId)
  const unassignCamper = useUnassignCamper(selectedEventId)
  const moveCamper = useMoveCamper(selectedEventId)
  const assignCounselor = useAssignCounselor()

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

  // Group bunks by cabin
  const { cabinGroups, unassignedBunks } = useMemo(() => {
    const cabinMap = new Map<string, Bunk[]>()
    const noParent: Bunk[] = []

    for (const bunk of bunks) {
      if (bunk.cabin_id) {
        if (!cabinMap.has(bunk.cabin_id)) cabinMap.set(bunk.cabin_id, [])
        cabinMap.get(bunk.cabin_id)!.push(bunk)
      } else {
        noParent.push(bunk)
      }
    }

    // Sort cabins to match the cabins list order
    const groups: { cabin: Cabin; bunks: Bunk[] }[] = []
    for (const cabin of cabins) {
      groups.push({
        cabin,
        bunks: cabinMap.get(cabin.id) || [],
      })
    }

    return { cabinGroups: groups, unassignedBunks: noParent }
  }, [bunks, cabins])

  // ---- Drag handlers ----

  function handleDragStart(event: DragStartEvent) {
    const dragId = String(event.active.id)

    // Check if it is a counselor (prefixed with counselor-)
    if (dragId.startsWith('counselor-')) {
      const counselorId = dragId.replace('counselor-', '')
      const counselor = counselors.find((c) => c.id === counselorId)
      if (counselor) {
        setActiveDragData({
          type: 'counselor',
          source: 'counselors',
          counselorId: counselor.id,
          name: `${counselor.first_name} ${counselor.last_name}`,
          avatarUrl: counselor.avatar_url,
        })
      }
      return
    }

    // Check if it is an unassigned camper
    const camper = unassigned.find((c) => c.id === dragId)
    if (camper) {
      setActiveDragData({
        type: 'camper',
        source: 'unassigned',
        camperId: camper.id,
        name: `${camper.first_name} ${camper.last_name}`,
        age: camper.age,
        gender: camper.gender,
      })
      return
    }

    // Otherwise it is an assignment id
    const assignment = assignments.find((a) => a.id === dragId)
    if (assignment) {
      setActiveDragData({
        type: 'camper',
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

    // Dropped back where it came from
    if (targetId === dragData.source) return

    try {
      // Handle counselor drops
      if (dragData.type === 'counselor') {
        if (targetId !== 'unassigned' && targetId !== 'counselors') {
          await assignCounselor.mutateAsync({
            bunkId: targetId,
            counselorUserId: dragData.counselorId,
          })
          toast({
            type: 'success',
            message: `${dragData.name} assigned as counselor.`,
          })
        }
        return
      }

      // Handle camper drops
      if (dragData.source === 'unassigned' && targetId !== 'unassigned') {
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

  // ---- Counselor removal handler ----

  async function handleRemoveCounselor(bunkId: string) {
    try {
      await assignCounselor.mutateAsync({
        bunkId,
        counselorUserId: null,
      })
      toast({ type: 'success', message: 'Counselor removed from bunk.' })
    } catch {
      toast({ type: 'error', message: 'Failed to remove counselor.' })
    }
  }

  // ---- Loading state ----

  const isLoading =
    eventsLoading ||
    bunksLoading ||
    cabinsLoading ||
    (selectedEventId && (assignmentsLoading || unassignedLoading))

  // ---- Render ----

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Bunk Assignments
          </h1>
          <div className="mt-2 flex gap-1">
            <button
              onClick={() => setActiveTab('board')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                activeTab === 'board'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              )}
            >
              <BedDouble className="mr-1.5 inline h-4 w-4" />
              Board
            </button>
            <button
              onClick={() => setActiveTab('buddy-requests')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                activeTab === 'buddy-requests'
                  ? 'bg-pink-100 text-pink-700'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              )}
            >
              <Heart className="mr-1.5 inline h-4 w-4" />
              Buddy Requests
            </button>
          </div>
        </div>
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
          {selectedEventId && hasPermission('core.bunks.update') && (
            <button
              onClick={() => setShowBunkConfigModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <BedDouble className="h-4 w-4" />
              Configure Bunks
            </button>
          )}

          {/* Manage Bunks button */}
          {hasPermission('core.bunks.update') && (
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

      {/* Buddy Requests Tab */}
      {activeTab === 'buddy-requests' && <BuddyRequestsTab />}

      {/* Board Tab Content */}
      {activeTab === 'board' && !selectedEventId && !isLoading && (
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
      {activeTab === 'board' && isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Main board */}
      {activeTab === 'board' && selectedEventId && !isLoading && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-1 gap-6 overflow-hidden">
            {/* ---- Left panel: Unassigned campers ---- */}
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
                      isDragging={
                        activeDragData?.type === 'camper' &&
                        activeDragData.camperId === camper.id
                      }
                    />
                  ))}
                </div>
              </DroppableZone>
            </div>

            {/* ---- Middle panel: Counselors ---- */}
            <div className="w-[260px] shrink-0">
              <div className="flex h-full flex-col rounded-xl border border-gray-100 bg-white shadow-sm transition-all">
                {/* Panel header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-indigo-500" />
                    <h2 className="text-sm font-semibold text-gray-900">
                      Counselors
                    </h2>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                    {unassignedCounselors.length}
                  </span>
                </div>

                {/* Counselor list */}
                <div className="flex-1 space-y-2 overflow-y-auto p-3">
                  {unassignedCounselors.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Shield className="h-8 w-8 text-indigo-200" />
                      <p className="mt-2 text-xs text-gray-500">
                        {counselors.length === 0
                          ? 'No counselors available'
                          : 'All counselors assigned'}
                      </p>
                    </div>
                  )}
                  {unassignedCounselors.map((c) => (
                    <CounselorCard
                      key={c.id}
                      id={`counselor-${c.id}`}
                      name={`${c.first_name} ${c.last_name}`}
                      avatarUrl={c.avatar_url}
                      isDragging={
                        activeDragData?.type === 'counselor' &&
                        activeDragData.counselorId === c.id
                      }
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ---- Right panel: Cabin-grouped Bunk columns ---- */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {bunks.length === 0 && cabins.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-20">
                  <Building2 className="h-10 w-10 text-gray-300" />
                  <p className="mt-3 text-sm font-medium text-gray-900">
                    No cabins or bunks created yet
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Use &quot;Manage Bunks&quot; to create cabins and bunk rooms.
                  </p>
                </div>
              )}

              {/* Cabin sections */}
              {cabinGroups.map(({ cabin, bunks: cabinBunks }) => (
                <CabinSection
                  key={cabin.id}
                  cabin={cabin}
                  bunks={cabinBunks}
                  assignmentsByBunk={assignmentsByBunk}
                  activeDragCamperId={
                    activeDragData?.type === 'camper'
                      ? activeDragData.camperId
                      : null
                  }
                  onRemoveCounselor={handleRemoveCounselor}
                />
              ))}

              {/* Unassigned bunks section */}
              {unassignedBunks.length > 0 && (
                <CabinSection
                  cabin={null}
                  bunks={unassignedBunks}
                  assignmentsByBunk={assignmentsByBunk}
                  activeDragCamperId={
                    activeDragData?.type === 'camper'
                      ? activeDragData.camperId
                      : null
                  }
                  onRemoveCounselor={handleRemoveCounselor}
                />
              )}
            </div>
          </div>

          {/* Drag overlay */}
          <DragOverlay dropAnimation={null}>
            {activeDragData?.type === 'camper' ? (
              <CamperCardOverlay
                name={activeDragData.name}
                age={activeDragData.age}
                gender={activeDragData.gender}
              />
            ) : activeDragData?.type === 'counselor' ? (
              <CounselorCardOverlay
                name={activeDragData.name}
                avatarUrl={activeDragData.avatarUrl}
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

// ---- BunkColumn ----

function BunkColumn({
  bunk,
  assignments,
  activeDragCamperId,
  onRemoveCounselor,
}: {
  bunk: Bunk
  assignments: BunkAssignment[]
  activeDragCamperId: string | null
  onRemoveCounselor?: (bunkId: string) => void
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
          <div className="mt-1 flex items-center gap-1">
            <Shield className="h-3 w-3 text-indigo-400" />
            <span className="text-xs font-medium text-indigo-600">
              {bunk.counselor_name}
            </span>
            {onRemoveCounselor && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveCounselor(bunk.id)
                }}
                className="ml-auto rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Remove counselor"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
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
