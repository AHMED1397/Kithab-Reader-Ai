import { NavLink } from 'react-router-dom'
import { BookOpenIcon, UserIcon, LanguageIcon } from '@heroicons/react/24/outline'

function mobileClass({ isActive }: { isActive: boolean }) {
  return isActive
    ? 'flex flex-col items-center gap-1 text-[#1B5E20]'
    : 'flex flex-col items-center gap-1 text-[#6D4C41]'
}

export default function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[#1B5E20]/15 bg-[#FDF6E3]/95 px-6 py-2 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around">
        <NavLink to="/library" className={mobileClass}>
          <BookOpenIcon className="h-5 w-5" />
          <span className="text-xs font-semibold">المكتبة</span>
        </NavLink>
        <NavLink to="/vocab" className={mobileClass}>
          <LanguageIcon className="h-5 w-5" />
          <span className="text-xs font-semibold">المفردات</span>
        </NavLink>
        <NavLink to="/profile" className={mobileClass}>
          <UserIcon className="h-5 w-5" />
          <span className="text-xs font-semibold">حسابي</span>
        </NavLink>
      </div>
    </nav>
  )
}
