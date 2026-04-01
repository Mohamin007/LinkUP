import { Star } from 'lucide-react'

interface RatingStarsProps {
  rating: number
  maxRating?: number
  showLabel?: boolean
}

export function RatingStars({ rating, maxRating = 5, showLabel = false }: RatingStarsProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: maxRating }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < Math.floor(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
      {showLabel && <span className="text-sm font-medium">{rating}</span>}
    </div>
  )
}
