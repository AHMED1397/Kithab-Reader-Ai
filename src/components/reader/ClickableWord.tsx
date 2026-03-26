interface ClickableWordProps {
  word: string
  onClick: (word: string) => void
}

export default function ClickableWord({ word, onClick }: ClickableWordProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(word)}
      className="inline rounded px-1 py-0.5 text-right transition hover:bg-[#F9A825]/25"
    >
      {word}
    </button>
  )
}
