/**
 * Camp Connect - Enhanced Portal Dashboard Page
 * Rich parent portal landing page with camper cards, events, announcements, and quick links.
 */

import { useNavigate } from 'react-router-dom'
import {
  Users,
  Calendar,
  Camera,
  MessageCircle,
  ChevronRight,
  MapPin,
  Clock,
  Megaphone,
  Heart,
  FolderOpen,
  ClipboardList,
  Pill,
  UserCircle,
  Tent,
  Sun,
  TreePine,
} from 'lucide-react'
import { usePortalDashboard } from '@/hooks/usePortalDashboard'
import type { PortalDashboardData } from '@/hooks/usePortalDashboard'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function calculateAge(dob: string | null): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatFullDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateStr)
}

/* ------------------------------------------------------------------ */
/*  Loading Skeleton                                                   */
/* ------------------------------------------------------------------ */

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 p-8">
        <div className="h-8 w-64 rounded-lg bg-emerald-200/60" />
        <div className="mt-2 h-5 w-48 rounded-lg bg-emerald-100/60" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gray-100" />
              <div className="flex-1">
                <div className="h-4 w-20 rounded bg-gray-100" />
                <div className="mt-2 h-7 w-10 rounded bg-gray-100" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 w-32 rounded bg-gray-200" />
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gray-100" />
                  <div className="flex-1">
                    <div className="h-5 w-40 rounded bg-gray-100" />
                    <div className="mt-2 h-4 w-28 rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-6 w-40 rounded bg-gray-200" />
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-gray-50" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  label: string
  value: number
  icon: React.ReactNode
  bgColor: string
  iconColor: string
  onClick?: () => void
}

