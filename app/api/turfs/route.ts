import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('turfs')
      .select('*')
      .order('name')

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching turfs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch turfs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: user, error: userError } = await supabase.auth.getUser()
    if (userError || !user.user) {
      console.error('[v0] Auth error:', userError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.user.id)
      .single()

    if (roleError) {
      console.error('[v0] Role check error:', roleError)
      return NextResponse.json(
        { error: 'Failed to verify user role' },
        { status: 500 }
      )
    }

    if (userData?.role !== 'admin' && userData?.role !== 'turf_official') {
      console.error('[v0] User is not authorized:', userData?.role)
      return NextResponse.json(
        { error: 'Only admins or turf officials can add turfs' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, location, pricePerHour, peakPricePerHour, peakHourStart, peakHourEnd, sport, imageUrl } = body

    if (!name || !location || !pricePerHour) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('turfs')
      .insert([
        {
          name,
          location,
          price_per_hour: pricePerHour,
          peak_price_per_hour: peakPricePerHour || 0,
          peak_hour_start: peakHourStart ?? 17,
          peak_hour_end: peakHourEnd ?? 20,
          sport: sport || 'football',
          image_url: imageUrl || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('[v0] Turf insert error:', error)
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] Error creating turf:', message)
    return NextResponse.json(
      { error: message || 'Failed to create turf' },
      { status: 500 }
    )
  }
}
