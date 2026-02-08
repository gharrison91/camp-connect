import {
  MessageSquare,
  Heart,
  UserCog,
  Camera,
  BarChart3,
  ShoppingBag,
} from 'lucide-react'
import { ComingSoonPage } from '@/components/ui/ComingSoonPage'

export function CommunicationsPage() {
  return (
    <ComingSoonPage
      title="Communications"
      description="Send messages, manage notification preferences, and keep parents and staff informed with built-in messaging tools."
      icon={MessageSquare}
    />
  )
}

export function HealthSafetyPage() {
  return (
    <ComingSoonPage
      title="Health & Safety"
      description="Track health forms, log incidents, manage medications, and ensure every camper's well-being is documented and accessible."
      icon={Heart}
    />
  )
}

export function StaffPage() {
  return (
    <ComingSoonPage
      title="Staff"
      description="Manage staff profiles, track certifications, build schedules, and coordinate your team all in one place."
      icon={UserCog}
    />
  )
}

export function PhotosPage() {
  return (
    <ComingSoonPage
      title="Photos"
      description="Upload, organize, and share camp photos with families through secure galleries and automated albums."
      icon={Camera}
    />
  )
}

export function AnalyticsPage() {
  return (
    <ComingSoonPage
      title="Analytics"
      description="View enrollment trends, financial reports, attendance insights, and other key metrics to make data-driven decisions."
      icon={BarChart3}
    />
  )
}

export function StorePage() {
  return (
    <ComingSoonPage
      title="Store"
      description="Set up a camp store for merchandise, snacks, and supplies. Manage inventory, pricing, and camper spending accounts."
      icon={ShoppingBag}
    />
  )
}
