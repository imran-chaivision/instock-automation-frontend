import { useAuth } from '@/lib/auth'
import { Navigate, Outlet } from '@tanstack/react-router'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
    children?: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated } = useAuth()

    if (!isAuthenticated) {
        return <Navigate to="/sign-in" />
    }

    return children || <Outlet />
}
