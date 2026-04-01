'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, MapPin, Zap, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section with Gradient */}
      <section className="relative px-4 py-20 sm:py-32 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 dark:from-primary/20 dark:via-accent/10 dark:to-secondary/15" />
        
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center space-y-8">
            <div className="space-y-4 animate-slide-in-up">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent leading-tight">
                Find Gigs Near You
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Quick jobs, flexible schedule, real income. Connect with opportunities in your neighborhood in seconds.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 animate-fade-in-scale" style={{ animationDelay: '0.2s' }}>
              <Link href="/jobs">
                <Button size="lg" className="shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-lg px-8">
                  Browse Jobs <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/post">
                <Button size="lg" variant="outline" className="border-2 hover:border-primary hover:text-primary transition-colors duration-300 text-lg px-8">
                  Post a Job
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative px-4 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { stat: '2.4K+', label: 'Active Gigs', delay: '0s' },
              { stat: '15K+', label: 'Users Nearby', delay: '0.1s' },
              { stat: '₹2.3M+', label: 'Earned by Users', delay: '0.2s' },
            ].map((item, i) => (
              <div
                key={i}
                className="text-center p-8 rounded-2xl glass border border-white/20 dark:border-white/10 hover:border-primary/50 transition-all duration-300 animate-fade-in-scale"
                style={{ animationDelay: item.delay }}
              >
                <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  {item.stat}
                </div>
                <p className="text-muted-foreground text-lg">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 sm:py-20 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Why Choose LinkUp?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: MapPin, title: 'Hyperlocal', desc: 'Find jobs within walking distance. No commute, no hassle.' },
              { icon: Zap, title: 'Instant Acceptance', desc: 'Apply to jobs in seconds and start earning within hours.' },
              { icon: Users, title: 'Trusted Community', desc: 'Verified users and transparent ratings for safe transactions.' },
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={i}
                  className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 card-hover group"
                >
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 dark:from-primary/30 dark:to-accent/30" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Ready to earn extra income?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of people earning money on their own schedule with LinkUp.
            </p>
          </div>
          <Link href="/jobs">
            <Button size="lg" className="shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-lg px-8">
              Start Earning Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
