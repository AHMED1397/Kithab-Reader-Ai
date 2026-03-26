import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { doc, getDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { getAuthErrorMessage, signinWithEmail, signinWithGoogle } from '../../services/authService'
import { auth, db } from '../../config/firebase'

const ADMIN_ALLOWLIST = new Set(['ahmedirshadhaqqaniyyah@gmail.com'])

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: string } | null)?.from ?? '/library'

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      await signinWithEmail(email.trim(), password, rememberMe)
      toast.success('مرحبًا بعودتك')
      navigate(from, { replace: true })
    } catch (error) {
      toast.error(getAuthErrorMessage(error))
      console.error('Login failed:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const loginWithGoogle = async () => {
    setSubmitting(true)
    try {
      await signinWithGoogle()
      toast.success('تم الدخول عبر جوجل بنجاح')
      navigate('/library', { replace: true })
    } catch (error) {
      toast.error(getAuthErrorMessage(error))
      console.error('Google sign in failed:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const loginAsAdmin = async () => {
    setSubmitting(true)

    try {
      const user = await signinWithGoogle()
      const emailValue = user.email?.toLowerCase() ?? ''

      if (!ADMIN_ALLOWLIST.has(emailValue)) {
        await signOut(auth)
        toast.error('هذا الحساب غير مصرح له بدخول لوحة الإدارة')
        return
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const role = userDoc.data()?.role

      if (role !== 'admin') {
        await signOut(auth)
        toast.error('الحساب صحيح ولكن لا يملك صلاحية المشرف')
        return
      }

      toast.success('تم تسجيل دخول المشرف')
      navigate('/admin', { replace: true })
    } catch (error) {
      toast.error(getAuthErrorMessage(error))
      console.error('Admin login failed:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-semibold">البريد الإلكتروني</label>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-[#1B5E20]/30 bg-white px-3 py-2 outline-none focus:border-[#1B5E20]"
          placeholder="name@example.com"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold">كلمة المرور</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-[#1B5E20]/30 bg-white px-3 py-2 outline-none focus:border-[#1B5E20]"
          placeholder="******"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
          className="h-4 w-4"
        />
        تذكّرني على هذا الجهاز
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-[#1B5E20] px-4 py-2 font-semibold text-white transition hover:bg-[#174E1B] disabled:opacity-60"
      >
        {submitting ? 'جاري الدخول...' : 'تسجيل الدخول'}
      </button>

      <button
        type="button"
        disabled={submitting}
        onClick={loginWithGoogle}
        className="w-full rounded-xl border border-[#1B5E20]/40 bg-white px-4 py-2 font-semibold text-[#1B5E20] transition hover:bg-[#1B5E20]/10 disabled:opacity-60"
      >
        الدخول عبر جوجل
      </button>

      <button
        type="button"
        disabled={submitting}
        onClick={loginAsAdmin}
        className="w-full rounded-xl border border-[#BF8F00]/40 bg-[#FFF8E1] px-4 py-2 font-semibold text-[#7A5B00] transition hover:bg-[#FFE9A8] disabled:opacity-60"
      >
        دخول كمشرف
      </button>
    </form>
  )
}
