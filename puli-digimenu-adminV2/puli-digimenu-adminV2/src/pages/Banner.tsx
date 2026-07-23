import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ImageUpload } from '@/components/forms/ImageUpload'
import { useStore } from '@/store/useStore'
import { useToast } from '@/context/ToastContext'
import { adminAPI } from '@/lib/adminAPI'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string(),
  enabled: z.boolean(),
})

type FormData = z.infer<typeof schema>

export function BannerPage() {
  const banner = useStore((s) => s.banner)
  const setBanner = useStore((s) => s.setBanner)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: banner.title,
      subtitle: banner.subtitle,
      enabled: banner.enabled,
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      const id = banner.id
      const payload = {
        title: data.title,
        subtitle: data.subtitle,
        enabled: data.enabled,
        background_image: banner.background_image,
      }
      const updated = id
        ? await adminAPI.updateBanner(id, payload)
        : await adminAPI.getBanner()
      setBanner(updated)
      toast('Banner saved', 'success')
    } catch (error) {
      console.error(error)
      toast('Failed to save banner', 'error')
    }
  }

  return (
    <>
      <Header
        title="Banner Management"
        subtitle="Homepage hero banner"
      />
      <Card className="mt-8 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Banner title
            </label>
            <input
              {...register('title')}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Subtitle
            </label>
            <input
              {...register('subtitle')}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Background image
            </label>
            <ImageUpload
              value={banner.background_image}
              onChange={(url) => setBanner({ ...banner, background_image: url })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="banner-enabled"
              {...register('enabled')}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="banner-enabled" className="text-sm text-[var(--color-text-secondary)]">
              Enable banner
            </label>
          </div>
          <Button type="submit" disabled={!isDirty}>
            Save banner
          </Button>
        </form>
      </Card>
    </>
  )
}
