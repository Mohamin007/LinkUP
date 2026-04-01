'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getCurrentUser, type AuthUser } from '@/lib/auth-storage'
import { supabase } from '@/lib/supabase'

interface ProfileFormState {
  fullName: string
  city: string
}

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [formState, setFormState] = useState<ProfileFormState>({
    fullName: '',
    city: '',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusError, setStatusError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initialize = async () => {
      const user = await getCurrentUser()
      setCurrentUser(user)

      if (user) {
        setFormState({
          fullName: user.fullName,
          city: user.city,
        })
      }

      setIsLoading(false)
    }

    void initialize()
  }, [])

  const handleSaveProfile = async () => {
    if (!currentUser) {
      return
    }

    setIsSaving(true)
    setStatusMessage('')
    setStatusError('')

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formState.fullName,
        city: formState.city,
      })
      .eq('id', currentUser.id)

    if (error) {
      setStatusError(error.message)
      setIsSaving(false)
      return
    }

    const refreshedUser = await getCurrentUser()
    setCurrentUser(refreshedUser)
    setIsEditing(false)
    setStatusMessage('Profile updated successfully.')
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="p-8 text-center text-muted-foreground">Loading profile...</Card>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null
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
          <div className="flex justify-between items-start mb-6 gap-4">
            <div className="flex items-center gap-4">
              {currentUser.profilePhoto ? (
                <img
                  src={currentUser.profilePhoto}
                  alt={currentUser.fullName}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/20 text-primary flex items-center justify-center text-2xl font-bold">
                  {currentUser.fullName.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">{currentUser.fullName}</h1>
                <p className="text-muted-foreground">{currentUser.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/my-jobs">
                <Button variant="outline">My Jobs</Button>
              </Link>
              {isEditing ? (
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 bg-card rounded-lg border border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Trust Score</p>
              <p className="text-2xl font-bold text-primary">{currentUser.trustScore.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Jobs Completed</p>
              <p className="text-2xl font-bold text-primary">{currentUser.jobsCompleted}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Reviews</p>
              <p className="text-2xl font-bold text-primary">{currentUser.reviewsCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Profile Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
              <input
                value={formState.fullName}
                onChange={(event) => setFormState((prev) => ({ ...prev, fullName: event.target.value }))}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground disabled:opacity-70"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">City</label>
              <input
                value={formState.city}
                onChange={(event) => setFormState((prev) => ({ ...prev, city: event.target.value }))}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground disabled:opacity-70"
              />
            </div>
          </div>

          {statusError && <p className="text-sm text-destructive mt-4">{statusError}</p>}
          {statusMessage && <p className="text-sm text-green-600 mt-4">{statusMessage}</p>}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Activity</h2>
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 text-foreground">
              <MapPin className="h-4 w-4" />
              {currentUser.city || 'Location not set'}
            </p>
            <p className="flex items-center gap-2 text-foreground">
              <Clock className="h-4 w-4" />
              Usually responds in under 1 hour
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
