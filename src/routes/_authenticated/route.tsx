import { ProtectedRoute } from '@/components/protected-route'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen">
      <nav className="w-48 shrink-0 border-r p-4">
        <Link
          to="/vc-shipments"
          className="flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          activeProps={{ className: 'bg-accent text-accent-foreground' }}
        >
          Send to 3PL
        </Link>
      </nav>
      <div className="flex-1 overflow-auto">
        {/* No children passed -> ProtectedRoute falls back to <Outlet />, so whichever
            child route actually matched (dashboard, tasks, vc-shipments, etc.) renders,
            instead of always hardcoding the dashboard regardless of URL. */}
        <ProtectedRoute />
      </div>
    </div>
  )
}
