import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { verifyOfficial } from '@/lib/verify-official'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const auth = await verifyOfficial(supabase)

    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const {
      name,
      location,
      pricePerHour,
      peakPricePerHour,
      peakHourStart,
      peakHourEnd,
      sport,
      imageUrl,
      imageUrls,
      maxPlayers,
    } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (location !== undefined) updateData.location = location
    if (pricePerHour !== undefined) updateData.price_per_hour = pricePerHour
    if (peakPricePerHour !== undefined) updateData.peak_price_per_hour = peakPricePerHour
    if (peakHourStart !== undefined) updateData.peak_hour_start = peakHourStart
    if (peakHourEnd !== undefined) updateData.peak_hour_end = peakHourEnd
    if (sport !== undefined) updateData.sport = sport
    if (imageUrls !== undefined) {
      const resolvedImageUrls = Array.isArray(imageUrls)
        ? imageUrls.filter((url: unknown): url is string => typeof url === 'string' && url.length > 0)
        : []
      updateData.image_urls = resolvedImageUrls
      updateData.image_url = resolvedImageUrls[0] || null
    } else if (imageUrl !== undefined) {
      updateData.image_url = imageUrl || null
      updateData.image_urls = imageUrl ? [imageUrl] : []
    }
    if (maxPlayers !== undefined) updateData.max_players = maxPlayers

    const db = createAdminClient() ?? supabase

    const { data, error } = await db
      .from('turfs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error updating turf:', message)
    return NextResponse.json(
      { error: message || 'Failed to update turf' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const auth = await verifyOfficial(supabase)

    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const db = createAdminClient() ?? supabase

    const { error } = await db
      .from('turfs')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error deleting turf:', message)
    return NextResponse.json(
      { error: message || 'Failed to delete turf' },
      { status: 500 }
    )
  }
}
