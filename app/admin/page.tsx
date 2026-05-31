'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Turf {
  id: string
  name: string
  location: string
  price_per_hour: number
  peak_price_per_hour: number
  peak_hour_start: number
  peak_hour_end: number
  sport: string
  image_url?: string
}

interface Booking {
  id: string
  date: string
  time_slot: number
  duration: number
  status: string
  total_price: number
  user: Array<{
    email: string
    name: string
  }>
  turf: Array<{
    name: string
  }>
}

export default function AdminPage() {
  const [turfs, setTurfs] = useState<Turf[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [isOfficial, setIsOfficial] = useState(false)
  const [showAddTurf, setShowAddTurf] = useState(false)
  const [newTurf, setNewTurf] = useState({
    name: '',
    location: '',
    price_per_hour: '',
    peak_price_per_hour: '',
    peak_hour_start: '17',
    peak_hour_end: '20',
    sport: 'football',
    image_url: '',
  })
  const [addingTurf, setAddingTurf] = useState(false)
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkOfficialAndLoadData = async () => {
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
        await loadTurfs()
        await loadBookings()
      } catch (error) {
        console.error('Error checking official status:', error)
        toast.error('Failed to load admin data')
      } finally {
        setLoading(false)
      }
    }

    checkOfficialAndLoadData()
  }, [supabase, router])

  const loadTurfs = async () => {
    try {
      const { data, error } = await supabase
        .from('turfs')
        .select('*')
        .order('name')

      if (error) throw error
      setTurfs(data || [])
    } catch (error) {
      console.error('Error loading turfs:', error)
    }
  }

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
          user:users(email, name),
          turf:turfs(name)
        `
        )
        .order('date', { ascending: false })

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error loading bookings:', error)
    }
  }

  const handleAddTurf = async () => {
    if (!newTurf.name || !newTurf.location || !newTurf.price_per_hour) {
      toast.error('Please fill all fields')
      return
    }

    setAddingTurf(true)
    try {
      const response = await fetch('/api/turfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTurf.name,
          location: newTurf.location,
          pricePerHour: parseFloat(newTurf.price_per_hour),
          peakPricePerHour: newTurf.peak_price_per_hour
            ? parseFloat(newTurf.peak_price_per_hour)
            : 0,
          peakHourStart: parseInt(newTurf.peak_hour_start) || 17,
          peakHourEnd: parseInt(newTurf.peak_hour_end) || 20,
          sport: newTurf.sport,
          imageUrl: newTurf.image_url,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add turf')
      }

      toast.success('Turf added successfully')
      setNewTurf({
        name: '',
        location: '',
        price_per_hour: '',
        peak_price_per_hour: '',
        peak_hour_start: '17',
        peak_hour_end: '20',
        sport: 'football',
        image_url: '',
      })
      setShowAddTurf(false)
      await loadTurfs()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add turf'
      console.error('[v0] Turf creation error:', message)
      toast.error(message)
    } finally {
      setAddingTurf(false)
    }
  }

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
      toast('Customer refunded', { icon: '💰', description: 'The refund has been processed to the original payment method.' })
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
        <div className="mb-12">
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold">Turf Official Dashboard</h2>
              <p className="text-muted-foreground mt-1">
                Add turfs, set pricing, and review booking requests.
              </p>
            </div>
            <Button onClick={() => setShowAddTurf(!showAddTurf)}>
              {showAddTurf ? 'Cancel' : 'Add Turf'}
            </Button>
          </div>

          {showAddTurf && (
            <Card className="p-6 mb-6">
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Turf Name</label>
                  <Input
                    placeholder="e.g., Green Field Turf"
                    value={newTurf.name}
                    onChange={(e) =>
                      setNewTurf({ ...newTurf, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <Input
                    placeholder="e.g., Downtown, City Center"
                    value={newTurf.location}
                    onChange={(e) =>
                      setNewTurf({ ...newTurf, location: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Base Price per Hour (₹)</label>
                    <Input
                      type="number"
                      placeholder="500"
                      value={newTurf.price_per_hour}
                      onChange={(e) =>
                        setNewTurf({ ...newTurf, price_per_hour: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Peak Price per Hour (₹)</label>
                    <Input
                      type="number"
                      placeholder="650"
                      value={newTurf.peak_price_per_hour}
                      onChange={(e) =>
                        setNewTurf({ ...newTurf, peak_price_per_hour: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Peak Hour Start</label>
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      value={newTurf.peak_hour_start}
                      onChange={(e) => setNewTurf({ ...newTurf, peak_hour_start: e.target.value })}
                    >
                      {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, '0')}:00 ({h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Peak Hour End</label>
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      value={newTurf.peak_hour_end}
                      onChange={(e) => setNewTurf({ ...newTurf, peak_hour_end: e.target.value })}
                    >
                      {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, '0')}:00 ({h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Sport</label>
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      value={newTurf.sport}
                      onChange={(e) => setNewTurf({ ...newTurf, sport: e.target.value })}
                    >
                      <option value="football">Football</option>
                      <option value="cricket">Cricket</option>
                      <option value="basketball">Basketball</option>
                      <option value="badminton">Badminton</option>
                      <option value="tennis">Tennis</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Image URL</label>
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={newTurf.image_url}
                      onChange={(e) =>
                        setNewTurf({ ...newTurf, image_url: e.target.value })
                      }
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddTurf}
                  disabled={addingTurf}
                  className="w-full"
                >
                  {addingTurf ? 'Adding...' : 'Add Turf'}
                </Button>
              </div>
            </Card>
          )}

          <div className="grid gap-4">
            {turfs.map((turf) => (
              <Card key={turf.id} className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
                  <div>
                    <h3 className="text-xl font-semibold">{turf.name}</h3>
                    <p className="text-muted-foreground mb-2">{turf.location}</p>
                    <p className="text-sm text-muted-foreground capitalize mb-1">Sport: {turf.sport}</p>
                    <p className="font-medium">
                      ₹{turf.price_per_hour}/hr
                      {turf.peak_price_per_hour > 0 && (
                        <span className="text-sm text-muted-foreground ml-3">
                          Peak: ₹{turf.peak_price_per_hour}/hr ({String(turf.peak_hour_start).padStart(2, '0')}:00 – {String(turf.peak_hour_end).padStart(2, '0')}:00)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="w-full md:w-48 h-32 overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={
                        turf.image_url ||
                        `https://source.unsplash.com/400x300/?${encodeURIComponent(turf.sport)}+turf`
                      }
                      alt={turf.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-6">All Bookings</h2>

          {bookings.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground text-lg">No bookings yet</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="p-6">
                  <div className="flex flex-col gap-6 md:flex-row md:justify-between md:items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{booking.turf[0]?.name}</h3>
                      <p className="text-muted-foreground mb-4">
                        Booked by: {booking.user[0]?.name} ({booking.user[0]?.email})
                      </p>
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
                            {String(booking.time_slot).padStart(2, '0')}:00 -{' '}
                            {String(booking.time_slot + booking.duration).padStart(2, '0')}:00
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Price</p>
                          <p className="font-medium">₹{booking.total_price}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <p className={`font-medium capitalize ${
                            booking.status === 'confirmed' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {booking.status}
                          </p>
                          {booking.status === 'cancelled' && (
                            <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
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
        </div>
      </main>
    </div>
  )
}
