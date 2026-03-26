import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import useAuth from '../../hooks/useAuth'
import { bulkImportKitabs } from '../../services/kitabService'
import { parseAndValidateKitabJson } from '../../utils/jsonValidator'
import JsonValidator from './JsonValidator'
import KitabPreview from './KitabPreview'

const templates = {
  flat: `{
  "id": "ajrumiyyah_001",
  "title": "متن الآجرومية",
  "author": "ابن آجروم",
  "category": "نحو",
  "level": "مبتدئ",
  "coverColor": "#1B5E20",
  "description": "متن مختصر في قواعد النحو العربي",
  "chapters": [
    {
      "chapterId": "ch_01",
      "title": "باب الكلام",
      "order": 1,
      "content": "الكلام هو اللفظ المركب المفيد بالوضع"
    }
  ]
}`,
  baabFasl: `{
  "id": "fiqh_advanced_001",
  "title": "كتاب فقهي نموذجي",
  "author": "مؤلف افتراضي",
  "category": "فقه",
  "level": "متوسط",
  "coverColor": "#8D6E63",
  "description": "مثال لبنية كتاب > باب > فصل > فقرة",
  "structureLabels": ["كتاب", "باب", "فصل", "فقرة"],
  "sections": [
    {
      "id": "baab_tahara",
      "title": "باب الطهارة",
      "type": "باب",
      "children": [
        {
          "id": "fasl_wudu",
          "title": "فصل الوضوء",
          "type": "فصل",
          "children": [
            {
              "id": "para_1",
              "title": "الفقرة الأولى",
              "type": "فقرة",
              "content": "هذا نص الفقرة الأولى في فصل الوضوء."
            },
            {
              "id": "para_2",
              "title": "الفقرة الثانية",
              "type": "فقرة",
              "content": "هذا نص الفقرة الثانية في فصل الوضوء."
            }
          ]
        }
      ]
    }
  ]
}`,
  juzSura: `{
  "id": "juz_amma_001",
  "title": "جزء عم",
  "author": "مصحف وتعليق",
  "category": "تفسير",
  "level": "مبتدئ",
  "coverColor": "#0D47A1",
  "description": "مثال لبنية جزء > سورة > مقطع",
  "structureLabels": ["جزء", "سورة", "مقطع"],
  "sections": [
    {
      "id": "juz_amma",
      "title": "جزء عم",
      "type": "جزء",
      "children": [
        {
          "id": "surah_naba",
          "title": "سورة النبأ",
          "type": "سورة",
          "children": [
            {
              "id": "maqta_1",
              "title": "المقطع الأول",
              "type": "مقطع",
              "content": "عم يتساءلون عن النبإ العظيم الذي هم فيه مختلفون"
            }
          ]
        }
      ]
    }
  ]
}`,
}

export default function AddKitab() {
  const { user } = useAuth()
  const [jsonText, setJsonText] = useState(templates.flat)
  const [submitting, setSubmitting] = useState(false)

  const validation = useMemo(() => parseAndValidateKitabJson(jsonText), [jsonText])

  const importFile = async (file: File) => {
    const text = await file.text()
    setJsonText(text)
  }

  const submit = async () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول')
      return
    }

    if (!validation.valid) {
      toast.error('يوجد أخطاء في JSON')
      return
    }

    setSubmitting(true)
    try {
      await bulkImportKitabs(validation.kitabs, user.uid)
      toast.success(`تم استيراد ${validation.kitabs.length} كتاب بنجاح`)
    } catch {
      toast.error('فشل الاستيراد، تحقق من الصلاحيات')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-4 shadow-sm">
        <h3 className="text-xl font-bold text-[#1B5E20]">إضافة كتب عبر JSON المتقدم</h3>
        <p className="text-sm text-[#6D4C41]">
          يمكنك استخدام طريقة الفصول المباشرة أو طريقة هرمية متقدمة عبر `sections`. النظام سيحوّلها تلقائيًا إلى وحدات قراءة مناسبة.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setJsonText(templates.flat)}
            className="rounded-xl border border-[#1B5E20]/30 bg-white px-3 py-2 text-sm font-semibold text-[#1B5E20]"
          >
            نموذج فصول عادي
          </button>
          <button
            type="button"
            onClick={() => setJsonText(templates.baabFasl)}
            className="rounded-xl border border-[#1B5E20]/30 bg-white px-3 py-2 text-sm font-semibold text-[#1B5E20]"
          >
            نموذج باب / فصل
          </button>
          <button
            type="button"
            onClick={() => setJsonText(templates.juzSura)}
            className="rounded-xl border border-[#1B5E20]/30 bg-white px-3 py-2 text-sm font-semibold text-[#1B5E20]"
          >
            نموذج جزء / سورة
          </button>
        </div>

        <div className="rounded-xl bg-white p-3 text-sm text-[#6D4C41]">
          <p className="font-semibold text-[#1B5E20]">الطريقة المتقدمة الموصى بها</p>
          <p>`structureLabels`: لتحديد أسماء المستويات مثل باب، فصل، فقرة.</p>
          <p>`sections`: شجرة مرنة. كل عقدة يمكن أن تكون حاوية فقط أو تحتوي `content` وتصبح وحدة قراءة.</p>
          <p>إذا كان عندك كتاب بسيط، استخدم `chapters` كما هو.</p>
        </div>

        <textarea
          value={jsonText}
          onChange={(event) => setJsonText(event.target.value)}
          className="min-h-[420px] w-full rounded-xl border border-[#1B5E20]/30 bg-white p-3 font-mono text-sm outline-none focus:border-[#1B5E20]"
        />

        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-xl border border-[#1B5E20]/40 bg-white px-4 py-2 text-sm font-semibold text-[#1B5E20] hover:bg-[#1B5E20]/10">
            رفع ملف JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  void importFile(file)
                }
              }}
            />
          </label>

          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="rounded-xl bg-[#1B5E20] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#174E1B] disabled:opacity-60"
          >
            {submitting ? 'جاري الاستيراد...' : 'حفظ في Firestore'}
          </button>
        </div>

        <JsonValidator errors={validation.errors} />
      </div>

      <div className="space-y-3 rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-4 shadow-sm">
        <h3 className="text-xl font-bold text-[#1B5E20]">معاينة</h3>
        <KitabPreview kitabs={validation.kitabs} />
      </div>
    </section>
  )
}
