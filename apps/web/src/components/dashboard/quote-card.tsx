interface Props {
  quote?: { text: string; author?: string | null } | null
}

export function QuoteCard({ quote }: Props) {
  if (!quote) return null

  return (
    <div className="border-l-2 border-primary/40 pl-4 py-1">
      <p className="text-sm text-muted-foreground italic leading-relaxed">
        &ldquo;{quote.text}&rdquo;
      </p>
      {quote.author && (
        <p className="text-xs text-muted-foreground/60 mt-1">— {quote.author}</p>
      )}
    </div>
  )
}
