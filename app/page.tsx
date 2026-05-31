'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (data.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single()

          setUserRole(userData?.role || 'user')
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">Book Your Favorite Turf</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Easy turf booking system. Find, book, and manage your turf reservations all in one place.
          </p>

          {userRole ? (
            <div className="space-x-4">
              {(userRole === 'admin' || userRole === 'turf_official') ? (
                <Link href="/admin">
                  <Button size="lg" className="mr-4">
                    Official Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/bookings">
                  <Button size="lg" className="mr-4">
                    Browse Turfs
                  </Button>
                </Link>
              )}
              <Link href={(userRole === 'admin' || userRole === 'turf_official') ? '/admin' : '/dashboard'}>
                <Button size="lg" variant="outline">
                  {(userRole === 'admin' || userRole === 'turf_official') ? 'Manage Bookings' : 'My Bookings'}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-x-4">
              <Link href="/login">
                <Button size="lg" className="mr-4">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline">
                  Create Account
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
