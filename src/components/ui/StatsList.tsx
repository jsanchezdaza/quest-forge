interface StatsListProps {
  stats: Record<string, number>
  title?: string
}

export default function StatsList({ stats, title = 'Attributes' }: StatsListProps) {
  return (
    <div>
      <h3 className="text-lg font-medieval text-medieval-gold mb-4">
        {title}
      </h3>
      <div className="space-y-3">
        {Object.entries(stats).map(([stat, value]) => (
          <div key={stat} className="flex justify-between">
            <span className="text-gray-300 capitalize">
              {stat}
            </span>
            <span className="text-medieval-gold font-semibold">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}