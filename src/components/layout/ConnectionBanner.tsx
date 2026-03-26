import { useEffect, useState } from 'react'

export default function ConnectionBanner() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (online) {
    return null
  }

  return (
    <div className="bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-900">
      أنت الآن دون اتصال. سيتم تأجيل عمليات الذكاء الاصطناعي والمزامنة تلقائيًا.
    </div>
  )
}
