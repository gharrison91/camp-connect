import {
  ShoppingBag,
} from 'lucide-react'
import { ComingSoonPage } from '@/components/ui/ComingSoonPage'

export function StorePage() {
  return (
    <ComingSoonPage
      title="Store"
      description="Set up a camp store for merchandise, snacks, and supplies. Manage inventory, pricing, and camper spending accounts."
      icon={ShoppingBag}
    />
  )
}
