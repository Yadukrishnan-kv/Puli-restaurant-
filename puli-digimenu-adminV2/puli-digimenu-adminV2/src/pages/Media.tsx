import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Trash2, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/store/useStore'
import { useToast } from '@/context/ToastContext'
import { compressAndToDataUrl } from '@/lib/imageCompression'
import { adminAPI } from '@/lib/adminAPI'

export function MediaPage() {
  const { media, addMedia, deleteMedia } = useStore()
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue
      try {
        const dataUrl = await compressAndToDataUrl(file)
        const uploaded = await adminAPI.uploadMedia(dataUrl, file.name, file.size)
        addMedia(uploaded)
      } catch {
        toast('Failed to process ' + file.name, 'error')
      }
    }
    setUploading(false)
    e.target.value = ''
    toast('Images uploaded')
  }

  const onDelete = async (id: string) => {
    if (confirm('Remove this image from the library?')) {
      try {
        await adminAPI.deleteMedia(id)
        deleteMedia(id)
        toast('Image removed', 'error')
      } catch (error) {
        console.error(error)
        toast('Failed to remove image', 'error')
      }
    }
  }

  return (
    <>
      <Header
        title="Media Library"
        subtitle="Upload and manage images (auto-compressed)"
        action={
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFile}
              disabled={uploading}
            />
            <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload images
            </Button>
          </>
        }
      />

      <Card className="mt-8">
        {media.length === 0 ? (
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border)] py-16"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-[var(--color-text-secondary)]" />
            <p className="mt-2 text-[var(--color-text-secondary)]">No images yet. Click or drag to upload.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {media.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)]"
              >
                <img
                  src={item.url}
                  alt={item.name}
                  className="aspect-square w-full object-cover"
                />
                <div className="p-2">
                  <p className="truncate text-xs text-[var(--color-text-secondary)]">{item.name}</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-white/90 px-3 py-1 text-sm text-[var(--color-background-primary)]"
                  >
                    Preview
                  </a>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