function StatCard({ label, value, icon, bgColor, iconColor, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-gray-200 text-left w-full"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgColor}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Quick Link Card                                                    */
/* ------------------------------------------------------------------ */

interface QuickLinkProps {
  label: string
  description: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  to: string
}

function QuickLink({ label, description, icon, iconBg, iconColor, to }: QuickLinkProps) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all hover:border-emerald-200 hover:shadow-md group"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg} transition-transform group-hover:scale-110`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 truncate">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard Component                                           */
/* ------------------------------------------------------------------ */

export function PortalDashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading } = usePortalDashboard()

  if (isLoading || !data) {
    return <DashboardSkeleton />
  }

  const {
    campers,
    upcoming_events,
    recent_photos_count,
    unread_messages_count,
    announcements,
    parent_first_name,
  } = data as PortalDashboardData

  return (
    <div className="space-y-8">
      {/* ── Welcome Header ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 p-8 text-white shadow-lg">
        {/* Decorative elements */}
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -right-2 top-12 h-20 w-20 rounded-full bg-white/5" />
        <div className="absolute right-24 -top-4 h-16 w-16 rounded-full bg-white/5" />
        <div className="absolute left-1/2 bottom-0 opacity-10">
          <TreePine className="h-24 w-24" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Sun className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-emerald-100">
              {formatFullDate()}
            </span>
          </div>
          <h1 className="text-3xl font-bold">
            Welcome back, {parent_first_name}!
          </h1>
          <p className="mt-2 text-emerald-100 max-w-lg">
            Here&apos;s what&apos;s happening at camp. Check on your campers, view upcoming events, and stay connected.
          </p>
        </div>
      </div>

      {/* ── Quick Stats ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="My Campers"
          value={campers.length}
          icon={<Users className="h-5 w-5" />}
          bgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Upcoming Events"
          value={upcoming_events.length}
          icon={<Calendar className="h-5 w-5" />}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="New Photos"
          value={recent_photos_count}
          icon={<Camera className="h-5 w-5" />}
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
          onClick={() => navigate('/portal/photos')}
        />
        <StatCard
          label="Messages"
          value={unread_messages_count}
          icon={<MessageCircle className="h-5 w-5" />}
          bgColor="bg-amber-50"
          iconColor="text-amber-600"
          onClick={() => navigate('/portal/messages')}
        />
      </div>

      {/* ── Main Content Grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Campers + Events */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Campers */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Tent className="h-5 w-5 text-emerald-600" />
                My Campers
              </h2>
            </div>

            {campers.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
                  <Users className="h-7 w-7 text-gray-300" />
                </div>
                <p className="mt-4 text-sm font-medium text-gray-900">No campers linked</p>
                <p className="mt-1 text-sm text-gray-500">
                  Contact the camp to link your campers to your account.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {campers.map((camper) => {
                  const age = calculateAge(camper.date_of_birth)
                  return (
                    <div
                      key={camper.id}
                      className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-emerald-100"
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        {camper.photo_url ? (
                          <img
                            src={camper.photo_url}
                            alt={`${camper.first_name} ${camper.last_name}`}
                            className="h-14 w-14 rounded-full object-cover ring-2 ring-emerald-100"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-lg ring-2 ring-emerald-100">
                            {getInitials(camper.first_name, camper.last_name)}
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900">
                            {camper.first_name} {camper.last_name}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            {age !== null && (
                              <span className="inline-flex items-center gap-1">
                                <UserCircle className="h-3.5 w-3.5" />
                                Age {age}
                              </span>
                            )}
                            {camper.bunk_name && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                                <Tent className="h-3 w-3" />
                                {camper.bunk_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => navigate(`/portal/campers/${camper.id}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          <UserCircle className="h-3.5 w-3.5" />
                          View Profile
                        </button>
                        <button
                          onClick={() => navigate('/portal/messages')}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Send Message
                        </button>
                        <button
                          onClick={() => navigate(`/portal/campers/${camper.id}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100"
                        >
                          <Heart className="h-3.5 w-3.5" />
                          Health Records
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Upcoming Events */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Upcoming Events
              </h2>
            </div>

            {upcoming_events.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
                  <Calendar className="h-7 w-7 text-gray-300" />
                </div>
                <p className="mt-4 text-sm font-medium text-gray-900">No upcoming events</p>
                <p className="mt-1 text-sm text-gray-500">
                  Events will appear here when scheduled by the camp.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
                {upcoming_events.map((event, idx) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-gray-50"
                  >
                    {/* Date Badge */}
                    <div className="flex flex-col items-center justify-center rounded-lg bg-blue-50 px-3 py-2 min-w-[60px]">
                      <span className="text-xs font-medium text-blue-600 uppercase">
                        {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-xl font-bold text-blue-700">
                        {new Date(event.start_date).getDate()}
                      </span>
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {event.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(event.start_date)}
                        </span>
                        {event.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timeline dot */}
                    <div className="hidden sm:flex flex-col items-center">
                      <div className={`h-3 w-3 rounded-full ${idx === 0 ? 'bg-blue-500' : 'bg-gray-200'}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Announcements + Quick Links */}
        <div className="space-y-6">
          {/* Announcements */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-orange-500" />
                Announcements
              </h2>
            </div>

            {announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                  <Megaphone className="h-6 w-6 text-gray-300" />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-900">No announcements</p>
                <p className="mt-1 text-xs text-gray-500">
                  Camp announcements will show up here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {ann.subject}
                      </h3>
                      <span className="shrink-0 text-xs text-gray-400">
                        {timeAgo(ann.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                      {ann.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Links */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ChevronRight className="h-5 w-5 text-gray-400" />
              Quick Links
            </h2>

            <div className="space-y-2">
              <QuickLink
                label="Bunk Buddies"
                description="View and request bunk buddy preferences"
                icon={<Users className="h-4 w-4" />}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                to="/portal/bunk-buddies"
              />
              <QuickLink
                label="Forms"
                description="Complete required camp forms"
                icon={<ClipboardList className="h-4 w-4" />}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                to="/portal/forms"
              />
              <QuickLink
                label="Documents"
                description="View and download camp documents"
                icon={<FolderOpen className="h-4 w-4" />}
                iconBg="bg-violet-50"
                iconColor="text-violet-600"
                to="/portal/documents"
              />
              <QuickLink
                label="Messages"
                description="Send and receive camper messages"
                icon={<MessageCircle className="h-4 w-4" />}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                to="/portal/messages"
              />
              <QuickLink
                label="Medicine Requests"
                description="Submit medication administration requests"
                icon={<Pill className="h-4 w-4" />}
                iconBg="bg-rose-50"
                iconColor="text-rose-600"
                to="/portal/medicine"
              />
              <QuickLink
                label="Photos"
                description="Browse recent camp photos"
                icon={<Camera className="h-4 w-4" />}
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
                to="/portal/photos"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
