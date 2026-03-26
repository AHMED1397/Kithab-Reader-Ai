import { Link } from 'react-router-dom'
import SignupForm from '../components/auth/SignupForm'

export default function SignupPage() {
  return (
    <section className="mx-auto max-w-md rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-6 shadow-sm">
      <h1 className="font-['Amiri'] text-3xl font-bold text-[#1B5E20]">إنشاء حساب جديد</h1>
      <p className="mb-4 text-sm text-[#5D4037]">ابدأ رحلتك مع القراءة الذكية.</p>
      <SignupForm />
      <p className="mt-4 text-sm">
        لديك حساب بالفعل؟{' '}
        <Link to="/login" className="font-semibold text-[#1B5E20] hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </section>
  )
}
