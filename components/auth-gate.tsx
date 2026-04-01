'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getCurrentUser, onAuthStateChange } from '@/lib/auth-storage'

const PUBLIC_ROUTES = new Set(['/', '/login', '/signup'])

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) {
    return true
  }

  if (pathname === '/jobs' || pathname.startsWith('/jobs/')) {
    return true
  }

  return false
}

interface AuthGateProps {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    let isActive = true

    const checkAccess = async () => {
      const currentPath = pathname || '/'
      const isPublicRoute = isPublicPath(currentPath)
      const currentUser = await getCurrentUser()

      if (!isActive) {
        return
      }

      if (!currentUser && !isPublicRoute) {
        router.replace(`/signup?redirect=${encodeURIComponent(currentPath)}`)
        setIsAllowed(false)
        setIsReady(true)
        return
      }

      if (currentUser && (currentPath === '/login' || currentPath === '/signup')) {
        router.replace('/jobs')
        setIsAllowed(false)
        setIsReady(true)
        return
      }

      setIsAllowed(true)
      setIsReady(true)
    }

    checkAccess()

    const unsubscribe = onAuthStateChange(() => {
      checkAccess()
    })

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [pathname, router])

  if (!isReady || !isAllowed) {
    return null
  }

  return <>{children}</>
}
