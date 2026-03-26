import { Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <section className="rounded-3xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-8 shadow-sm">
      <div className="rounded-2xl border border-[#F9A825]/40 bg-[linear-gradient(135deg,#1B5E20_0%,#255d2d_40%,#8d6e63_100%)] p-8 text-[#FDF6E3]">
        <p className="mb-2 text-sm text-[#F9E3B0]">منارة القراءة العربية</p>
        <h1 className="font-['Amiri'] text-5xl font-bold">المكتبة الذكية</h1>
        <p className="mt-2 max-w-2xl text-lg text-[#FDEAC2]">اقرأ، تعلم، واحفظ المفردات في بيئة عربية أصيلة.</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to={user ? '/library' : '/signup'}
            className="rounded-xl bg-[#F9A825] px-5 py-2 font-bold text-[#3E2723] transition hover:bg-[#f2b84a]"
          >
            {user ? 'الانتقال إلى مكتبتي' : 'ابدأ الآن'}
          </Link>
          {!user ? (
            <Link
              to="/login"
              className="rounded-xl border border-[#FDF6E3]/60 px-5 py-2 font-semibold text-[#FDF6E3] transition hover:bg-white/10"
            >
              تسجيل الدخول
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
