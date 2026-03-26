interface JsonValidatorProps {
  errors: string[]
}

export default function JsonValidator({ errors }: JsonValidatorProps) {
  if (errors.length === 0) {
    return (
      <div className="rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-700">
        JSON صالح وجاهز للاستيراد.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
      <h4 className="mb-2 font-bold">أخطاء التحقق</h4>
      <ul className="space-y-1">
        {errors.map((error) => (
          <li key={error}>- {error}</li>
        ))}
      </ul>
    </div>
  )
}
