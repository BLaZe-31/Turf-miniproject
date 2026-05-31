'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useOfficialGuard } from '@/lib/hooks/use-official-guard'

interface Booking {
  id: string
  date: string
  time_slot: number
  duration: number
  status: string
  total_price: number
  user_id: string
  user: {
    email: string
    name: string | null
  } | null
  turf: {
    name: string
  } | null
}

export default function AdminReservationsPage() {
  const { loading, isOfficial, supabase } = useOfficialGuard()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOfficial) return

    const loadBookings = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(
            `
            id,
            date,
            time_slot,
            duration,
            status,
            total_price,
            user_id,
            user:users!bookings_user_id_fkey(email, name),
            turf:turfs!bookings_turf_id_fkey(name)
          `
          )
          .order('date', { ascending: false })

        if (error) throw error
        setBookings(data || [])
      } catch (error) {
        console.error('Error loading bookings:', error)
        toast.error('Failed to load reservations')
      }
    }

    loadBookings()
  }, [isOfficial, supabase])

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    setCancelingId(bookingId)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)

      if (error) throw error

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: 'cancelled' } : b
        )
      )
      toast.success('Booking cancelled')
      toast('Customer refunded', {
        icon: '💰',
        description: 'The refund has been processed to the original payment method.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel'
      toast.error(message)
    } finally {
      setCancelingId(null)
    }
  }

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

  if (!isOfficial) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Manage Reservations</h2>
            <p className="text-muted-foreground mt-1">
              View and cancel all turf bookings.
            </p>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Turf Management</Button>
          </Link>
        </div>

        {bookings.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">No reservations yet</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="p-6">
                <div className="flex flex-col gap-6 md:flex-row md:justify-between md:items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{booking.turf?.name ?? 'Unknown turf'}</h3>
                    <div className="mb-4 rounded-lg border bg-secondary/40 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                        Booked by
                      </p>
                      <p className="font-medium">
                        {booking.user?.name?.trim() || 'Unknown user'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.user?.email ?? booking.user_id}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">
                          {format(new Date(booking.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Time</p>
                        <p className="font-medium">
                          {String(booking.time_slot).padStart(2, '0')}:00 –{' '}
                          {String(booking.time_slot + booking.duration).padStart(2, '0')}:00
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Price</p>
                        <p className="font-medium">₹{booking.total_price}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p
                          className={`font-medium capitalize ${
                            booking.status === 'confirmed'
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }`}
                        >
                          {booking.status}
                        </p>
                        {booking.status === 'cancelled' && (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-amber-400 bg-amber-900/30 rounded-full px-2 py-0.5">
                            💰 Customer refunded
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {booking.status === 'confirmed' && (
                    <Button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancelingId === booking.id}
                      variant="destructive"
                      className="w-full md:w-auto"
                    >
                      {cancelingId === booking.id ? 'Canceling...' : 'Cancel'}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
