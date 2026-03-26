import { Link, NavLink, useNavigate } from 'react-router-dom'
import { BookOpenIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import useAuth from '../../hooks/useAuth'

function navClass({ isActive }: { isActive: boolean }) {
  return isActive
    ? 'rounded-lg bg-[#1B5E20] px-3 py-2 text-sm font-semibold text-white'
    : 'rounded-lg px-3 py-2 text-sm font-semibold text-[#3E2723] transition hover:bg-[#F9A825]/25'
}

export default function Navbar() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('تم تسجيل الخروج بنجاح')
      navigate('/login')
    } catch {
      toast.error('تعذر تسجيل الخروج، حاول مرة أخرى')
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[#1B5E20]/15 bg-[#FDF6E3]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-[#1B5E20]">
          <BookOpenIcon className="h-7 w-7 flex-shrink-0" />
          <span className="font-['Amiri'] text-xl font-bold truncate max-w-[120px] sm:max-w-none sm:text-2xl">المكتبة الذكية</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <NavLink to="/" className={navClass}>
            الرئيسية
          </NavLink>
          {user ? (
            <>
              <NavLink to="/library" className={navClass}>
                مكتبتي
              </NavLink>
              <NavLink to="/vocab" className={navClass}>
                المفردات
              </NavLink>
              <NavLink to="/profile" className={navClass}>
                الملف الشخصي
              </NavLink>
              {profile?.role === 'admin' ? (
                <NavLink to="/admin" className={navClass}>
                  الإدارة
                </NavLink>
              ) : null}
            </>
          ) : null}
        </nav>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-[#1B5E20]/20 bg-white/80 px-2 py-1">
              {profile?.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt="صورة المستخدم"
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <UserCircleIcon className="h-9 w-9 text-[#1B5E20]" />
              )}
              <span className="max-w-28 truncate text-sm font-semibold text-[#3E2723] hidden sm:inline-block">
                {profile?.displayName || user.displayName || 'قارئ'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-[#1B5E20] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#174E1B]"
            >
              خروج
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/login"
              className="rounded-lg border border-[#1B5E20] px-2 py-2 text-sm font-semibold text-[#1B5E20] transition hover:bg-[#1B5E20]/10 sm:px-3"
            >
              دخول
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-[#1B5E20] px-2 py-2 text-sm font-semibold text-white transition hover:bg-[#174E1B] sm:px-3"
            >
              إنشاء حساب
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

