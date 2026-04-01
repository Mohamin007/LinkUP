import { supabase } from '@/lib/supabase'

export interface ChatMessage {
  id: string
  jobId: string | null
  senderId: string
  recipientId: string
  content: string
  createdAt: string
}

export interface InboxConversation {
  id: string
  counterpartId: string
  counterpartName: string
  counterpartAvatar: string
  jobId: string | null
  jobTitle: string
  lastMessage: string
  lastMessageAt: string
}

export interface SendMessageInput {
  senderId: string
  recipientId: string
  jobId: string | null
  content: string
}

export interface ApplicationConversationInput {
  jobId: string
  applicantId: string
  applicantName: string
  ownerId: string
  ownerName: string
  jobTitle: string
}

interface MessageRow {
  id: string
  job_id: string | null
  sender_id: string
  recipient_id: string
  content: string
  created_at: string | null
}

interface ProfileRow {
  id: string
  full_name: string | null
}

interface JobTitleRow {
  id: string
  title: string
}

function mapMessageRow(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    jobId: row.job_id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    content: row.content,
    createdAt: row.created_at || new Date().toISOString(),
  }
}

function makeConversationKey(userA: string, userB: string, jobId: string | null): string {
  const sorted = [userA, userB].sort()
  return `${sorted[0]}:${sorted[1]}:${jobId || 'general'}`
}

async function fetchProfiles(profileIds: string[]): Promise<Map<string, ProfileRow>> {
  const uniqueIds = Array.from(new Set(profileIds.filter(Boolean)))
  if (uniqueIds.length === 0) {
    return new Map()
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', uniqueIds)

  if (error || !data) {
    return new Map()
  }

  return new Map((data as ProfileRow[]).map((profile) => [profile.id, profile]))
}

async function fetchJobTitles(jobIds: string[]): Promise<Map<string, string>> {
  const uniqueJobIds = Array.from(new Set(jobIds.filter(Boolean)))
  if (uniqueJobIds.length === 0) {
    return new Map()
  }

  const { data, error } = await supabase
    .from('jobs')
    .select('id, title')
    .in('id', uniqueJobIds)

  if (error || !data) {
    return new Map()
  }

  return new Map((data as JobTitleRow[]).map((job) => [job.id, job.title]))
}

export async function fetchInboxConversations(userId: string): Promise<InboxConversation[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, job_id, sender_id, recipient_id, content, created_at')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }

  const rows = data as MessageRow[]
  if (rows.length === 0) {
    return []
  }

  const conversationsById = new Map<string, MessageRow>()

  rows.forEach((row) => {
    const counterpartId = row.sender_id === userId ? row.recipient_id : row.sender_id
    const conversationId = makeConversationKey(userId, counterpartId, row.job_id)

    if (!conversationsById.has(conversationId)) {
      conversationsById.set(conversationId, row)
    }
  })

  const latestRows = Array.from(conversationsById.entries()).map(([conversationId, row]) => ({
    conversationId,
    row,
    counterpartId: row.sender_id === userId ? row.recipient_id : row.sender_id,
  }))

  const profileById = await fetchProfiles(latestRows.map((entry) => entry.counterpartId))
  const jobTitleById = await fetchJobTitles(
    latestRows.map((entry) => entry.row.job_id).filter((jobId): jobId is string => !!jobId),
  )

  return latestRows
    .map((entry) => {
      const counterpart = profileById.get(entry.counterpartId)

      return {
        id: entry.conversationId,
        counterpartId: entry.counterpartId,
        counterpartName: counterpart?.full_name || 'Unknown user',
        counterpartAvatar: '',
        jobId: entry.row.job_id,
        jobTitle: entry.row.job_id ? jobTitleById.get(entry.row.job_id) || 'Job conversation' : 'Direct chat',
        lastMessage: entry.row.content,
        lastMessageAt: entry.row.created_at || new Date().toISOString(),
      }
    })
    .sort((a, b) => (a.lastMessageAt > b.lastMessageAt ? -1 : 1))
}

export async function fetchConversationMessages(
  currentUserId: string,
  counterpartId: string,
  jobId: string | null,
): Promise<ChatMessage[]> {
  let query = supabase
    .from('messages')
    .select('id, job_id, sender_id, recipient_id, content, created_at')
    .or(
      `and(sender_id.eq.${currentUserId},recipient_id.eq.${counterpartId}),and(sender_id.eq.${counterpartId},recipient_id.eq.${currentUserId})`,
    )
    .order('created_at', { ascending: true })

  if (jobId) {
    query = query.eq('job_id', jobId)
  } else {
    query = query.is('job_id', null)
  }

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  return (data as MessageRow[]).map((row) => mapMessageRow(row))
}

export async function sendConversationMessage(input: SendMessageInput): Promise<{ message?: ChatMessage; error?: string }> {
  const trimmedContent = input.content.trim()

  if (!trimmedContent) {
    return { error: 'Message cannot be empty.' }
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: input.senderId,
      recipient_id: input.recipientId,
      job_id: input.jobId,
      content: trimmedContent,
    })
    .select('id, job_id, sender_id, recipient_id, content, created_at')
    .maybeSingle()

  if (error || !data) {
    return { error: error?.message || 'Could not send message.' }
  }

  return {
    message: mapMessageRow(data as MessageRow),
  }
}

