import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Loader2, RotateCw } from 'lucide-react'
import getCroppedImg from '@/lib/cropImage'
import { toast } from 'sonner'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

export function AdImageUploadDialog({ open, onOpenChange, currentImage, currentLink, onSave }) {
  const [imageSrc, setImageSrc] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [link, setLink] = useState(currentLink || 'https://randyojedalaw.com')
  const [isSaving, setIsSaving] = useState(false)

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setImageSrc(reader.result)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setRotation(0)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      let imageData = null

      if (imageSrc && croppedAreaPixels) {
        // Crop the image
        const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)

        // Convert blob to base64
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(croppedBlob)
        })

        imageData = base64
      }

      // Get token from localStorage
      const token = localStorage.getItem('tampamixtape_token')

      // Save to backend
      const response = await fetch(`${API_URL}/api/admin/settings/ad`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageData,
          link,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save advertisement')
      }

      const data = await response.json()
      toast.success('Advertisement updated successfully')

      onSave?.(data)
      onOpenChange(false)

      // Reset state
      setImageSrc(null)
    } catch (error) {
      console.error('Error saving ad:', error)
      toast.error('Failed to save advertisement')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setImageSrc(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setLink(currentLink || 'https://randyojedalaw.com')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Advertisement</DialogTitle>
          <DialogDescription>
            Upload and crop a new advertisement image, or update the link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Advertisement Image</Label>
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="flex-1"
              />
              {imageSrc && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="Rotate 90°"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Cropper */}
          {imageSrc ? (
            <div className="space-y-4">
              <div className="relative h-[300px] bg-black/90 rounded-lg overflow-hidden">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={3 / 1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="space-y-2">
                <Label>Zoom: {zoom.toFixed(1)}x</Label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          ) : currentImage ? (
            <div className="space-y-2">
              <Label>Current Image</Label>
              <div className="rounded-lg overflow-hidden border border-border">
                <img
                  src={currentImage}
                  alt="Current advertisement"
                  className="w-full h-auto"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a new image to replace it, or just update the link below.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] border-2 border-dashed border-border rounded-lg">
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Select an image file to upload
              </p>
            </div>
          )}

          {/* Link Input */}
          <div className="space-y-2">
            <Label htmlFor="ad-link">Advertisement Link</Label>
            <Input
              id="ad-link"
              type="url"
              placeholder="https://example.com"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              URL to open when the ad is clicked
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
