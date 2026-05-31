'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import { format, isBefore, startOfDay } from 'date-fns'
import { toast } from 'sonner'
import { getPrimaryTurfImage, getTurfImages } from '@/lib/turf-images'
import { cn } from '@/lib/utils'

interface Turf {
  id: string
  name: string
  location: string
  price_per_hour: number
  peak_price_per_hour: number
  peak_hour_start: number
  peak_hour_end: number
  image_url?: string
  image_urls?: string[]
  sport: string
  max_players: number
}

interface TimeSlot {
  hour: number
  available: boolean
}

const sports = ['all', 'football', 'cricket', 'basketball', 'badminton', 'tennis']

const defaultTurfImage = (sport: string) =>
  `https://source.unsplash.com/480x320/?${encodeURIComponent(sport)}+turf`

function TurfImageSlider({ images, name }: { images: string[]; name: string }) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!api) return

    const onSelect = () => setCurrent(api.selectedScrollSnap())
    onSelect()
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  if (images.length <= 1) {
    return (
      <div className="aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[320px]">
        <img
          src={images[0]}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  return (
    <Carousel setApi={setApi} className="w-full" opts={{ loop: true }}>
      <CarouselContent className="ml-0">
        {images.map((url, index) => (
          <CarouselItem key={`${url}-${index}`} className="pl-0">
            <div className="aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[320px]">
              <img
                src={url}
                alt={`${name} — photo ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-3 top-1/2 -translate-y-1/2 size-9 border-0 bg-black/50 text-white hover:bg-black/70 hover:text-white disabled:opacity-30" />
      <CarouselNext className="right-3 top-1/2 -translate-y-1/2 size-9 border-0 bg-black/50 text-white hover:bg-black/70 hover:text-white disabled:opacity-30" />
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
        {images.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Go to photo ${index + 1}`}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              'h-2 rounded-full transition-all',
              current === index ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
            )}
          />
        ))}
      </div>
      <span className="absolute top-3 right-3 z-10 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-medium text-white">
        {current + 1} / {images.length}
      </span>
    </Carousel>
  )
}

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

  const handleSelectTurf = (turf: Turf) => {
    setSelectedTurf(turf)
    setSelectedTime(null)
  }

  const selectedTurfImages = useMemo(() => {
    if (!selectedTurf) return []
    const images = getTurfImages(selectedTurf)
    return images.length > 0 ? images : [defaultTurfImage(selectedTurf.sport)]
  }, [selectedTurf])

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
    if (selectedTurf?.peak_price_per_hour && hour >= (selectedTurf.peak_hour_start ?? 17) && hour < (selectedTurf.peak_hour_end ?? 20)) {
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ===== FILTER SECTION — top 30% ===== */}
        <section className="rounded-2xl border bg-card p-6 mb-6">
          <div className="flex flex-col gap-5">
            {/* Header row */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold">Book a Turf</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Choose your turf, sport, and booking duration for a smoother experience.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Input
                  placeholder="Search by name or location"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-56"
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

            {/* Calendar + Time + Duration + Payment in a row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Date picker */}
              <div>
                <h2 className="text-sm font-semibold mb-2">Choose Date</h2>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => isBefore(date, startOfDay(new Date()))}
                />
              </div>

              {/* Time + Duration */}
              <div>
                <h2 className="text-sm font-semibold mb-2">Select Time & Duration</h2>
                <div className="mb-3">
                  <select
                    className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
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
                <div className="grid grid-cols-4 gap-1.5">
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
                        className="w-full text-xs h-7 px-1"
                        size="sm"
                      >
                        {String(slot.hour).padStart(2, '0')}:00
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Payment Preview */}
              <div>
                <h2 className="text-sm font-semibold mb-2">Payment Preview</h2>
                <div className="rounded-xl border border-border bg-secondary p-3 text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Turf</span>
                    <span className="font-medium truncate ml-2">{selectedTurf?.name || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{format(selectedDate, 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">
                      {selectedTime !== null
                        ? `${String(selectedTime).padStart(2, '0')}:00 - ${String(
                            selectedTime + selectedDuration
                          ).padStart(2, '0')}:00`
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1 border-t">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-xl font-semibold">₹{totalPrice}</span>
                  </div>
                </div>
                <Button
                  onClick={handleBooking}
                  disabled={bookingLoading || !selectedTurf || selectedTime === null}
                  className="mt-2 w-full"
                  size="sm"
                >
                  {bookingLoading ? 'Processing...' : `Pay ₹${totalPrice}`}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ===== TURF SELECTION ===== */}
        <section className="flex-1">
          {selectedTurf && (
            <Card className="mb-6 overflow-hidden border-primary/40 shadow-md">
              <div className="grid grid-cols-1 lg:grid-cols-5">
                <div className="lg:col-span-3 relative bg-secondary">
                  <TurfImageSlider
                    key={selectedTurf.id}
                    images={selectedTurfImages}
                    name={selectedTurf.name}
                  />
                </div>

                <div className="lg:col-span-2 p-6 lg:p-8 flex flex-col justify-center">
                  <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium capitalize text-primary mb-3">
                    {selectedTurf.sport}
                  </span>
                  <h2 className="text-2xl lg:text-3xl font-bold mb-2">{selectedTurf.name}</h2>
                  <p className="text-muted-foreground mb-4">{selectedTurf.location}</p>

                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div className="rounded-lg border bg-secondary/50 p-3">
                      <p className="text-muted-foreground text-xs mb-1">Base rate</p>
                      <p className="text-lg font-semibold">₹{selectedTurf.price_per_hour}/hr</p>
                    </div>
                    <div className="rounded-lg border bg-secondary/50 p-3">
                      <p className="text-muted-foreground text-xs mb-1">Max players</p>
                      <p className="text-lg font-semibold">{selectedTurf.max_players ?? 10}</p>
                    </div>
                    {selectedTurf.peak_price_per_hour > 0 && (
                      <div className="col-span-2 rounded-lg border bg-secondary/50 p-3">
                        <p className="text-muted-foreground text-xs mb-1">Peak pricing</p>
                        <p className="font-semibold">
                          ₹{selectedTurf.peak_price_per_hour}/hr ·{' '}
                          {String(selectedTurf.peak_hour_start ?? 17).padStart(2, '0')}:00 –{' '}
                          {String(selectedTurf.peak_hour_end ?? 20).padStart(2, '0')}:00
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Select a date and time above, then confirm your booking.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <h2 className="text-lg font-semibold mb-4">
            Choose a Turf
            {filteredTurfs.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredTurfs.length} found)
              </span>
            )}
          </h2>

          {filteredTurfs.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No turfs match your filters.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredTurfs.map((turf) => (
                <Card
                  key={turf.id}
                  className={`overflow-hidden p-0 border transition-all cursor-pointer hover:shadow-md ${
                    selectedTurf?.id === turf.id
                      ? 'border-primary ring-2 ring-primary/30 scale-[1.02]'
                      : 'hover:border-primary/50 opacity-90 hover:opacity-100'
                  }`}
                  onClick={() => handleSelectTurf(turf)}
                >
                  <div className="relative h-28 w-full">
                    <img
                      src={getPrimaryTurfImage(turf, defaultTurfImage)}
                      alt={turf.name}
                      className="h-full w-full object-cover"
                    />
                    {selectedTurf?.id === turf.id && (
                      <div className="absolute inset-0 bg-primary/10" />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate">{turf.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{turf.location}</p>
                    <p className="mt-1 text-sm font-medium">₹{turf.price_per_hour}/hr</p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Booking details (shows when time is selected) */}
          {selectedTurf && selectedTime !== null && (
            <Card className="mt-6 p-6">
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
        </section>
      </main>
    </div>
  )
}
