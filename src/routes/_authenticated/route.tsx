import { ProtectedRoute } from '@/components/protected-route'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  // No children passed -> ProtectedRoute falls back to <Outlet />, so whichever
  // child route actually matched (dashboard, tasks, vc-shipments, etc.) renders,
  // instead of always hardcoding the dashboard regardless of URL.
  return <ProtectedRoute />
}
