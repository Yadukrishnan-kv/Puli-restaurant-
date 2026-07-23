import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2, Plus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ImageUpload } from '@/components/forms/ImageUpload'
import { useStore } from '@/store/useStore'
import { useToast } from '@/context/ToastContext'
import { slugify } from '@/lib/utils'
import { adminAPI } from '@/lib/adminAPI'
import type { Category } from '@/types'

const schema = z.object({
  section_id: z.string().nullable(),
  name_en: z.string().min(1, 'Name (EN) required'),
  name_ar: z.string(),
  description: z.string(),
  visible: z.boolean(),
})

type FormData = z.infer<typeof schema>

const defaultValues: FormData = {
  section_id: null,
  name_en: '',
  name_ar: '',
  description: '',
  visible: true,
}

function SortableCategoryRow({
  category,
  sectionName,
  onEdit,
  onDelete,
}: {
  category: Category
  sectionName: string
  onEdit: (c: Category) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-[var(--color-border)] ${isDragging ? 'opacity-50' : ''}`}
    >
      <td className="w-10 cursor-grab py-3" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-[var(--color-text-secondary)]" />
      </td>
      <td className="py-3">
        {category.image ? (
          <img src={category.image} alt="" className="h-10 w-10 rounded object-cover" />
        ) : (
          <div className="h-10 w-10 rounded bg-[var(--color-border)]" />
        )}
      </td>
      <td className="py-3 font-medium text-[var(--color-text-primary)]">{category.name_en}</td>
      <td className="py-3 text-[var(--color-text-secondary)]">{category.name_ar || '–'}</td>
      <td className="py-3 text-[var(--color-text-secondary)]">{sectionName}</td>
      <td className="py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            category.visible ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-[var(--color-text-secondary)]'
          }`}
        >
          {category.visible ? 'Visible' : 'Hidden'}
        </span>
      </td>
      <td className="py-3">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(category.id)}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

