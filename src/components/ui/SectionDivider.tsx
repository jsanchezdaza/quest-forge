interface SectionDividerProps {
  className?: string
}

/**
 * Decorative divider: a thin gold line with a centered diamond, used under
 * section titles to match the medieval theme.
 */
export default function SectionDivider({ className = '' }: SectionDividerProps) {
  return (
    <div className={`flex items-center gap-2 text-medieval-gold/40 ${className}`} aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-medieval-gold/40" />
      <span className="rotate-45 w-1.5 h-1.5 bg-medieval-gold/60" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-medieval-gold/40" />
    </div>
  )
}
