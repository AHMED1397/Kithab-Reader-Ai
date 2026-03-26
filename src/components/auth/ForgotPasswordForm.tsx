import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { requestPasswordReset } from '../../services/authService'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSending(true)

    try {
      await requestPasswordReset(email.trim())
      toast.success('تم إرسال رابط إعادة تعيين كلمة المرور')
      setEmail('')
    } catch {
      toast.error('تعذر إرسال الرابط، تحقق من البريد')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-[#5D4037]">أدخل بريدك وسنرسل لك رابط إعادة تعيين كلمة المرور.</p>
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

      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-xl bg-[#1B5E20] px-4 py-2 font-semibold text-white transition hover:bg-[#174E1B] disabled:opacity-60"
      >
        {sending ? 'جاري الإرسال...' : 'إرسال الرابط'}
      </button>
    </form>
  )
}
