import { Link } from 'react-router-dom'
import LoginForm from '../components/auth/LoginForm'

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-6 shadow-sm">
      <h1 className="font-['Amiri'] text-3xl font-bold text-[#1B5E20]">تسجيل الدخول</h1>
      <p className="mb-4 text-sm text-[#5D4037]">أهلاً بك في المكتبة الذكية.</p>
      <LoginForm />
      <div className="mt-4 flex items-center justify-between text-sm">
        <Link to="/forgot-password" className="font-semibold text-[#1B5E20] hover:underline">
          نسيت كلمة المرور؟
        </Link>
        <Link to="/signup" className="font-semibold text-[#1B5E20] hover:underline">
          إنشاء حساب جديد
        </Link>
      </div>
    </section>
  )
}
