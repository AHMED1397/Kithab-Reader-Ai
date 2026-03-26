import type { VocabularyEntry } from '../types/kitab'

function escapeCsvCell(value: unknown) {
  const stringValue = String(value ?? '')
  const escaped = stringValue.replace(/"/g, '""')
  return `"${escaped}"`
}

export function exportVocabularyAsJson(entries: VocabularyEntry[]) {
  const payload = JSON.stringify(entries, null, 2)
  const blob = new Blob([payload], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'vocabulary.json'
  link.click()
  URL.revokeObjectURL(url)
}

export function exportVocabularyAsCsv(entries: VocabularyEntry[]) {
  const headers = ['Word', 'MeaningArabic', 'MeaningTamil', 'MeaningEnglish', 'BookId', 'ChapterId', 'SavedAt', 'ReviewCount']
  const lines = entries.map((entry) =>
    [
      entry.word,
      entry.meaningAr,
      entry.meaningTa,
      entry.meaningEn,
      entry.kitabId,
      entry.chapterId,
      entry.savedAt?.toISOString() ?? '',
      entry.reviewCount,
    ]
      .map(escapeCsvCell)
      .join(','),
  )

  const csv = [headers.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'vocabulary.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export function exportVocabularyAsPdf(entries: VocabularyEntry[]) {
  const rows = entries
    .map(
      (entry) =>
        `<tr><td>${entry.word}</td><td>${entry.meaningAr}</td><td>${entry.meaningTa}</td><td>${entry.meaningEn}</td><td>${entry.kitabId}</td></tr>`,
    )
    .join('')

  const html = `
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>مفكرة المفردات</title>
        <style>
          body { font-family: 'Noto Naskh Arabic', serif; padding: 24px; }
          h1 { color: #1B5E20; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: right; }
          th { background: #f5f0e8; }
        </style>
      </head>
      <body>
        <h1>مفكرة المفردات</h1>
        <table>
          <thead>
            <tr>
              <th>الكلمة</th>
              <th>العربية</th>
              <th>Tamil</th>
              <th>English</th>
              <th>المصدر</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `

  const popup = window.open('', '_blank')
  if (!popup) {
    return
  }

  popup.document.write(html)
  popup.document.close()
  popup.focus()
  popup.print()
}
