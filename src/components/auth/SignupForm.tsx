import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getAuthErrorMessage, signupWithEmail } from '../../services/authService'

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function SignupForm() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const submit = async (event: FormEvent) => {
    event.preventDefault()

    if (!validEmail(email.trim())) {
      toast.error('صيغة البريد الإلكتروني غير صحيحة')
      return
    }

    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    if (password !== confirmPassword) {
      toast.error('تأكيد كلمة المرور غير مطابق')
      return
    }

    setSubmitting(true)

    try {
      await signupWithEmail(email.trim(), password, displayName.trim(), avatarFile)
      toast.success('تم إنشاء الحساب بنجاح')
      navigate('/library', { replace: true })
    } catch (error) {
      toast.error(getAuthErrorMessage(error))
      console.error('Signup failed:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-semibold">الاسم الظاهر</label>
        <input
          type="text"
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="w-full rounded-xl border border-[#1B5E20]/30 bg-white px-3 py-2 outline-none focus:border-[#1B5E20]"
          placeholder="مثال: أحمد"
        />
      </div>

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

      <div>
        <label className="mb-1 block text-sm font-semibold">تأكيد كلمة المرور</label>
        <input
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded-xl border border-[#1B5E20]/30 bg-white px-3 py-2 outline-none focus:border-[#1B5E20]"
          placeholder="******"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold">صورة الحساب (اختياري)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setAvatarFile(event.target.files?.[0])}
          className="w-full rounded-xl border border-[#1B5E20]/30 bg-white px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-[#1B5E20] px-4 py-2 font-semibold text-white transition hover:bg-[#174E1B] disabled:opacity-60"
      >
        {submitting ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
      </button>
    </form>
  )
}
