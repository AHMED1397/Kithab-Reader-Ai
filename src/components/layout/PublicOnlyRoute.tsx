import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import useAuth from '../../hooks/useAuth'

export default function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <p className="py-10 text-center text-lg font-semibold">جاري التحميل...</p>
  }

  if (user) {
    return <Navigate to="/library" replace />
  }

  return <>{children}</>
}
