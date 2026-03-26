interface ProgressBarProps {
  value: number
}

export default function ProgressBar({ value }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value))

  return (
    <div className="sticky top-[72px] z-10 rounded-full border border-[#1B5E20]/20 bg-white/80 p-1 backdrop-blur">
      <div className="h-2 overflow-hidden rounded-full bg-[#1B5E20]/10">
        <div className="h-full rounded-full bg-[#F9A825] transition-all duration-300" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  )
}
