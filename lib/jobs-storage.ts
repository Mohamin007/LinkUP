import { supabase } from '@/lib/supabase'
import { sendConversationMessage } from '@/lib/chat-storage'

export const RADIUS_OPTIONS = [5, 10, 20, 50, 100, 'anywhere'] as const

export type RadiusValue = (typeof RADIUS_OPTIONS)[number]
export type JobStatus = 'open' | 'occupied'

export interface PostedJob {
  id: string
  title: string
  description: string
  category: string
  budget: number
  location: string
  radiusKm: number | null
  isUrgent: boolean
  isRemote: boolean
  status: JobStatus
  posterId: string
  posterName: string
  posterAvatar: string
  createdAt: string
}

export interface CreatePostedJobInput {
  title: string
  description: string
  category: string
  budget: number
  location: string
  radius: RadiusValue
  isUrgent: boolean
  isRemote: boolean
  posterId: string
}

export interface JobFilters {
  category?: string
  maxBudget?: number
  radius?: RadiusValue
  urgentOnly?: boolean
}

export interface JobApplication {
  id: string
  jobId: string
  applicantId: string
  applicantName: string
  applicantAvatar: string
  createdAt: string
}

export interface ReviewInput {
  jobId: string
  reviewerId: string
  revieweeId: string
  rating: number
  comment: string
}

interface JobRow {
  id: string
  title: string
  description: string
  category: string
  budget: number | null
  location: string
  radius: number | null
  is_urgent: boolean | null
  is_remote: boolean | null
  status: string | null
  poster_id: string
  created_at: string | null
}

interface ProfileRow {
  id: string
  full_name: string | null
}

interface ApplicationRow {
  id: string
  job_id: string
  applicant_id: string
  created_at: string | null
}

function normalizeStatus(status: string | null): JobStatus {
  return status === 'occupied' ? 'occupied' : 'open'
}

function mapJobRow(job: JobRow, profileById: Map<string, ProfileRow>): PostedJob {
  const poster = profileById.get(job.poster_id)

  return {
    id: job.id,
    title: job.title,
    description: job.description,
    category: job.category,
    budget: job.budget ?? 0,
    location: job.location,
    radiusKm: job.radius,
    isUrgent: !!job.is_urgent,
    isRemote: !!job.is_remote,
    status: normalizeStatus(job.status),
    posterId: job.poster_id,
    posterName: poster?.full_name || 'Unknown Poster',
    posterAvatar: '',
    createdAt: job.created_at || new Date().toISOString(),
  }
}

async function fetchProfilesByIds(profileIds: string[]): Promise<Map<string, ProfileRow>> {
  const uniqueProfileIds = Array.from(new Set(profileIds.filter(Boolean)))
  if (uniqueProfileIds.length === 0) {
    return new Map()
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', uniqueProfileIds)

  if (error || !data) {
    return new Map()
  }

  return new Map((data as ProfileRow[]).map((profile) => [profile.id, profile]))
}

function applyJobFilters(jobs: PostedJob[], filters?: JobFilters): PostedJob[] {
  if (!filters) {
    return jobs
  }

  return jobs.filter((job) => {
    if (filters.category && filters.category !== 'all' && job.category !== filters.category) {
      return false
    }

    if (typeof filters.maxBudget === 'number' && Number.isFinite(filters.maxBudget) && job.budget > filters.maxBudget) {
      return false
    }

    if (filters.urgentOnly && !job.isUrgent) {
      return false
    }

    if (filters.radius && filters.radius !== 'anywhere') {
      if (job.isRemote) {
        return true
      }

      if (job.radiusKm === null) {
        return true
      }

      if (job.radiusKm > filters.radius) {
        return false
      }
    }

    return true
  })
}

export async function fetchOpenJobs(filters?: JobFilters): Promise<PostedJob[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('id, title, description, category, budget, location, radius, is_urgent, is_remote, status, poster_id, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }

  const jobRows = data as JobRow[]
  const profileById = await fetchProfilesByIds(jobRows.map((job) => job.poster_id))
  const jobs = jobRows.map((job) => mapJobRow(job, profileById))

  return applyJobFilters(jobs, filters)
}

export function subscribeToOpenJobs(onChange: () => void): () => void {
  const channelName = `jobs-feed-realtime-${Math.random().toString(36).slice(2)}`
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
      onChange()
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function fetchJobById(jobId: string): Promise<PostedJob | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select('id, title, description, category, budget, location, radius, is_urgent, is_remote, status, poster_id, created_at')
    .eq('id', jobId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const jobRow = data as JobRow
  const profileById = await fetchProfilesByIds([jobRow.poster_id])
  return mapJobRow(jobRow, profileById)
}

export async function createJob(input: CreatePostedJobInput): Promise<{ job?: PostedJob; error?: string }> {
  const radius = input.radius === 'anywhere' ? null : input.radius

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      title: input.title,
      description: input.description,
      category: input.category,
      budget: input.budget,
      location: input.location,
      radius,
      is_urgent: input.isUrgent,
      is_remote: input.isRemote,
      status: 'open',
      poster_id: input.posterId,
    })
    .select('id, title, description, category, budget, location, radius, is_urgent, is_remote, status, poster_id, created_at')
    .maybeSingle()

  if (error || !data) {
    return { error: error?.message || 'Could not create job.' }
  }

  const job = await fetchJobById((data as JobRow).id)

  if (!job) {
    return { error: 'Job created but failed to load details.' }
  }

  return { job }
}

export async function fetchMyJobs(posterId: string): Promise<PostedJob[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('id, title, description, category, budget, location, radius, is_urgent, is_remote, status, poster_id, created_at')
    .eq('poster_id', posterId)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }

  const jobRows = data as JobRow[]
  const profileById = await fetchProfilesByIds([posterId])

  return jobRows.map((job) => mapJobRow(job, profileById))
}

