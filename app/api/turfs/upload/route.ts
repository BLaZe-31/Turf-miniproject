import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { uploadTurfImages } from '@/lib/turf-storage'
import { verifyOfficial } from '@/lib/verify-official'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const auth = await verifyOfficial(supabase)

    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const formData = await request.formData()
    const files = formData.getAll('files').filter((f): f is File => f instanceof File)

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const storageClient = createAdminClient() ?? supabase
    const urls = await uploadTurfImages(storageClient, files, auth.userId)

    return NextResponse.json({ urls })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] Error uploading turf images:', message)
    return NextResponse.json(
      { error: message || 'Failed to upload images' },
      { status: 500 }
    )
  }
}
