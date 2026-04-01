'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getCurrentUser, type AuthUser } from '@/lib/auth-storage'
import { supabase } from '@/lib/supabase'
import {
  fetchUserNotifications,
  markNotificationAsRead,
  type Notification,
} from '@/lib/chat-storage'

interface NotificationRealtimeRow {
  id: string
  user_id: string
  message: string
  created_at: string | null
  read: boolean
}

function formatRelativeTime(iso: string): string {
  const timestamp = new Date(iso).getTime()
  if (Number.isNaN(timestamp)) {
    return 'just now'
  }

  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000))

  if (seconds < 60) {
    return `${seconds}s ago`
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getIcon() {
  return <Bell className="w-5 h-5 text-primary" />
}

export default function NotificationsPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadNotifications = async (userId: string) => {
    const notificationsList = await fetchUserNotifications(userId)
    setNotifications(notificationsList)
    setErrorMessage('')
  }

  const markAllAsRead = async (userId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      setErrorMessage(error.message)
    }
  }

  useEffect(() => {
    const initialize = async () => {
      const user = await getCurrentUser()
      setCurrentUser(user)

      if (user) {
        await markAllAsRead(user.id)
        await loadNotifications(user.id)
      }

      setIsLoading(false)
    }

    void initialize()
  }, [])

  useEffect(() => {
    const userId = currentUser?.id
    if (!userId) {
      return
    }

    const channel = supabase
      .channel(`notifications-realtime-${userId}-page`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const next = payload.new as NotificationRealtimeRow
          setNotifications((previous) => [
            {
              id: next.id,
              userId: next.user_id,
              message: next.message,
              createdAt: next.created_at || new Date().toISOString(),
              read: !!next.read,
            },
            ...previous,
          ])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser?.id])

  const handleDismiss = (id: string) => {
    setNotifications((previous) => previous.filter((notification) => notification.id !== id))
  }

  const handleMarkAsRead = async (id: string) => {
    const result = await markNotificationAsRead(id)
    if (result.error) {
      setErrorMessage(result.error)
      return
    }

    setNotifications((previous) =>
      previous.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((notification) => !notification.read) : notifications
  const unreadCount = notifications.filter((notification) => !notification.read).length

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="p-8 text-center text-muted-foreground">Loading notifications...</Card>
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

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">Notifications</h1>
          {!currentUser ? (
            <p className="text-muted-foreground">Please log in to view notifications.</p>
          ) : (
            <p className="text-muted-foreground">
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {errorMessage && <p className="text-sm text-destructive mb-4">{errorMessage}</p>}

        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              filter === 'all'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              filter === 'unread'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-5 flex items-start gap-4 ${
                  !notification.read ? 'border-primary/50 bg-primary/5' : ''
                }`}
              >
                <div className="mt-1 flex-shrink-0">{getIcon()}</div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notification.read ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(notification.createdAt)}</p>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleMarkAsRead(notification.id)}
                        >
                          Mark read
                        </Button>
                      )}
                      <Link href="/messages">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDismiss(notification.id)}
                  className="text-muted-foreground hover:text-foreground transition flex-shrink-0"
                  aria-label="Dismiss notification"
                >
                  <X className="h-5 w-5" />
                </button>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg text-muted-foreground mb-4">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            {filter === 'unread' && (
              <Button variant="outline" onClick={() => setFilter('all')}>
                View All Notifications
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
