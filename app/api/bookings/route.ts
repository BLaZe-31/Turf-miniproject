import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function bookingOverlaps(startA: number, durationA: number, startB: number, durationB: number) {
  return startA < startB + durationB && startA + durationA > startB
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const turfId = searchParams.get('turfId')
    const date = searchParams.get('date')

    if (!turfId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('time_slot,duration')
      .eq('turf_id', turfId)
      .eq('date', date)
      .eq('status', 'confirmed')

    if (error) throw error

    return NextResponse.json({ bookings: data || [] })
  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { turfId, date, timeSlot, duration, totalPrice } = body

    if (!turfId || !date || timeSlot === undefined || duration === undefined || !totalPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: existingBookings, error: existingError } = await supabase
      .from('bookings')
      .select('time_slot,duration')
      .eq('turf_id', turfId)
      .eq('date', date)
      .eq('status', 'confirmed')

    if (existingError) {
      throw existingError
    }

    if (existingBookings && existingBookings.some((booking) =>
      bookingOverlaps(
        timeSlot,
        duration,
        booking.time_slot,
        booking.duration || 1
      )
    )) {
      return NextResponse.json(
        { error: 'Selected time range overlaps with an existing booking' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          user_id: user.user.id,
          turf_id: turfId,
          date,
          time_slot: timeSlot,
          duration,
          status: 'confirmed',
          total_price: totalPrice,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
