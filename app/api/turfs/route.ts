import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { verifyOfficial } from '@/lib/verify-official'
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
    const auth = await verifyOfficial(supabase)

    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { name, location, pricePerHour, peakPricePerHour, peakHourStart, peakHourEnd, sport, imageUrl, imageUrls, maxPlayers } = body

    const resolvedImageUrls: string[] = Array.isArray(imageUrls)
      ? imageUrls.filter((url: unknown): url is string => typeof url === 'string' && url.length > 0)
      : imageUrl
        ? [imageUrl]
        : []

    if (!name || !location || !pricePerHour) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = createAdminClient() ?? supabase

    const { data, error } = await db
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
          image_url: resolvedImageUrls[0] || null,
          image_urls: resolvedImageUrls,
          max_players: maxPlayers || 10,
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
