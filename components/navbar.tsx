'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, Moon, Sun, Palette, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  getCurrentUser,
  logoutUser,
  onAuthStateChange,
  type AuthUser,
} from '@/lib/auth-storage'

interface NavItem {
  label: string
  href: string
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [colorTheme, setColorTheme] = useState('blue')
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const { theme, setTheme } = useTheme()

  const toggleMenu = () => setIsOpen(!isOpen)

  useEffect(() => {
    let isActive = true

    const syncCurrentUser = async () => {
      const user = await getCurrentUser()
      if (!isActive) {
        return
      }

      setCurrentUser(user)
    }

    const savedTheme = localStorage.getItem('linkup-color-theme') || 'blue'
    document.documentElement.setAttribute('data-theme', savedTheme)
    setColorTheme(savedTheme)
    void syncCurrentUser()

    const handleFocus = () => {
      void syncCurrentUser()
    }

    const unsubscribe = onAuthStateChange(() => {
      void syncCurrentUser()
    })

    window.addEventListener('focus', handleFocus)

    setMounted(true)

    return () => {
      isActive = false
      unsubscribe()
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  useEffect(() => {
    const handleOutsideClick = () => setShowThemeMenu(false)
    if (showThemeMenu) {
      window.addEventListener('click', handleOutsideClick)
    }

    return () => window.removeEventListener('click', handleOutsideClick)
  }, [showThemeMenu])

  const themes = [
    { name: 'blue', label: 'Premium Blue' },
    { name: 'cosmic', label: 'Cosmic' },
    { name: 'sakura', label: 'Sakura' },
    { name: 'galaxy', label: 'Galaxy' },
  ]

  const navigationItems: NavItem[] = currentUser
    ? [
        { label: 'Browse Jobs', href: '/jobs' },
        { label: 'Post Job', href: '/post' },
        { label: 'My Jobs', href: '/my-jobs' },
        { label: 'Messages', href: '/messages' },
        { label: 'Notifications', href: '/notifications' },
        { label: 'Profile', href: '/profile' },
      ]
    : [
        { label: 'Browse Jobs', href: '/jobs' },
      ]

  const handleLogout = async () => {
    await logoutUser()
    setCurrentUser(null)
    setIsOpen(false)
    window.location.assign('/')
  }

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/10 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-primary-foreground font-bold text-lg">
              L
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:inline">LinkUp</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 text-foreground hover:text-primary transition-colors duration-300 rounded-lg hover:bg-white/5 dark:hover:bg-white/5"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Selector */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowThemeMenu(!showThemeMenu)
                }}
                className="p-2.5 hover:bg-white/10 dark:hover:bg-white/10 rounded-lg transition-colors duration-300"
                aria-label="Select theme"
                title="Theme selector"
              >
                <Palette className="h-5 w-5 text-foreground" />
              </button>
              
              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-48 glass-strong rounded-lg p-2 shadow-2xl space-y-1">
                  {themes.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => {
                        document.documentElement.setAttribute('data-theme', t.name)
                        localStorage.setItem('linkup-color-theme', t.name)
                        setColorTheme(t.name)
                        setShowThemeMenu(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white/20 transition-colors ${
                        colorTheme === t.name ? 'bg-white/20' : ''
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 hover:bg-white/10 dark:hover:bg-white/10 rounded-lg transition-colors duration-300"
              aria-label="Toggle theme"
              suppressHydrationWarning
            >
              {mounted && theme === 'dark' ? (
                <Sun className="h-5 w-5 text-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-foreground" />
              )}
            </button>

            {currentUser ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="hidden md:inline-flex"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2.5 hover:bg-white/10 dark:hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="h-6 w-6 text-foreground" />
              ) : (
                <Menu className="h-6 w-6 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-1 animate-slide-in-up">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2.5 text-foreground hover:text-primary hover:bg-white/5 dark:hover:bg-white/5 rounded-lg transition-colors duration-300"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className="pt-2 flex flex-col gap-2">
              {currentUser ? (
                <Button variant="outline" onClick={handleLogout} className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full">Login</Button>
                  </Link>
                  <Link href="/signup" onClick={() => setIsOpen(false)}>
                    <Button className="w-full">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
