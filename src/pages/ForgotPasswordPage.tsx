import { Link } from 'react-router-dom'
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <section className="mx-auto max-w-md rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-6 shadow-sm">
      <h1 className="font-['Amiri'] text-3xl font-bold text-[#1B5E20]">استعادة كلمة المرور</h1>
      <ForgotPasswordForm />
      <p className="mt-4 text-sm">
        العودة إلى{' '}
        <Link to="/login" className="font-semibold text-[#1B5E20] hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </section>
  )
}
