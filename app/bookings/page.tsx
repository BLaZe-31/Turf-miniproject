'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { format, isBefore, startOfDay } from 'date-fns'
import { toast } from 'sonner'

interface Turf {
  id: string
  name: string
  location: string
  price_per_hour: number
  peak_price_per_hour: number
  image_url?: string
  sport: string
}

interface TimeSlot {
  hour: number
  available: boolean
}

const sports = ['all', 'football', 'cricket', 'basketball', 'badminton', 'tennis']

const defaultTurfImage = (sport: string) =>
  `https://source.unsplash.com/480x320/?${encodeURIComponent(sport)}+turf`

export default function BookingsPage() {
  const [turfs, setTurfs] = useState<Turf[]>([])
  const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [bookedHours, setBookedHours] = useState<number[]>([])
  const [selectedTime, setSelectedTime] = useState<number | null>(null)
  const [selectedDuration, setSelectedDuration] = useState(1)
  const [sportFilter, setSportFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const slots: TimeSlot[] = []
    for (let i = 6; i <= 22; i++) {
      slots.push({ hour: i, available: true })
    }
    setTimeSlots(slots)
  }, [])

  useEffect(() => {
    const loadTurfs = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!data.user) {
          router.push('/login')
          return
        }

        const { data: turfsData, error } = await supabase
          .from('turfs')
          .select('*')
          .order('name')

        if (error) throw error

        setTurfs(turfsData || [])
        if (turfsData && turfsData.length > 0) {
          setSelectedTurf(turfsData[0])
        }
      } catch (error) {
        console.error('Error loading turfs:', error)
        toast.error('Failed to load turfs')
      } finally {
        setLoading(false)
      }
    }

    loadTurfs()
  }, [supabase, router])

  useEffect(() => {
    const checkAvailability = async () => {
      if (!selectedTurf) return

      try {
        const { data } = await supabase
          .from('bookings')
          .select('time_slot,duration')
          .eq('turf_id', selectedTurf.id)
          .eq('date', format(selectedDate, 'yyyy-MM-dd'))
          .eq('status', 'confirmed')

        const occupied: number[] = []
        ;(data || []).forEach((booking) => {
          const bookingDuration = booking.duration || 1
          for (let hour = booking.time_slot; hour < booking.time_slot + bookingDuration; hour++) {
            occupied.push(hour)
          }
        })

        setBookedHours(occupied)
        setTimeSlots((prev) =>
          prev.map((slot) => ({
            ...slot,
            available: !occupied.includes(slot.hour),
          }))
        )
      } catch (error) {
        console.error('Error checking availability:', error)
      }
    }

    checkAvailability()
  }, [selectedTurf, selectedDate, supabase])

  const filteredTurfs = useMemo(() => {
    return turfs.filter((turf) => {
      const matchesSport = sportFilter === 'all' || turf.sport === sportFilter
      const matchesSearch =
        turf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        turf.location.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSport && matchesSearch
    })
  }, [turfs, searchQuery, sportFilter])

  const getRate = (hour: number) => {
    if (selectedTurf?.peak_price_per_hour && hour >= 18) {
      return selectedTurf.peak_price_per_hour
    }
    return selectedTurf?.price_per_hour ?? 0
  }

  const totalPrice = useMemo(() => {
    if (!selectedTurf || selectedTime === null) return 0
    let total = 0
    for (let hour = selectedTime; hour < selectedTime + selectedDuration; hour++) {
      total += getRate(hour)
    }
    return total
  }, [selectedTurf, selectedTime, selectedDuration])

  const isRangeAvailable = (startHour: number) => {
    if (startHour + selectedDuration > 23) return false
    for (let hour = startHour; hour < startHour + selectedDuration; hour++) {
      if (bookedHours.includes(hour)) return false
    }
    return true
  }

  const simulatePayment = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, 1100)
    })
  }

  const handleBooking = async () => {
    if (!selectedTurf || selectedTime === null) {
      toast.error('Please select a turf and time slot')
      return
    }

    if (!isRangeAvailable(selectedTime)) {
      toast.error('Selected range is not available for booking')
      return
    }

    setBookingLoading(true)
    try {
      toast('Processing payment...', { icon: '💳' })
      await simulatePayment()

      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('User not found')

      const { error } = await supabase.from('bookings').insert([
        {
          user_id: user.user.id,
          turf_id: selectedTurf.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time_slot: selectedTime,
          duration: selectedDuration,
          status: 'confirmed',
          total_price: totalPrice,
        },
      ])

      if (error) throw error

      toast.success('Payment successful and booking confirmed!')
      setSelectedTime(null)
      setSelectedDuration(1)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Booking failed'
      toast.error(message)
    } finally {
      setBookingLoading(false)
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Book a Turf</h1>
            <p className="text-muted-foreground mt-2">
              Choose your turf, sport, and booking duration for a smoother experience.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:w-auto">
            <Input
              placeholder="Search by name or location"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              {sports.map((sport) => (
                <option key={sport} value={sport}>
                  {sport === 'all' ? 'All sports' : sport.charAt(0).toUpperCase() + sport.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold">Available Turfs</h2>
            {filteredTurfs.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">No turfs match your filters.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredTurfs.map((turf) => (
                  <Card
                    key={turf.id}
                    className={`overflow-hidden p-0 border transition-all ${
                      selectedTurf?.id === turf.id
                        ? 'border-primary bg-primary/10'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTurf(turf)}
                  >
                    <div className="relative h-40 w-full">
                      <img
                        src={turf.image_url || defaultTurfImage(turf.sport)}
                        alt={turf.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg">{turf.name}</h3>
                      <p className="text-sm text-muted-foreground">{turf.location}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        Sport: {turf.sport}
                      </p>
                      <p className="mt-2 font-medium">
                        ₹{turf.price_per_hour}/hr
                        {turf.peak_price_per_hour > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            peak ₹{turf.peak_price_per_hour}/hr
                          </span>
                        )}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Choose Date</h2>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => isBefore(date, startOfDay(new Date()))}
                />
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Select Time & Duration</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Duration</label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4].map((hours) => (
                      <option key={hours} value={hours}>
                        {hours} {hours === 1 ? 'hour' : 'hours'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[28rem] overflow-y-auto">
                  {timeSlots.map((slot) => {
                    const available = slot.available && isRangeAvailable(slot.hour)
                    return (
                      <Button
                        key={slot.hour}
                        onClick={() => available && setSelectedTime(slot.hour)}
                        disabled={!available}
                        variant={
                          selectedTime === slot.hour
                            ? 'default'
                            : available
                            ? 'outline'
                            : 'ghost'
                        }
                        className="w-full"
                      >
                        {String(slot.hour).padStart(2, '0')}:00
                      </Button>
                    )
                  })}
                </div>
              </Card>

              <Card className="p-6 bg-primary/5">
                <h2 className="text-lg font-semibold mb-4">Payment Preview</h2>
                <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground mb-3">
                    Fake payment gateway for demo bookings.
                  </p>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Selected Turf</p>
                      <p className="font-medium">{selectedTurf?.name || 'None'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">{format(selectedDate, 'MMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Time Range</p>
                      <p className="font-medium">
                        {selectedTime !== null
                          ? `${String(selectedTime).padStart(2, '0')}:00 - ${String(
                              selectedTime + selectedDuration
                            ).padStart(2, '0')}:00`
                          : 'No time selected'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Price</p>
                      <p className="text-2xl font-semibold">₹{totalPrice}</p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleBooking}
                  disabled={bookingLoading || !selectedTurf || selectedTime === null}
                  className="mt-6 w-full"
                >
                  {bookingLoading ? 'Processing...' : `Pay ₹${totalPrice}`}
                </Button>
              </Card>
            </div>

            {selectedTurf && selectedTime !== null && (
              <Card className="mt-8 p-6">
                <h2 className="text-lg font-semibold mb-4">Booking Details</h2>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <p>
                    Booking a {selectedDuration}-hour block starting at{' '}
                    <span className="font-medium text-foreground">
                      {String(selectedTime).padStart(2, '0')}:00
                    </span>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Array.from({ length: selectedDuration }, (_, index) => {
                      const hour = selectedTime + index
                      return (
                        <div key={hour} className="rounded-lg border p-3">
                          <p className="text-muted-foreground">
                            {String(hour).padStart(2, '0')}:00 - {String(hour + 1).padStart(2, '0')}:00
                          </p>
                          <p className="font-medium">₹{getRate(hour)}</p>
                        </div>
                      )
                    })}
                  </div>
                  {!isRangeAvailable(selectedTime) && (
                    <p className="text-sm text-destructive">
                      Selected duration overlaps with an existing booking.
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
