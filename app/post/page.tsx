'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createJob, RADIUS_OPTIONS, type RadiusValue } from '@/lib/jobs-storage'
import { getCurrentUser } from '@/lib/auth-storage'

const categories = [
  'Cleaning',
  'Moving',
  'Pet Care',
  'Gardening',
  'Tutoring',
  'Delivery',
  'Repair',
  'Errands',
  'Event Help',
  'Other',
]

interface PostJobFormData {
  title: string
  description: string
  category: string
  budget: string
  location: string
  radius: string
  isUrgent: boolean
  isRemote: boolean
}

function parseRadiusValue(value: string): RadiusValue | null {
  if (value === 'anywhere') {
    return 'anywhere'
  }

  const numericValue = Number(value)
  if ([5, 10, 20, 50, 100].includes(numericValue)) {
    return numericValue as RadiusValue
  }

  return null
}

export default function PostJobPage() {
  const router = useRouter()

  const [formData, setFormData] = useState<PostJobFormData>({
    title: '',
    description: '',
    category: '',
    budget: '',
    location: '',
    radius: '10',
    isUrgent: false,
    isRemote: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    const nextValue =
      event.target instanceof HTMLInputElement && event.target.type === 'checkbox'
        ? event.target.checked
        : value

    setFormData((previous) => ({
      ...previous,
      [name]: nextValue,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsSubmitting(true)

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      router.push('/signup?redirect=/post')
      return
    }

    const radius = parseRadiusValue(formData.radius)
    const budget = Number(formData.budget)

    if (!radius || Number.isNaN(budget) || budget <= 0) {
      setError('Please enter a valid budget and radius.')
      setIsSubmitting(false)
      return
    }

    const { error: createError } = await createJob({
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      budget,
      location: formData.location.trim(),
      radius,
      isUrgent: formData.isUrgent,
      isRemote: formData.isRemote,
      posterId: currentUser.id,
    })

    if (createError) {
      setError(createError)
      setIsSubmitting(false)
      return
    }

    setSuccessMessage('Job posted successfully!')
    setTimeout(() => {
      router.push('/jobs')
    }, 1000)
  }

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Link href="/jobs">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Post a Job</h1>
          <p className="text-muted-foreground">Create a listing and receive applications quickly.</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Job Title *</label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., House Cleaning"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the task in detail..."
                required
                rows={4}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Budget (₹) *</label>
              <Input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                placeholder="1500"
                min={1}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Location *</label>
              <Input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Karachi"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Location Radius *</label>
              <select
                name="radius"
                value={formData.radius}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {RADIUS_OPTIONS.map((radiusOption) => (
                  <option key={radiusOption.toString()} value={radiusOption.toString()}>
                    {radiusOption === 'anywhere' ? 'Anywhere' : `${radiusOption} km`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isUrgent"
                  name="isUrgent"
                  checked={formData.isUrgent}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="isUrgent" className="text-sm font-medium text-foreground">
                  Mark as Urgent
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRemote"
                  name="isRemote"
                  checked={formData.isRemote}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="isRemote" className="text-sm font-medium text-foreground">
                  This job can be done remotely
                </label>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}

            <div className="flex gap-4">
              <Button type="submit" size="lg" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post Job'}
              </Button>
              <Link href="/jobs" className="flex-1">
                <Button type="button" variant="outline" size="lg" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