export async function markJobAsOccupied(jobId: string, ownerId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('jobs')
    .update({ status: 'occupied' })
    .eq('id', jobId)
    .eq('poster_id', ownerId)

  if (error) {
    return { error: error.message }
  }

  return {}
}

export async function removePostedJob(jobId: string, ownerId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId)
    .eq('poster_id', ownerId)

  if (error) {
    return { error: error.message }
  }

  return {}
}

export async function checkApplicationExists(jobId: string, applicantId: string): Promise<{ exists: boolean; error?: string }> {
  const { data: existingApplication, error: checkError } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('applicant_id', applicantId)
    .maybeSingle()

  if (checkError && checkError.code !== 'PGRST116') {
    return { exists: false, error: checkError.message }
  }

  return { exists: !!existingApplication }
}

export async function applyToJob(jobId: string, applicantId: string): Promise<{ applied: boolean; duplicate: boolean; error?: string }> {
  const { data: existingApplication, error: checkError } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('applicant_id', applicantId)
    .maybeSingle()

  if (checkError && checkError.code !== 'PGRST116') {
    return { applied: false, duplicate: false, error: checkError.message }
  }

  if (existingApplication) {
    return { applied: false, duplicate: true }
  }

  const { error: insertError } = await supabase
    .from('applications')
    .insert({
      job_id: jobId,
      applicant_id: applicantId,
    })

  if (insertError) {
    return { applied: false, duplicate: false, error: insertError.message }
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', applicantId)
    .maybeSingle()

  if (profileError) {
    return { applied: false, duplicate: false, error: profileError.message }
  }

  const applicantName = profileData?.full_name || 'Someone'

  const { data: jobData, error: jobError } = await supabase
    .from('jobs')
    .select('title, poster_id')
    .eq('id', jobId)
    .maybeSingle()

  if (jobError || !jobData) {
    return { applied: false, duplicate: false, error: jobError?.message || 'Could not load job details.' }
  }

  const jobTitle = jobData.title || 'your job'
  const posterId = jobData.poster_id

  const messageResult = await sendConversationMessage({
    senderId: applicantId,
    recipientId: posterId,
    jobId,
    content: 'Hi! I saw your job post and I am interested. Please let me know if you are available.',
  })

  if (messageResult.error) {
    return { applied: false, duplicate: false, error: messageResult.error }
  }

  const { error: notificationError } = await supabase
    .from('notifications')
    .insert({
      user_id: posterId,
      message: `${applicantName} is interested in your job: ${jobTitle}`,
      read: false,
    })

  if (notificationError) {
    return { applied: false, duplicate: false, error: notificationError.message }
  }

  return { applied: true, duplicate: false }
}

export async function fetchApplicationsForJob(jobId: string): Promise<JobApplication[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('id, job_id, applicant_id, created_at')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }

  const rows = data as ApplicationRow[]
  const profileById = await fetchProfilesByIds(rows.map((application) => application.applicant_id))

  return rows.map((application) => {
    const applicant = profileById.get(application.applicant_id)

    return {
      id: application.id,
      jobId: application.job_id,
      applicantId: application.applicant_id,
      applicantName: applicant?.full_name || 'Unknown applicant',
      applicantAvatar: '',
      createdAt: application.created_at || new Date().toISOString(),
    }
  })
}

export async function submitReview(input: ReviewInput): Promise<{ error?: string }> {
  const normalizedRating = Math.max(1, Math.min(5, Math.round(input.rating)))

  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('job_id', input.jobId)
    .eq('reviewer_id', input.reviewerId)
    .eq('reviewee_id', input.revieweeId)
    .maybeSingle()

  if (existingReview) {
    return { error: 'You already submitted a review for this worker on this job.' }
  }

  const { error: insertError } = await supabase
    .from('reviews')
    .insert({
      job_id: input.jobId,
      reviewer_id: input.reviewerId,
      reviewee_id: input.revieweeId,
      rating: normalizedRating,
      comment: input.comment,
    })

  if (insertError) {
    return { error: insertError.message }
  }

  const { data: allReviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', input.revieweeId)

  if (reviewsError || !allReviews) {
    return { error: reviewsError?.message || 'Review saved but profile update failed.' }
  }

  const ratings = allReviews.map((review) => Number(review.rating) || 0).filter((rating) => rating > 0)
  const reviewCount = ratings.length
  const average = reviewCount === 0 ? 0 : Number((ratings.reduce((sum, rating) => sum + rating, 0) / reviewCount).toFixed(2))

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('jobs_completed')
    .eq('id', input.revieweeId)
    .maybeSingle()

  const nextJobsCompleted = Math.max(0, Number(existingProfile?.jobs_completed ?? 0) + 1)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      trust_score: average,
      reviews_count: reviewCount,
      jobs_completed: nextJobsCompleted,
    })
    .eq('id', input.revieweeId)

  if (updateError) {
    return { error: updateError.message }
  }

  return {}
}
