'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { loginUser } from '@/lib/auth-storage'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const result = await loginUser({ email, password })

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    router.push('/jobs')
  }

  return (
    <div className="bg-background min-h-screen py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Log In</h1>
          <p className="text-muted-foreground mb-6">
            Log in to continue to your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Logging In...' : 'Log In'}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            New here?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
