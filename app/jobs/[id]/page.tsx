'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, MapPin, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getCurrentUser, type AuthUser } from '@/lib/auth-storage'
import {
  applyToJob,
  fetchJobById,
  markJobAsOccupied,
  removePostedJob,
  type PostedJob,
} from '@/lib/jobs-storage'

export default function JobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = Array.isArray(params.id) ? params.id[0] : params.id

  const [job, setJob] = useState<PostedJob | null>(null)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isApplying, setIsApplying] = useState(false)
  const [dialogMessage, setDialogMessage] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (!jobId) {
        setIsLoading(false)
        return
      }

      const [user, fetchedJob] = await Promise.all([getCurrentUser(), fetchJobById(jobId)])

      setCurrentUser(user)
      setJob(fetchedJob)
      setIsLoading(false)
    }

    void loadData()
  }, [jobId])

  const isOwner = useMemo(() => {
    if (!currentUser || !job) {
      return false
    }

    return currentUser.id === job.posterId
  }, [currentUser, job])

  const showDialog = (message: string) => {
    setDialogMessage(message)
    setIsDialogOpen(true)
  }

  const handleApply = async () => {
    if (!job || !currentUser) {
      return
    }

    if (job.status !== 'open') {
      showDialog('This job is no longer open for applications.')
      return
    }

    if (currentUser.id === job.posterId) {
      showDialog('You cannot apply to your own job.')
      return
    }

    setIsApplying(true)
    const result = await applyToJob(job.id, currentUser.id)

    if (result.error) {
      showDialog(result.error)
      setIsApplying(false)
      return
    }

    if (result.duplicate) {
      showDialog('You have already applied to this job.')
      setIsApplying(false)
      return
    }

    showDialog('Application sent! The poster will be notified and can contact you via Messages.')
    setIsApplying(false)
  }

  const handleMarkAsOccupied = async () => {
    if (!job || !currentUser) {
      return
    }

    const result = await markJobAsOccupied(job.id, currentUser.id)
    if (result.error) {
      showDialog(result.error)
      return
    }

    const updatedJob = await fetchJobById(job.id)
    setJob(updatedJob)
    showDialog('Job marked as occupied.')
  }

  const handleRemoveJob = async () => {
    if (!job || !currentUser) {
      return
    }

    const result = await removePostedJob(job.id, currentUser.id)
    if (result.error) {
      showDialog(result.error)
      return
    }

    router.push('/my-jobs')
  }

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="p-8 text-center text-muted-foreground">Loading job...</Card>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="bg-background min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Link href="/jobs">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Button>
          </Link>

          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Job not found</h1>
            <p className="text-muted-foreground mb-6">This listing does not exist anymore.</p>
            <Link href="/jobs">
              <Button>Go to Job Feed</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
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

        <Card className="p-8 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{job.title}</h1>
              <p className="text-muted-foreground mb-1 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {job.location}
              </p>
              <p className="text-xs text-muted-foreground">
                Posted on {new Date(job.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge variant={job.status === 'occupied' ? 'secondary' : 'default'}>
                {job.status === 'occupied' ? 'Occupied' : 'Open'}
              </Badge>
              {job.isUrgent && (
                <div className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Urgent
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            {job.posterAvatar ? (
              <img
                src={job.posterAvatar}
                alt={job.posterName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold">
                {job.posterName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-foreground">{job.posterName}</p>
              <p className="text-xs text-muted-foreground">Poster</p>
            </div>
          </div>

          <p className="text-lg text-foreground mb-6">{job.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-card rounded-lg border border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Budget</p>
              <p className="text-2xl font-bold text-primary">₹{job.budget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Radius</p>
              <p className="text-lg font-semibold text-foreground">
                {job.isRemote ? 'Remote' : job.radiusKm === null ? 'Anywhere' : `${job.radiusKm} km`}
              </p>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full mb-3"
            onClick={handleApply}
            disabled={isApplying || job.status !== 'open' || isOwner || !currentUser}
          >
            {!currentUser ? 'Log in to apply' : isApplying ? 'Applying...' : 'I can do this'}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="lg" variant="outline" className="w-full">
                Manage Poster
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={handleMarkAsOccupied}
                disabled={!isOwner || job.status === 'occupied'}
              >
                Mark as Occupied
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={handleRemoveJob} disabled={!isOwner}>
                Remove Job
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Safety Tips
          </h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>• Always meet in public or well-lit areas</li>
            <li>• Verify the job details before committing</li>
            <li>• Do not share personal financial information</li>
            <li>• Report suspicious activity to support</li>
            <li>• Use in-app chat for communication</li>
          </ul>
        </Card>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogMessage}</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>Okay</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
