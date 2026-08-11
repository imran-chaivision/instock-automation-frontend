import { createLazyFileRoute } from '@tanstack/react-router'
import VcShipments from '@/features/vc-shipments'

export const Route = createLazyFileRoute('/_authenticated/vc-shipments/')({
  component: VcShipments,
})
