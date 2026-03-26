interface ClickableWordProps {
  word: string
  isPending?: boolean
  onClick: (word: string) => void
}

export default function ClickableWord({ word, isPending, onClick }: ClickableWordProps) {
  const isBold = word.startsWith('**') && word.endsWith('**')
  const cleanWord = isBold ? word.slice(2, -2) : word

  return (
    <button
      type="button"
      onClick={() => onClick(word)}
      className={`inline rounded px-1 py-0.5 text-right transition hover:bg-[#F9A825]/25 ${
        isPending ? 'bg-[#F9A825]/40 ring-2 ring-[#F9A825]/60' : ''
      } ${isBold ? 'font-bold' : ''}`}
    >
      {cleanWord}
    </button>
  )
}
