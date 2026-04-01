import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface UserProfile {
  id: string
  fullName: string
  phone: string
  city: string
  profilePhoto: string
  trustScore: number
  jobsCompleted: number
  reviewsCount: number
}

export interface AuthUser extends UserProfile {
  email: string
  createdAt: string
}

export interface SignupInput {
  fullName: string
  city: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResult {
  user?: AuthUser
  error?: string
}

interface ProfileRow {
  id: string
  full_name: string | null
  city: string | null
}

interface ProfileSeedInput {
  fullName?: string
  city?: string
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function toUserProfile(row: ProfileRow, user: User): UserProfile {
  const metadata = user.user_metadata || {}

  return {
    id: row.id,
    fullName: row.full_name || metadata.full_name || metadata.name || 'LinkUp User',
    phone: metadata.phone || '',
    city: row.city || metadata.city || '',
    profilePhoto: metadata.profile_photo || metadata.avatar_url || '',
    trustScore: 0,
    jobsCompleted: 0,
    reviewsCount: 0,
  }
}

async function fetchProfileById(
  userId: string,
): Promise<{ profile: ProfileRow | null; error?: string }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, city')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return { profile: null, error: error.message }
  }

  if (!data) {
    return { profile: null }
  }

  return { profile: data as ProfileRow }
}

async function ensureProfileRow(
  user: User,
  input?: ProfileSeedInput,
): Promise<{ profile: ProfileRow | null; error?: string }> {
  const existingProfileResult = await fetchProfileById(user.id)
  if (existingProfileResult.error) {
    return { profile: null, error: existingProfileResult.error }
  }

  if (existingProfileResult.profile) {
    return { profile: existingProfileResult.profile }
  }

  const metadata = user.user_metadata || {}
  const payload = {
    id: user.id,
    full_name: input?.fullName || metadata.full_name || metadata.name || 'LinkUp User',
    city: input?.city || '',
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('id, full_name, city')
    .maybeSingle()

  if (error) {
    return { profile: null, error: error.message }
  }

  if (!data) {
    return { profile: null, error: 'Failed to create profile row.' }
  }

  return { profile: data as ProfileRow }
}

function toAuthUser(user: User, profile: UserProfile): AuthUser {
  return {
    ...profile,
    email: user.email || '',
    createdAt: user.created_at,
  }
}

export async function signupUser(input: SignupInput): Promise<AuthResult> {
  const fullName = input.fullName.trim()
  const city = input.city.trim()
  const email = normalizeEmail(input.email)
  const password = input.password

  if (!fullName || !city || !email || !password) {
    return { error: 'Please fill in all required fields.' }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        city,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    const profileResult = await ensureProfileRow(data.user, {
      fullName,
      city,
    })
    if (profileResult.error) {
      return { error: `Account created, but profile setup failed: ${profileResult.error}` }
    }
  }

  let currentUser = await getCurrentUser()
  if (!currentUser) {
    const loginResult = await loginUser({ email, password })
    if (loginResult.error || !loginResult.user) {
      return {
        error: loginResult.error || 'Sign up succeeded but automatic login failed. Please log in.',
      }
    }

    currentUser = loginResult.user
  }

  return {
    user: currentUser,
  }
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const email = normalizeEmail(input.email)
  const password = input.password

  if (!email || !password) {
    return { error: 'Please enter both email and password.' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return {
      error: userError?.message || 'Login succeeded but we could not read your account details.',
    }
  }

  const user = userData.user
  const profileResult = await ensureProfileRow(user, {
    fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
    city: '',
  })

  if (profileResult.error || !profileResult.profile) {
    return {
      error: profileResult.error || 'Login succeeded but we could not load or create your profile.',
    }
  }

  const profile = toUserProfile(profileResult.profile, user)
  return { user: toAuthUser(user, profile) }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return null
  }

  const user = data.user
  const profileResult = await ensureProfileRow(user)
  const profileRow = profileResult.profile

  if (!profileRow || profileResult.error) {
    return null
  }

  return toAuthUser(user, toUserProfile(profileRow, user))
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    return null
  }

  return data.session
}

export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut()
}

export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })

  return () => {
    subscription.unsubscribe()
  }
}
