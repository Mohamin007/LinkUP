'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getCurrentUser, type AuthUser } from '@/lib/auth-storage'
import {
  fetchConversationMessages,
  fetchInboxConversations,
  sendConversationMessage,
  subscribeToMessages,
  type ChatMessage,
  type InboxConversation,
} from '@/lib/chat-storage'

function formatChatTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [conversations, setConversations] = useState<InboxConversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageText, setMessageText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  const selectedConversation = useMemo(() => {
    return conversations.find((conversation) => conversation.id === selectedConversationId) || null
  }, [conversations, selectedConversationId])

  const loadInbox = async (userId: string) => {
    const nextConversations = await fetchInboxConversations(userId)

    setConversations(nextConversations)
    setSelectedConversationId((previousSelectedId) => {
      if (previousSelectedId && nextConversations.some((conversation) => conversation.id === previousSelectedId)) {
        return previousSelectedId
      }

      return nextConversations[0]?.id || null
    })
  }

  useEffect(() => {
    const initialize = async () => {
      const user = await getCurrentUser()
      setCurrentUser(user)

      if (user) {
        await loadInbox(user.id)
      }

      setIsLoading(false)
    }

    void initialize()
  }, [])

  useEffect(() => {
    if (!currentUser) {
      return
    }

    const unsubscribe = subscribeToMessages(currentUser.id, () => {
      void loadInbox(currentUser.id)
    })

    return () => {
      unsubscribe()
    }
  }, [currentUser])

  useEffect(() => {
    const loadThread = async () => {
      if (!currentUser || !selectedConversation) {
        setMessages([])
        return
      }

      const nextMessages = await fetchConversationMessages(
        currentUser.id,
        selectedConversation.counterpartId,
        selectedConversation.jobId,
      )

      setMessages(nextMessages)
    }

    void loadThread()
  }, [currentUser, selectedConversation])

  const handleSendMessage = async () => {
    if (!currentUser || !selectedConversation || !messageText.trim() || isSending) {
      return
    }

    setIsSending(true)

    const result = await sendConversationMessage({
      senderId: currentUser.id,
      recipientId: selectedConversation.counterpartId,
      jobId: selectedConversation.jobId,
      content: messageText,
    })

    if (result.message) {
      setMessages((previousMessages) => [...previousMessages, result.message!])
      setMessageText('')
      await loadInbox(currentUser.id)
    }

    setIsSending(false)
  }

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4">
          <Card className="p-8 text-center text-muted-foreground">Loading conversations...</Card>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Link href="/jobs">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </Link>

        <h1 className="text-4xl font-bold text-foreground mb-8">Messages</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[650px]">
          <div className="md:col-span-1 bg-card rounded-lg border border-border overflow-y-auto">
            <div className="p-4 border-b border-border sticky top-0 bg-card">
              <h2 className="font-semibold text-foreground">Inbox</h2>
            </div>

            {conversations.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No conversations yet. Apply to a job to start chatting.
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`w-full p-4 border-b border-border hover:bg-muted transition-colors text-left ${
                    selectedConversationId === conversation.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {conversation.counterpartAvatar ? (
                      <img
                        src={conversation.counterpartAvatar}
                        alt={conversation.counterpartName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold">
                        {conversation.counterpartName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{conversation.counterpartName}</p>
                      <p className="text-xs text-muted-foreground truncate">{conversation.jobTitle}</p>
                      <p className="text-xs text-muted-foreground truncate">{conversation.lastMessage}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="md:col-span-2 flex flex-col bg-card rounded-lg border border-border">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground">
                {selectedConversation ? selectedConversation.counterpartName : 'Select a conversation'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {selectedConversation ? selectedConversation.jobTitle : 'No conversation selected'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!selectedConversation ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Select a conversation to start chatting.
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No messages in this conversation yet.
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = currentUser ? message.senderId === currentUser.id : false

                  return (
                    <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">{formatChatTime(message.createdAt)}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="border-t border-border p-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void handleSendMessage()
                    }
                  }}
                  className="flex-1"
                  disabled={!selectedConversation || isSending}
                />
                <Button
                  onClick={() => void handleSendMessage()}
                  className="bg-primary hover:bg-primary/90"
                  size="icon"
                  disabled={!selectedConversation || !messageText.trim() || isSending}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
