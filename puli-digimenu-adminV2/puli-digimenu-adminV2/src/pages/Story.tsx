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
  description: z.string(),
})

type FormData = z.infer<typeof schema>

export function StoryPage() {
  const story = useStore((s) => s.story)
  const setStory = useStore((s) => s.setStory)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: story.title,
      description: story.description,
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      const id = story.id
      const payload = {
        title: data.title,
        description: data.description,
        background_image: story.background_image,
      }
      const updated = id ? await adminAPI.updateStory(id, payload) : await adminAPI.getStory()
      setStory(updated)
      toast('Story section saved', 'success')
    } catch (error) {
      console.error(error)
      toast('Failed to save story', 'error')
    }
  }

  return (
    <>
      <Header
        title="Story Section"
        subtitle="Restaurant story on homepage"
      />
      <Card className="mt-8 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Title
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
              Description (rich text / plain)
            </label>
            <textarea
              {...register('description')}
              rows={6}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Background image
            </label>
            <ImageUpload
              value={story.background_image}
              onChange={(url) => setStory({ ...story, background_image: url })}
            />
          </div>
          <Button type="submit" disabled={!isDirty}>
            Save story
          </Button>
        </form>
      </Card>
    </>
  )
}
