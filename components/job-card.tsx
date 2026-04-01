'use client'

import Link from 'next/link'
import { MapPin, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { PostedJob } from '@/lib/jobs-storage'

interface JobCardProps {
  job: PostedJob
}

const CATEGORY_COLORS: Record<string, string> = {
  'Cleaning': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Moving': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'Pet Care': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Yard Work': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  'Tutoring': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  'Events': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  'Handyman': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  'Creative': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
}

export function JobCard({ job }: JobCardProps) {
  const categoryColor = CATEGORY_COLORS[job.category] || 'bg-gray-100 text-gray-800'

  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="group h-full cursor-pointer overflow-hidden border border-border/50 card-hover bg-card/50 backdrop-blur-sm">
        <div className="relative p-6 flex flex-col h-full">
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative space-y-4">
            {/* Header with Category and Urgent Badge */}
            <div className="flex justify-between items-start gap-3">
              <Badge className={`${categoryColor} font-medium text-xs px-3 py-1`}>
                {job.category}
              </Badge>
              {job.isUrgent && (
                <div className="flex items-center gap-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-600 dark:text-red-300 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30 animate-pulse">
                  <Zap className="h-3 w-3" />
                  Urgent
                </div>
              )}
            </div>

            {/* Job Title */}
            <h3 className="text-xl font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
              {job.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {job.description}
            </p>

            {/* Location and Distance */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0 text-primary/60" />
              <span className="font-medium">{job.location}</span>
              <span className="text-xs">• {job.isRemote ? 'Remote' : job.radiusKm === null ? 'Anywhere' : `${job.radiusKm} km`}</span>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-border via-border to-transparent" />

            {/* Pay and Duration */}
            <div className="flex justify-between items-end gap-4 pt-2">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Budget</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  ₹{job.budget.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Status</p>
                <p className="text-sm font-bold text-foreground">
                  {job.status === 'occupied' ? 'Occupied' : 'Open'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