export function CategoriesPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const sections = useStore((s) => s.sections)
  const categories = useStore((s) => s.categories)
  const classifications = useStore((s) => s.classifications)
  const addCategory = useStore((s) => s.addCategory)
  const updateCategory = useStore((s) => s.updateCategory)
  const deleteCategory = useStore((s) => s.deleteCategory)
  const reorderCategories = useStore((s) => s.reorderCategories)
  const addClassification = useStore((s) => s.addClassification)
  const deleteClassification = useStore((s) => s.deleteClassification)
  const toast = useToast()
  const getSectionName = (id: string | null) => (id ? sections.find((s) => s.id === id)?.name_en ?? '–' : '–')

  useEffect(() => {
    const state = location.state as { addForSectionId?: string; editCategoryId?: string } | null
    if (state?.addForSectionId) {
      setEditing(null)
      setImage('')
      setNewClsNameEn('')
      setNewClsNameAr('')
      reset({ ...defaultValues, section_id: state.addForSectionId })
      setModalOpen(true)
      navigate(location.pathname, { replace: true, state: {} })
    } else if (state?.editCategoryId) {
      const cat = categories.find((c) => c.id === state.editCategoryId)
      if (cat) openEdit(cat)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [image, setImage] = useState('')
  const [newClsNameEn, setNewClsNameEn] = useState('')
  const [newClsNameAr, setNewClsNameAr] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const openCreate = (presetSectionId: string | null = null) => {
    setEditing(null)
    setImage('')
    setNewClsNameEn('')
    setNewClsNameAr('')
    reset({ ...defaultValues, section_id: presetSectionId })
    setModalOpen(true)
  }

  const openEdit = (c: Category) => {
    setEditing(c)
    setImage(c.image)
    setNewClsNameEn('')
    setNewClsNameAr('')
    reset({
      section_id: c.section_id ?? null,
      name_en: c.name_en,
      name_ar: c.name_ar,
      description: c.description,
      visible: c.visible,
    })
    setModalOpen(true)
  }

  const categoryClassifications = editing
    ? classifications.filter((cl) => cl.category_id === editing.id).sort((a, b) => a.order - b.order)
    : []

  const handleAddClassification = async () => {
    if (!editing || !newClsNameEn.trim()) return
    try {
      const created = await adminAPI.createClassification({
        category_id: editing.id,
        name_en: newClsNameEn.trim(),
        name_ar: newClsNameAr.trim(),
        order: categoryClassifications.length,
        visible: true,
      })
      addClassification(created)
      setNewClsNameEn('')
      setNewClsNameAr('')
      toast('Sub-category added')
    } catch (error) {
      console.error(error)
      toast('Failed to add sub-category', 'error')
    }
  }

  const onSave = async (data: FormData) => {
    try {
      const payload = {
        section_id: data.section_id ?? null,
        name_en: data.name_en,
        name_ar: data.name_ar,
        description: data.description,
        image,
        slug: slugify(data.name_en),
        visible: data.visible,
        order: categories.filter((c) => c.section_id === data.section_id).length,
      }

      if (editing) {
        const updated = await adminAPI.updateCategory(editing.id, payload)
        updateCategory(editing.id, updated)
        toast('Category updated')
      } else {
        const created = await adminAPI.createCategory(payload)
        addCategory(created)
        toast('Category added')
      }
    } catch (error) {
      console.error(error)
      toast('Failed to save category', 'error')
    }

    setModalOpen(false)
  }

  const onDelete = async (id: string) => {
    if (confirm('Delete this category? Menu items in it will remain but lose category.')) {
      try {
        await adminAPI.deleteCategory(id)
        deleteCategory(id)
        toast('Category deleted', 'error')
      } catch (error) {
        console.error(error)
        toast('Failed to delete category', 'error')
      }
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = categories.findIndex((c) => c.id === active.id)
    const newIndex = categories.findIndex((c) => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    // Determine new order locally and persist it
    const updatedList = [...categories]
    const [moved] = updatedList.splice(oldIndex, 1)
    updatedList.splice(newIndex, 0, moved)

    const reordered = updatedList
      .map((c, idx) => ({ ...c, order: idx }))

    reorderCategories(oldIndex, newIndex)

    try {
      await Promise.all(
        reordered.map((cat) => adminAPI.updateCategory(cat.id, { order: cat.order }))
      )
    } catch (error) {
      console.error(error)
      toast('Failed to save category order', 'error')
    }
  }

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order)

  return (
    <>
      <Header
        title="Categories"
        subtitle="Manage menu categories and order"
        action={
          <Button onClick={() => openCreate()}>
            <Plus className="mr-2 h-4 w-4" />
            Add category
          </Button>
        }
      />

      <Card className="mt-8">
        {sortedCategories.length === 0 ? (
          <p className="py-8 text-center text-[var(--color-text-secondary)]">No categories yet. Add one to get started.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-sm text-[var(--color-text-secondary)]">
                  <th className="w-10 py-3"></th>
                  <th className="py-3">Image</th>
                  <th className="py-3">Name (EN)</th>
                  <th className="py-3">Name (AR)</th>
                  <th className="py-3">Section</th>
                  <th className="py-3">Visibility</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                <SortableContext items={sortedCategories.map((c) => c.id)}>
                  {sortedCategories.map((cat) => (
                    <SortableCategoryRow
                      key={cat.id}
                      category={cat}
                      sectionName={getSectionName(cat.section_id)}
                      onEdit={openEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit category' : 'Add category'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSave)}>Save</Button>
          </div>
        }
      >
        <form id="category-form" onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Section (e.g. Main Menu, Special Menu)</label>
            <select
              {...register('section_id')}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
            >
              <option value="">— No section —</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name_en}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Name (English)</label>
            <input
              {...register('name_en')}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
            />
            {errors.name_en && (
              <p className="mt-1 text-sm text-red-600">{errors.name_en.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Name (Arabic)</label>
            <input
              {...register('name_ar')}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              {...register('description')}
              rows={2}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category image</label>
            <ImageUpload value={image} onChange={setImage} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="cat-visible" {...register('visible')} className="h-4 w-4 rounded" />
            <label htmlFor="cat-visible">Visible</label>
          </div>

          {editing && (
            <div className="border-t border-[var(--color-border)] pt-4">
              <h4 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
                Sub-categories
              </h4>
              <p className="mb-3 text-xs text-[var(--color-text-secondary)]">
                Add sub-categories (e.g. Soup, Desserts, Main, Juice). Every menu item in this category must be assigned to one of these.
              </p>
              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={newClsNameEn}
                  onChange={(e) => setNewClsNameEn(e.target.value)}
                  placeholder="Name (EN)"
                  className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
                />
                <input
                  type="text"
                  value={newClsNameAr}
                  onChange={(e) => setNewClsNameAr(e.target.value)}
                  placeholder="Name (AR)"
                  className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
                />
                <Button type="button" size="sm" onClick={handleAddClassification} disabled={!newClsNameEn.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <ul className="space-y-1">
                {categoryClassifications.map((cl) => (
                  <li
                    key={cl.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
                  >
                    <span className="text-[var(--color-text-primary)]">{cl.name_en}</span>
                    {cl.name_ar && (
                      <span className="text-[var(--color-text-secondary)]"> / {cl.name_ar}</span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          await adminAPI.deleteClassification(cl.id)
                          deleteClassification(cl.id)
                          toast('Sub-category removed')
                        } catch (error) {
                          console.error(error)
                          toast('Failed to remove sub-category', 'error')
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </li>
                ))}
                {categoryClassifications.length === 0 && (
                  <li className="py-2 text-xs text-[var(--color-text-secondary)]">No sub-categories yet. Add at least one (e.g. Soup, Main, Desserts).</li>
                )}
              </ul>
            </div>
          )}
        </form>
      </Modal>
    </>
  )
}
