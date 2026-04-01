import { AlertCircle } from 'lucide-react'

interface UrgencyBadgeProps {
  level: 'low' | 'medium' | 'high'
}

export function UrgencyBadge({ level }: UrgencyBadgeProps) {
  const urgencyConfig = {
    low: { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-700 dark:text-blue-400', label: 'Low' },
    medium: { bg: 'bg-yellow-50 dark:bg-yellow-950/20', text: 'text-yellow-700 dark:text-yellow-400', label: 'Medium' },
    high: { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-400', label: 'High' },
  }

  const config = urgencyConfig[level]

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
      {level === 'high' && <AlertCircle className="w-3 h-3" />}
      <span>{config.label}</span>
    </div>
  )
}
