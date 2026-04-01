interface CategoryBadgeProps {
  name: string
  color: string
}

export function CategoryBadge({ name, color }: CategoryBadgeProps) {
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white bg-gradient-to-r ${color}`}>
      {name}
    </div>
  )
}
