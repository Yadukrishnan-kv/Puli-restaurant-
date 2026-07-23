import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ImageUpload } from '@/components/forms/ImageUpload'
import { useStore } from '@/store/useStore'
import { useToast } from '@/context/ToastContext'
import { adminAPI } from '@/lib/adminAPI'
import type { Country } from '@/types'

const schema = z.object({
  name_en: z.string().min(1, 'Name (EN) required'),
  name_ar: z.string().min(1, 'Name (AR) required'),
  flag_image: z.string().optional(),
  visible: z.boolean(),
})

type FormData = z.infer<typeof schema>

const defaultValues: FormData = {
  name_en: '',
  name_ar: '',
  flag_image: '',
  visible: true,
}

export function CountriesPage() {
  const countries = useStore((s) => s.countries)
  const addCountry = useStore((s) => s.addCountry)
  const updateCountry = useStore((s) => s.updateCountry)
  const deleteCountry = useStore((s) => s.deleteCountry)
  const toast = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Country | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const openCreate = () => {
    setEditing(null)
    reset(defaultValues)
    setModalOpen(true)
  }

  const openEdit = (country: Country) => {
    setEditing(country)
    reset({
      name_en: country.name_en,
      name_ar: country.name_ar,
      flag_image: country.flag_image || '',
      visible: country.visible,
    })
    setModalOpen(true)
  }

  const onSave = async (data: FormData) => {
    try {
      const payload = {
        name_en: data.name_en,
        name_ar: data.name_ar,
        flag_image: data.flag_image || '',
        visible: data.visible,
        order: countries.length,
      }

      if (editing) {
        const updated = await adminAPI.updateCountry(editing.id, payload)
        updateCountry(editing.id, updated)
        toast('Country updated')
      } else {
        const created = await adminAPI.createCountry(payload)
        addCountry(created)
        toast('Country added')
      }
    } catch (error) {
      console.error(error)
      toast('Failed to save country', 'error')
    }

    setModalOpen(false)
  }

  const onDelete = async (id: string) => {
    if (confirm('Delete this country? Menu items referencing it will stay but country will be empty.')) {
      try {
        await adminAPI.deleteCountry(id)
        deleteCountry(id)
        toast('Country deleted', 'error')
      } catch (error) {
        console.error(error)
        toast('Failed to delete country', 'error')
      }
    }
  }

  return (
    <>
      <Header
        title="Countries"
        subtitle="Manage country references for menu items"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add country
          </Button>
        }
      />
      <Card className="mt-6">
        {countries.length === 0 ? (
          <p className="py-8 text-center text-[var(--color-text-secondary)]">No countries yet.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]">
                <th className="py-2">Flag</th>
                <th className="py-2">Name (EN)</th>
                <th className="py-2">Name (AR)</th>
                <th className="py-2">Visible</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {countries.map((c) => (
                <tr key={c.id} className="border-b border-[var(--color-border)]">
                  <td className="py-2">
                    {c.flag_image ? (
                      <img src={c.flag_image} alt={`${c.name_en} flag`} className="h-6 w-6 rounded-sm object-cover" />
                    ) : (
                      <span className="text-xs text-[var(--color-text-secondary)]">-</span>
                    )}
                  </td>
                  <td className="py-2">{c.name_en}</td>
                  <td className="py-2">{c.name_ar}</td>
                  <td className="py-2">{c.visible ? 'Yes' : 'No'}</td>
                  <td className="py-2 space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(c.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit country' : 'Add country'}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSave)}>Save</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name (EN)</label>
            <input {...register('name_en')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" />
            {errors.name_en && <p className="mt-1 text-sm text-red-600">{errors.name_en.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Name (AR)</label>
            <input {...register('name_ar')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" />
            {errors.name_ar && <p className="mt-1 text-sm text-red-600">{errors.name_ar.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Flag (small image)</label>
            <ImageUpload
              value={watch('flag_image') || ''}
              onChange={(val) => setValue('flag_image', val, { shouldDirty: true })}
              placeholder="Upload country flag"
            />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('visible')} />
            Visible
          </label>
        </form>
      </Modal>
    </>
  )
}
