import {
  BarChart3,
  ShoppingBag,
} from 'lucide-react'
import { ComingSoonPage } from '@/components/ui/ComingSoonPage'

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
