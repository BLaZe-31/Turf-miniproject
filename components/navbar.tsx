'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  role: 'user' | 'admin' | 'turf_official'
}

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (data.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, role')
            .eq('id', data.user.id)
            .single()

          if (userData) {
            setUser(userData as User)
          }
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [supabase])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      toast.success('Logged out successfully')
      router.push('/login')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  return (
    <nav className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">PA</span>
            </div>
            <span className="font-bold text-lg hidden sm:inline">PrimeArena</span>
          </Link>

          <div className="flex items-center space-x-4">
            {!loading && user ? (
              <>
                <div className="text-sm">
                  <p className="font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role.replace('_', ' ')}</p>
                </div>
                {(user.role === 'admin' || user.role === 'turf_official') ? (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">
                      Official Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm">
                      My Bookings
                    </Button>
                  </Link>
                )}
                <Button onClick={handleLogout} variant="ghost" size="sm">
                  Logout
                </Button>
              </>
            ) : loading ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
