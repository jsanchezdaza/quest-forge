interface ProgressBarProps {
  label: string
  current: number
  max: number
  color?: 'health' | 'experience'
  className?: string
}

const colorClasses = {
  health: 'from-red-600 to-red-500',
  experience: 'from-medieval-gold to-medieval-darkgold'
}

export default function ProgressBar({ 
  label, 
  current, 
  max, 
  color = 'health',
  className = '' 
}: ProgressBarProps) {
  const percentage = Math.min((current / max) * 100, 100)
  
  return (
    <div className={className}>
      <div className="flex justify-between text-sm text-gray-100 mb-1">
        <span className="font-medium uppercase tracking-wide">{label}</span>
        <span className="font-medium">{current}/{max}</span>
      </div>
      <div className="w-full bg-background-darker rounded-full h-3">
        <div
          className={`bg-gradient-to-r ${colorClasses[color]} h-3 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}