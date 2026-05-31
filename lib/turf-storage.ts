import type { SupabaseClient } from '@supabase/supabase-js'

export const TURF_IMAGES_BUCKET = 'turf-images'
export const MAX_TURF_IMAGE_SIZE = 5 * 1024 * 1024
export const ALLOWED_TURF_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]

function validateImageFile(file: File) {
  if (!ALLOWED_TURF_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type || file.name}`)
  }
  if (file.size > MAX_TURF_IMAGE_SIZE) {
    throw new Error(`${file.name} exceeds the 5 MB limit`)
  }
}

export async function uploadTurfImages(
  supabase: SupabaseClient,
  files: File[],
  userId: string
): Promise<string[]> {
  const urls: string[] = []

  for (const file of files) {
    validateImageFile(file)

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${userId}/${crypto.randomUUID()}.${ext}`

    const { data, error } = await supabase.storage
      .from(TURF_IMAGES_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false })

    if (error) {
      if (error.message.toLowerCase().includes('row-level security')) {
        throw new Error(
          'Image upload blocked by storage permissions. Run scripts/03_add_turf_images.sql in Supabase.'
        )
      }
      if (error.message.toLowerCase().includes('bucket')) {
        throw new Error(
          'Storage bucket not found. Run scripts/03_add_turf_images.sql in Supabase.'
        )
      }
      throw new Error(error.message)
    }

    const { data: publicData } = supabase.storage
      .from(TURF_IMAGES_BUCKET)
      .getPublicUrl(data.path)
    urls.push(publicData.publicUrl)
  }

  return urls
}
