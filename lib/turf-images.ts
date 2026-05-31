export function getTurfImages(turf: {
  image_urls?: string[] | null
  image_url?: string | null
}): string[] {
  if (turf.image_urls?.length) return turf.image_urls
  if (turf.image_url) return [turf.image_url]
  return []
}

export function getPrimaryTurfImage(
  turf: { image_urls?: string[] | null; image_url?: string | null; sport: string },
  fallback: (sport: string) => string
): string {
  const images = getTurfImages(turf)
  return images[0] || fallback(turf.sport)
}