export function subscribeToMessages(userId: string, onChange: () => void): () => void {
  const channelName = `messages-realtime-${userId}-${Math.random().toString(36).slice(2)}`
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
      const nextRecord = payload.new as { sender_id?: string; recipient_id?: string }
      const oldRecord = payload.old as { sender_id?: string; recipient_id?: string }

      const isRelevant =
        nextRecord?.sender_id === userId ||
        nextRecord?.recipient_id === userId ||
        oldRecord?.sender_id === userId ||
        oldRecord?.recipient_id === userId

      if (isRelevant) {
        onChange()
      }
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function ensureApplicationConversation(
  input: ApplicationConversationInput,
): Promise<{ error?: string }> {
  const { data: existingMessages, error: checkError } = await supabase
    .from('messages')
    .select('id')
    .eq('job_id', input.jobId)
    .or(
      `and(sender_id.eq.${input.applicantId},recipient_id.eq.${input.ownerId}),and(sender_id.eq.${input.ownerId},recipient_id.eq.${input.applicantId})`,
    )
    .limit(1)

  if (checkError) {
    return { error: checkError.message }
  }

  if (existingMessages && existingMessages.length > 0) {
    return {}
  }

  const messageContent = 'Hi! I saw your job post and I am interested. Please let me know if you are available.'

  const { error: insertError } = await supabase
    .from('messages')
    .insert({
      job_id: input.jobId,
      sender_id: input.applicantId,
      recipient_id: input.ownerId,
      content: messageContent,
    })

  if (insertError) {
    return { error: insertError.message }
  }

  return {}
}

export interface ApplicationNotificationInput {
  jobId: string
  jobTitle: string
  applicantId: string
  applicantName: string
  ownerId: string
}

export interface Notification {
  id: string
  userId: string
  message: string
  createdAt: string
  read: boolean
}

interface NotificationRow {
  id: string
  user_id: string
  message: string
  created_at: string | null
  read: boolean
}

export async function createApplicationNotification(input: ApplicationNotificationInput): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: input.ownerId,
      message: `${input.applicantName} is interested in your job: ${input.jobTitle}`,
      read: false,
    })

  if (error) {
    return { error: error.message }
  }

  return {}
}

export async function fetchUserNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, message, created_at, read')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return (data as NotificationRow[]).map((row) => ({
    id: row.id,
    userId: row.user_id,
    message: row.message,
    createdAt: row.created_at || new Date().toISOString(),
    read: row.read,
  }))
}

export async function markNotificationAsRead(notificationId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)

  if (error) {
    return { error: error.message }
  }

  return {}
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) {
    return 0
  }

  return count || 0
}

export function subscribeToNotifications(userId: string, onChange: () => void): () => void {
  const channelName = `notifications-realtime-${userId}-${Math.random().toString(36).slice(2)}`
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const nextRecord = payload.new as { user_id?: string }

        if (nextRecord?.user_id === userId || payload.eventType === 'DELETE') {
          onChange()
        }
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
