import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import useAuth from '../../hooks/useAuth'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="py-10 text-center text-lg font-semibold">جاري التحقق من الحساب...</p>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
