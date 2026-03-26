import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import useAuth from '../../hooks/useAuth'

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <p className="py-10 text-center text-lg font-semibold">جاري التحقق من الصلاحيات...</p>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/library" replace />
  }

  return <>{children}</>
}
