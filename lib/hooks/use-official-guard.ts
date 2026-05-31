'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function useOfficialGuard() {
  const [loading, setLoading] = useState(true)
  const [isOfficial, setIsOfficial] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkOfficial = async () => {
      try {
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) {
          router.push('/login')
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.user.id)
          .single()

        if (userData?.role !== 'admin' && userData?.role !== 'turf_official') {
          router.push('/bookings')
          return
        }

        setIsOfficial(true)
      } catch (error) {
        console.error('Error checking official status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkOfficial()
  }, [supabase, router])

  return { loading, isOfficial, supabase }
}
