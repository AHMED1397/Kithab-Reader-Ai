import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import useAuth from '../hooks/useAuth'
import { changeUserPassword, updateDisplayName } from '../services/authService'

export default function ProfilePage() {
  const { user, profile, logout } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.displayName ?? user?.displayName ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [loadingName, setLoadingName] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)

  if (!user) {
    return null
  }

  const saveName = async (event: FormEvent) => {
    event.preventDefault()
    if (!displayName.trim()) {
      toast.error('الاسم لا يمكن أن يكون فارغًا')
      return
    }

    setLoadingName(true)
    try {
      await updateDisplayName(user.uid, displayName.trim())
      toast.success('تم تحديث الاسم بنجاح')
    } catch {
      toast.error('تعذر تحديث الاسم')
    } finally {
      setLoadingName(false)
    }
  }

  const savePassword = async (event: FormEvent) => {
    event.preventDefault()
    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    setLoadingPassword(true)
    try {
      await changeUserPassword(newPassword)
      setNewPassword('')
      toast.success('تم تغيير كلمة المرور')
    } catch {
      toast.error('فشلت العملية، قد تحتاج لتسجيل الدخول مجددًا')
    } finally {
      setLoadingPassword(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-6 shadow-sm">
        <h1 className="font-['Amiri'] text-4xl font-bold text-[#1B5E20]">الملف الشخصي</h1>
        <p className="text-sm text-[#5D4037]">البريد: {user.email}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={saveName} className="rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-6 shadow-sm">
          <h2 className="mb-3 text-xl font-bold text-[#1B5E20]">تعديل الاسم</h2>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded-xl border border-[#1B5E20]/30 bg-white px-3 py-2 outline-none focus:border-[#1B5E20]"
          />
          <button
            type="submit"
            disabled={loadingName}
            className="mt-3 rounded-xl bg-[#1B5E20] px-4 py-2 font-semibold text-white transition hover:bg-[#174E1B] disabled:opacity-60"
          >
            {loadingName ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </form>

        <form
          onSubmit={savePassword}
          className="rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-6 shadow-sm"
        >
          <h2 className="mb-3 text-xl font-bold text-[#1B5E20]">تغيير كلمة المرور</h2>
          <input
            type="password"
            minLength={6}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="كلمة المرور الجديدة"
            className="w-full rounded-xl border border-[#1B5E20]/30 bg-white px-3 py-2 outline-none focus:border-[#1B5E20]"
          />
          <button
            type="submit"
            disabled={loadingPassword}
            className="mt-3 rounded-xl bg-[#1B5E20] px-4 py-2 font-semibold text-white transition hover:bg-[#174E1B] disabled:opacity-60"
          >
            {loadingPassword ? 'جاري التغيير...' : 'تحديث'}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-6 shadow-sm">
        <h2 className="mb-3 text-xl font-bold text-[#1B5E20]">إحصائيات القراءة</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-3">الكتب المقروءة: {profile?.stats.totalBooksRead ?? 0}</div>
          <div className="rounded-xl bg-white p-3">المفردات المحفوظة: {profile?.stats.totalVocabSaved ?? 0}</div>
          <div className="rounded-xl bg-white p-3">أيام المواظبة: {profile?.stats.currentStreak ?? 0}</div>
          <div className="rounded-xl bg-white p-3">الدور: {profile?.role === 'admin' ? 'مشرف' : 'قارئ'}</div>
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          className="mt-4 rounded-xl border border-red-500 px-4 py-2 font-semibold text-red-600 transition hover:bg-red-50"
        >
          تسجيل الخروج
        </button>
      </div>
    </section>
  )
}
