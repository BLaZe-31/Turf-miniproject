'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { getPrimaryTurfImage, getTurfImages } from '@/lib/turf-images'
import { uploadTurfImages } from '@/lib/turf-storage'
import { useOfficialGuard } from '@/lib/hooks/use-official-guard'

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
  image_urls?: string[]
  max_players: number
}

type TurfFormData = {
  name: string
  location: string
  price_per_hour: string
  peak_price_per_hour: string
  peak_hour_start: string
  peak_hour_end: string
  sport: string
  max_players: string
}

const defaultTurfImage = (sport: string) =>
  `https://source.unsplash.com/400x300/?${encodeURIComponent(sport)}+turf`

type PendingImage = {
  id: string
  file: File
  previewUrl: string
}

const emptyTurfForm: TurfFormData = {
  name: '',
  location: '',
  price_per_hour: '',
  peak_price_per_hour: '',
  peak_hour_start: '17',
  peak_hour_end: '20',
  sport: 'football',
  max_players: '10',
}

export default function AdminPage() {
  const { loading, isOfficial, supabase } = useOfficialGuard()
  const [turfs, setTurfs] = useState<Turf[]>([])
  const [showAddTurf, setShowAddTurf] = useState(false)
  const [editingTurf, setEditingTurf] = useState<Turf | null>(null)
  const [turfForm, setTurfForm] = useState<TurfFormData>(emptyTurfForm)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [savingTurf, setSavingTurf] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOfficial) return

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
        toast.error('Failed to load turfs')
      }
    }

    loadTurfs()
  }, [isOfficial, supabase])

  const openAddForm = () => {
    setEditingTurf(null)
    setTurfForm(emptyTurfForm)
    setImageUrls([])
    setPendingImages([])
    setShowAddTurf(true)
  }

  const openEditForm = (turf: Turf) => {
    setEditingTurf(turf)
    setTurfForm({
      name: turf.name,
      location: turf.location,
      price_per_hour: String(turf.price_per_hour),
      peak_price_per_hour: String(turf.peak_price_per_hour || ''),
      peak_hour_start: String(turf.peak_hour_start ?? 17),
      peak_hour_end: String(turf.peak_hour_end ?? 20),
      sport: turf.sport,
      max_players: String(turf.max_players ?? 10),
    })
    setImageUrls(getTurfImages(turf))
    setPendingImages([])
    setShowAddTurf(true)
  }

  const closeForm = () => {
    pendingImages.forEach((img) => URL.revokeObjectURL(img.previewUrl))
    setShowAddTurf(false)
    setEditingTurf(null)
    setTurfForm(emptyTurfForm)
    setImageUrls([])
    setPendingImages([])
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newPending = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setPendingImages((prev) => [...prev, ...newPending])
    e.target.value = ''
  }

  const removeExistingImage = (url: string) => {
    setImageUrls((prev) => prev.filter((u) => u !== url))
  }

  const removePendingImage = (id: string) => {
    setPendingImages((prev) => {
      const target = prev.find((img) => img.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((img) => img.id !== id)
    })
  }

  const uploadPendingImages = async (): Promise<string[]> => {
    if (pendingImages.length === 0) return []

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('You must be logged in to upload images')
    }

    return uploadTurfImages(
      supabase,
      pendingImages.map((img) => img.file),
      user.id
    )
  }

  const buildPayload = () => ({
    name: turfForm.name,
    location: turfForm.location,
    pricePerHour: parseFloat(turfForm.price_per_hour),
    peakPricePerHour: turfForm.peak_price_per_hour
      ? parseFloat(turfForm.peak_price_per_hour)
      : 0,
    peakHourStart: parseInt(turfForm.peak_hour_start) || 17,
    peakHourEnd: parseInt(turfForm.peak_hour_end) || 20,
    sport: turfForm.sport,
    imageUrls: imageUrls,
    maxPlayers: parseInt(turfForm.max_players) || 10,
  })

  const handleSaveTurf = async () => {
    if (!turfForm.name || !turfForm.location || !turfForm.price_per_hour) {
      toast.error('Please fill all required fields')
      return
    }

    setSavingTurf(true)
    try {
      let uploadedUrls: string[] = []
      if (pendingImages.length > 0) {
        setUploadingImages(true)
        uploadedUrls = await uploadPendingImages()
        setUploadingImages(false)
      }
      const allImageUrls = [...imageUrls, ...uploadedUrls]
      const payload = { ...buildPayload(), imageUrls: allImageUrls }

      if (editingTurf) {
        // Update existing turf
        const response = await fetch(`/api/turfs/${editingTurf.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update turf')
        }

        toast.success('Turf updated successfully')
      } else {
        // Create new turf
        const response = await fetch('/api/turfs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to add turf')
        }

        toast.success('Turf added successfully')
      }

      closeForm()
      const { data, error } = await supabase.from('turfs').select('*').order('name')
      if (!error) setTurfs(data || [])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save turf'
      console.error('[v0] Turf save error:', message)
      toast.error(message)
    } finally {
      setUploadingImages(false)
      setSavingTurf(false)
    }
  }

  const handleDeleteTurf = async (turfId: string, turfName: string) => {
    if (!confirm(`Are you sure you want to delete "${turfName}"? This cannot be undone.`)) return

    setDeletingId(turfId)
    try {
      const response = await fetch(`/api/turfs/${turfId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete turf')
      }

      toast.success('Turf deleted')
      setTurfs((prev) => prev.filter((t) => t.id !== turfId))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete turf'
      toast.error(message)
    } finally {
      setDeletingId(null)
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
                Add, edit, or remove turfs and set pricing.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/reservations">
                <Button variant="outline">Manage Reservations</Button>
              </Link>
              <Button onClick={showAddTurf ? closeForm : openAddForm}>
                {showAddTurf ? 'Cancel' : 'Add Turf'}
              </Button>
            </div>
          </div>

          {/* Turf Add / Edit Form */}
          {showAddTurf && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingTurf ? `Edit: ${editingTurf.name}` : 'Add New Turf'}
              </h3>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Turf Name</label>
                  <Input
                    placeholder="e.g., Green Field Turf"
                    value={turfForm.name}
                    onChange={(e) =>
                      setTurfForm({ ...turfForm, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <Input
                    placeholder="e.g., Downtown, City Center"
                    value={turfForm.location}
                    onChange={(e) =>
                      setTurfForm({ ...turfForm, location: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Base Price per Hour (₹)</label>
                    <Input
                      type="number"
                      placeholder="500"
                      value={turfForm.price_per_hour}
                      onChange={(e) =>
                        setTurfForm({ ...turfForm, price_per_hour: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Peak Price per Hour (₹)</label>
                    <Input
                      type="number"
                      placeholder="650"
                      value={turfForm.peak_price_per_hour}
                      onChange={(e) =>
                        setTurfForm({ ...turfForm, peak_price_per_hour: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Players</label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={turfForm.max_players}
                      onChange={(e) =>
                        setTurfForm({ ...turfForm, max_players: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Peak Hour Start</label>
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      value={turfForm.peak_hour_start}
                      onChange={(e) => setTurfForm({ ...turfForm, peak_hour_start: e.target.value })}
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
                      value={turfForm.peak_hour_end}
                      onChange={(e) => setTurfForm({ ...turfForm, peak_hour_end: e.target.value })}
                    >
                      {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, '0')}:00 ({h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Sport</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    value={turfForm.sport}
                    onChange={(e) => setTurfForm({ ...turfForm, sport: e.target.value })}
                  >
                    <option value="football">Football</option>
                    <option value="cricket">Cricket</option>
                    <option value="basketball">Basketball</option>
                    <option value="badminton">Badminton</option>
                    <option value="tennis">Tennis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Turf Images</label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Upload one or more photos (JPEG, PNG, WebP, GIF — max 5 MB each)
                  </p>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handleImageSelect}
                    className="cursor-pointer file:cursor-pointer"
                  />
                  {(imageUrls.length > 0 || pendingImages.length > 0) && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {imageUrls.map((url) => (
                        <div key={url} className="relative group">
                          <img
                            src={url}
                            alt="Turf"
                            className="h-24 w-full rounded-lg object-cover border"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(url)}
                            className="absolute top-1 right-1 rounded-full bg-destructive text-destructive-foreground text-xs w-6 h-6 opacity-90 hover:opacity-100"
                            aria-label="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {pendingImages.map((img) => (
                        <div key={img.id} className="relative group">
                          <img
                            src={img.previewUrl}
                            alt={img.file.name}
                            className="h-24 w-full rounded-lg object-cover border border-dashed border-primary/50"
                          />
                          <span className="absolute bottom-1 left-1 text-[10px] bg-background/80 rounded px-1 truncate max-w-[90%]">
                            New
                          </span>
                          <button
                            type="button"
                            onClick={() => removePendingImage(img.id)}
                            className="absolute top-1 right-1 rounded-full bg-destructive text-destructive-foreground text-xs w-6 h-6 opacity-90 hover:opacity-100"
                            aria-label="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleSaveTurf}
                  disabled={savingTurf}
                  className="w-full"
                >
                  {savingTurf
                    ? uploadingImages
                      ? 'Uploading images...'
                      : editingTurf
                        ? 'Updating...'
                        : 'Adding...'
                    : editingTurf
                      ? 'Update Turf'
                      : 'Add Turf'}
                </Button>
              </div>
            </Card>
          )}

          {/* Turf Cards */}
          <div className="grid gap-4">
            {turfs.map((turf) => (
              <Card key={turf.id} className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{turf.name}</h3>
                    <p className="text-muted-foreground mb-2">{turf.location}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-1">
                      <span className="capitalize">Sport: {turf.sport}</span>
                      <span>Max Players: {turf.max_players ?? 10}</span>
                    </div>
                    <p className="font-medium">
                      ₹{turf.price_per_hour}/hr
                      {turf.peak_price_per_hour > 0 && (
                        <span className="text-sm text-muted-foreground ml-3">
                          Peak: ₹{turf.peak_price_per_hour}/hr ({String(turf.peak_hour_start).padStart(2, '0')}:00 – {String(turf.peak_hour_end).padStart(2, '0')}:00)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 items-end">
                    <div className="relative w-full md:w-48">
                      <div className="h-32 overflow-hidden rounded-xl bg-secondary">
                        <img
                          src={getPrimaryTurfImage(turf, defaultTurfImage)}
                          alt={turf.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      {getTurfImages(turf).length > 1 && (
                        <span className="absolute bottom-2 right-2 text-xs font-medium bg-background/90 rounded-full px-2 py-0.5">
                          +{getTurfImages(turf).length - 1} more
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditForm(turf)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTurf(turf.id, turf.name)}
                        disabled={deletingId === turf.id}
                      >
                        {deletingId === turf.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
