'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Bell, Briefcase, MessageSquare, Star, Zap, X, ArrowLeft } from 'lucide-react'

const mockNotifications = [
  {
    id: '1',
    type: 'job_match',
    title: 'New Job Match!',
    description: 'A furniture moving job matching your skills just posted nearby.',
    timestamp: '2 hours ago',
    read: false,
    actionUrl: '/jobs/2',
  },
  {
    id: '2',
    type: 'message',
    title: 'New Message from Sarah M.',
    description: 'Can you confirm the time for tomorrow?',
    timestamp: '4 hours ago',
    read: false,
    actionUrl: '/messages',
  },
  {
    id: '3',
    type: 'rating',
    title: 'You Received a 5-Star Review!',
    description: 'John D. left a review: "Excellent work!"',
    timestamp: '1 day ago',
    read: true,
    actionUrl: '/profile',
  },
  {
    id: '4',
    type: 'system',
    title: 'Earnings Milestone Reached',
    description: 'You&apos;ve earned ₹2,000 on LinkUp!',
    timestamp: '2 days ago',
    read: true,
    actionUrl: '/profile',
  },
  {
    id: '5',
    type: 'job_match',
    title: 'Cleaning Job Near You',
    description: 'Quick house cleaning - ₹40-₹60, 3-4 hours',
    timestamp: '3 days ago',
    read: true,
    actionUrl: '/jobs/1',
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const getIcon = (type: string) => {
    switch (type) {
      case 'job_match':
        return <Briefcase className="w-5 h-5 text-blue-500" />
      case 'message':
        return <MessageSquare className="w-5 h-5 text-green-500" />
      case 'rating':
        return <Star className="w-5 h-5 text-yellow-500" />
      case 'system':
        return <Zap className="w-5 h-5 text-orange-500" />
      default:
        return <Bell className="w-5 h-5 text-primary" />
    }
  }

  const handleDismiss = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const handleMarkAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filter Tabs */}
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

        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-5 flex items-start gap-4 ${
                  !notification.read ? 'border-primary/50 bg-primary/5' : ''
                }`}
              >
                <div className="mt-1 flex-shrink-0">{getIcon(notification.type)}</div>

                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-foreground ${!notification.read ? 'text-primary' : ''}`}>
                    {notification.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.description}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-muted-foreground">
                      {notification.timestamp}
                    </p>
                    {notification.actionUrl && (
                      <Link href={notification.actionUrl}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    )}
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
              {filter === 'unread'
                ? 'No unread notifications'
                : 'No notifications yet'}
            </p>
            {filter === 'unread' && (
              <Button
                variant="outline"
                onClick={() => setFilter('all')}
              >
                View All Notifications
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
