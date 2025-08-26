interface StatsListProps {
  stats: Record<string, number>
  title?: string
}

export default function StatsList({ stats, title = 'Attributes' }: StatsListProps) {
  return (
    <div>
      <h3 className="font-fantasy-classic font-semibold text-lg text-medieval-gold uppercase tracking-wider drop-shadow-lg mb-4">
        {title}
      </h3>
      <div className="space-y-3">
        {Object.entries(stats).map(([stat, value]) => (
          <div key={stat} className="flex justify-between">
            <span className="text-gray-100 capitalize text-sm font-medium">
              {stat}
            </span>
            <span className="text-medieval-gold font-semibold text-sm">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}