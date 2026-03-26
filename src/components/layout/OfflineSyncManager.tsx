import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { processOfflineAiQueue } from '../../services/offlineQueueService'

export default function OfflineSyncManager() {
  useEffect(() => {
    const sync = async () => {
      const result = await processOfflineAiQueue()
      if (result.processed > 0) {
        toast.success(`تمت مزامنة ${result.processed} عملية مؤجلة`) 
      }
      if (result.failed > 0) {
        toast.error(`تعذر مزامنة ${result.failed} عملية`) 
      }
    }

    void sync()

    const onOnline = () => {
      void sync()
    }

    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  return null
}
