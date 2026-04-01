'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  fetchOpenJobs,
  RADIUS_OPTIONS,
  subscribeToOpenJobs,
  type PostedJob,
  type RadiusValue,
} from '@/lib/jobs-storage'

function parseRadiusValue(value: string): RadiusValue {
  if (value === 'anywhere') {
    return 'anywhere'
  }

  const numericValue = Number(value)
  if ([5, 10, 20, 50, 100].includes(numericValue)) {
    return numericValue as RadiusValue
  }

  return 'anywhere'
}

const CATEGORY_COLORS: Record<string, string> = {
  Cleaning: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  Moving: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'Pet Care': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  Gardening: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  Tutoring: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  Delivery: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<PostedJob[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [category, setCategory] = useState('all')
  const [maxBudget, setMaxBudget] = useState('')
  const [radius, setRadius] = useState<RadiusValue>('anywhere')
  const [urgentOnly, setUrgentOnly] = useState(false)

  const loadJobs = async () => {
    setIsLoading(true)
    const nextJobs = await fetchOpenJobs()
    setJobs(nextJobs)
    setIsLoading(false)
  }

  useEffect(() => {
    void loadJobs()

    const unsubscribe = subscribeToOpenJobs(() => {
      void loadJobs()
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const categories = useMemo(() => {
    const uniqueCategories = new Set(jobs.map((job) => job.category))
    return ['all', ...Array.from(uniqueCategories)]
  }, [jobs])

  const filteredJobs = useMemo(() => {
    const parsedMaxBudget = Number(maxBudget)

    return jobs.filter((job) => {
      if (category !== 'all' && job.category !== category) {
        return false
      }

      if (!Number.isNaN(parsedMaxBudget) && maxBudget.trim() && job.budget > parsedMaxBudget) {
        return false
      }

      if (urgentOnly && !job.isUrgent) {
        return false
      }

      if (radius !== 'anywhere' && !job.isRemote) {
        if (job.radiusKm !== null && job.radiusKm > radius) {
          return false
        }
      }

      return true
    })
  }, [jobs, category, maxBudget, urgentOnly, radius])

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold text-foreground mb-2">Available Jobs</h1>
        <p className="text-muted-foreground mb-6">Live job feed powered by Supabase.</p>

        <Card className="p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {categories.map((categoryOption) => (
                  <option key={categoryOption} value={categoryOption}>
                    {categoryOption === 'all' ? 'All categories' : categoryOption}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Max Budget (₹)</label>
              <input
                value={maxBudget}
                onChange={(event) => setMaxBudget(event.target.value)}
                type="number"
                min={1}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Any"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Location Radius</label>
              <select
                value={radius.toString()}
                onChange={(event) => setRadius(parseRadiusValue(event.target.value))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {RADIUS_OPTIONS.map((radiusOption) => (
                  <option key={radiusOption.toString()} value={radiusOption.toString()}>
                    {radiusOption === 'anywhere' ? 'Anywhere' : `${radiusOption} km`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={urgentOnly}
                  onChange={(event) => setUrgentOnly(event.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                Urgent only
              </label>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <Card className="p-8 text-center text-muted-foreground">Loading jobs...</Card>
        ) : filteredJobs.length === 0 ? (
          <Card className="p-10 text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-3">No jobs found</h2>
            <p className="text-muted-foreground mb-6">Try adjusting filters or post a new job.</p>
            <Link href="/post">
              <Button size="lg">Post a Job</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const categoryColor = CATEGORY_COLORS[job.category] || 'bg-gray-100 text-gray-800'

              return (
                <Link href={`/jobs/${job.id}`} key={job.id}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden h-full">
                    <div className="p-6 flex flex-col h-full">
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <Badge className={categoryColor}>{job.category}</Badge>
                        {job.isUrgent && (
                          <div className="flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-2 py-1 rounded text-xs font-semibold">
                            <Zap className="h-3 w-3" />
                            Urgent
                          </div>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">{job.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">{job.description}</p>

                      <div className="flex items-center gap-2 mb-4">
                        {job.posterAvatar ? (
                          <img
                            src={job.posterAvatar}
                            alt={job.posterName}
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold">
                            {job.posterName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground truncate">{job.posterName}</p>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                        <span>
                          • {job.isRemote ? 'Remote' : job.radiusKm === null ? 'Anywhere' : `${job.radiusKm} km`}
                        </span>
                      </div>

                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-muted-foreground">Budget</p>
                          <p className="text-lg font-bold text-primary">₹{job.budget.toLocaleString()}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
