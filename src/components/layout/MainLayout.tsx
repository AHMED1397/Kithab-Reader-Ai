import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import MobileNav from './MobileNav'
import useAuth from '../../hooks/useAuth'
import ConnectionBanner from './ConnectionBanner'

export default function MainLayout() {
  const location = useLocation()
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen flex-col text-[#3E2723]">
      <ConnectionBanner />
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-20 sm:px-6 lg:px-8">
        <div key={location.pathname} className="animate-fade-up">
          <Outlet />
        </div>
      </main>
      <Footer />
      {user ? <MobileNav /> : null}
    </div>
  )
}
