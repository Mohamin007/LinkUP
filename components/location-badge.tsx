import { MapPin } from 'lucide-react'

interface LocationBadgeProps {
  distance: string
  location?: string
}

export function LocationBadge({ distance, location }: LocationBadgeProps) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <MapPin className="w-4 h-4" />
      <span className="text-sm">
        {distance}
        {location && ` • ${location}`}
      </span>
    </div>
  )
}
