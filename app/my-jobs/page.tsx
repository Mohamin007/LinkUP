'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getCurrentUser, type AuthUser } from '@/lib/auth-storage'
import {
  fetchApplicationsForJob,
  fetchMyJobs,
  markJobAsOccupied,
  removePostedJob,
  submitReview,
  type JobApplication,
  type PostedJob,
} from '@/lib/jobs-storage'

export default function MyJobsPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [jobs, setJobs] = useState<PostedJob[]>([])
  const [applicationsByJobId, setApplicationsByJobId] = useState<Record<string, JobApplication[]>>({})
  const [selectedApplicantByJobId, setSelectedApplicantByJobId] = useState<Record<string, string>>({})
  const [ratingByJobId, setRatingByJobId] = useState<Record<string, string>>({})
  const [commentByJobId, setCommentByJobId] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusError, setStatusError] = useState('')

  const loadPageData = async (userId: string) => {
    const nextJobs = await fetchMyJobs(userId)
    setJobs(nextJobs)

    const occupiedJobs = nextJobs.filter((job) => job.status === 'occupied')

    const applicationEntries = await Promise.all(
      occupiedJobs.map(async (job) => {
        const applications = await fetchApplicationsForJob(job.id)
        return [job.id, applications] as const
      }),
    )

    setApplicationsByJobId(Object.fromEntries(applicationEntries))
  }

  useEffect(() => {
    const initialize = async () => {
      const user = await getCurrentUser()
      setCurrentUser(user)

      if (user) {
        await loadPageData(user.id)
      }

      setIsLoading(false)
    }

    void initialize()
  }, [])

  const handleMarkAsOccupied = async (jobId: string) => {
    if (!currentUser) {
      return
    }

    setStatusError('')
    setStatusMessage('')

    const result = await markJobAsOccupied(jobId, currentUser.id)

    if (result.error) {
      setStatusError(result.error)
      return
    }

    await loadPageData(currentUser.id)
    setStatusMessage('Job marked as occupied.')
  }

  const handleRemove = async (jobId: string) => {
    if (!currentUser) {
      return
    }

    setStatusError('')
    setStatusMessage('')

    const result = await removePostedJob(jobId, currentUser.id)

    if (result.error) {
      setStatusError(result.error)
      return
    }

    await loadPageData(currentUser.id)
    setStatusMessage('Job removed successfully.')
  }

  const handleSubmitReview = async (jobId: string) => {
    if (!currentUser) {
      return
    }

    const selectedApplicantId = selectedApplicantByJobId[jobId]
    const ratingValue = Number(ratingByJobId[jobId] || 0)
    const comment = commentByJobId[jobId] || ''

    if (!selectedApplicantId || ratingValue < 1 || ratingValue > 5) {
      setStatusError('Select an applicant and provide a rating between 1 and 5.')
      setStatusMessage('')
      return
    }

    setStatusError('')
    setStatusMessage('')

    const result = await submitReview({
      jobId,
      reviewerId: currentUser.id,
      revieweeId: selectedApplicantId,
      rating: ratingValue,
      comment,
    })

    if (result.error) {
      setStatusError(result.error)
      return
    }

    setStatusMessage('Review submitted and trust score updated.')
    setCommentByJobId((previous) => ({ ...previous, [jobId]: '' }))
  }

  const totalOpenJobs = useMemo(() => jobs.filter((job) => job.status === 'open').length, [jobs])

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="p-8 text-center text-muted-foreground">Loading your jobs...</Card>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/profile">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>
        </Link>

        <h1 className="text-4xl font-bold text-foreground mb-2">My Posted Jobs</h1>
        <p className="text-muted-foreground mb-6">Open jobs: {totalOpenJobs} • Total jobs: {jobs.length}</p>

        {statusError && <p className="text-sm text-destructive mb-4">{statusError}</p>}
        {statusMessage && <p className="text-sm text-green-600 mb-4">{statusMessage}</p>}

        {jobs.length === 0 ? (
          <Card className="p-10 text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-3">No jobs posted yet</h2>
            <p className="text-muted-foreground mb-6">Create your first listing to start receiving applications.</p>
            <Link href="/post">
              <Button size="lg">Post a Job</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const applications = applicationsByJobId[job.id] || []

              return (
                <Card key={job.id} className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-2xl font-semibold text-foreground">{job.title}</h2>
                        <Badge variant={job.status === 'occupied' ? 'secondary' : 'default'}>
                          {job.status === 'occupied' ? 'Occupied' : 'Open'}
                        </Badge>
                      </div>

                      <p className="text-muted-foreground">{job.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.location} • Radius: {job.isRemote ? 'Remote' : job.radiusKm === null ? 'Anywhere' : `${job.radiusKm} km`}
                      </p>
                      <p className="text-sm font-semibold text-primary">₹{job.budget.toLocaleString()}</p>

                      {job.status === 'occupied' && (
                        <div className="mt-4 p-4 rounded-md border border-border bg-card/50 space-y-3">
                          <h3 className="font-semibold text-foreground">Rate Worker</h3>

                          {applications.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No applications available yet for this job.</p>
                          ) : (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Worker</label>
                                <select
                                  value={selectedApplicantByJobId[job.id] || ''}
                                  onChange={(event) =>
                                    setSelectedApplicantByJobId((previous) => ({
                                      ...previous,
                                      [job.id]: event.target.value,
                                    }))
                                  }
                                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                  <option value="">Select applicant</option>
                                  {applications.map((application) => (
                                    <option key={application.id} value={application.applicantId}>
                                      {application.applicantName}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Rating (1 to 5)</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={5}
                                  value={ratingByJobId[job.id] || ''}
                                  onChange={(event) =>
                                    setRatingByJobId((previous) => ({
                                      ...previous,
                                      [job.id]: event.target.value,
                                    }))
                                  }
                                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Review</label>
                                <textarea
                                  rows={3}
                                  value={commentByJobId[job.id] || ''}
                                  onChange={(event) =>
                                    setCommentByJobId((previous) => ({
                                      ...previous,
                                      [job.id]: event.target.value,
                                    }))
                                  }
                                  placeholder="Share feedback about the worker"
                                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                              </div>

                              <Button onClick={() => handleSubmitReview(job.id)}>
                                Submit Review
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 md:w-56">
                      <Button
                        variant="outline"
                        onClick={() => handleMarkAsOccupied(job.id)}
                        disabled={job.status === 'occupied'}
                      >
                        Mark as Occupied
                      </Button>

                      <Button variant="destructive" onClick={() => handleRemove(job.id)}>
                        Remove Job
                      </Button>

                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="ghost" className="w-full">View Listing</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
