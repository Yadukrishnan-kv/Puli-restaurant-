import { useRef, useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { compressAndToDataUrl } from '@/lib/imageCompression'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value: string
  onChange: (dataUrl: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function ImageUpload({
  value,
  onChange,
  placeholder = 'Upload image',
  className,
  disabled,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const dataUrl = await compressAndToDataUrl(file)
      onChange(dataUrl)
    } catch (err) {
      setError('Failed to process image')
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-elevated)] transition-colors',
          value && 'min-h-[180px]',
          disabled && 'cursor-not-allowed opacity-60'
        )}
        onClick={() => !disabled && !loading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
          disabled={disabled}
        />
        {loading ? (
          <Loader2 className="h-10 w-10 animate-spin text-[var(--color-text-secondary)]" />
        ) : value ? (
          <>
            <img
              src={value}
              alt="Preview"
              className="max-h-40 rounded object-cover"
            />
            <button
              type="button"
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-[var(--color-text-secondary)]" />
            <span className="mt-2 text-sm text-[var(--color-text-secondary)]">{placeholder}</span>
          </>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
