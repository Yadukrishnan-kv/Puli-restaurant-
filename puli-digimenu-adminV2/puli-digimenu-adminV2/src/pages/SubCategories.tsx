import { useState } from 'react'
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
import { useStore } from '@/store/useStore'
import { useToast } from '@/context/ToastContext'
import { adminAPI } from '@/lib/adminAPI'
import type { SubCategory } from '@/types'

function SortableSubCategoryRow({
  sc,
  categoryName,
  onEdit,
  onDelete,
}: {
  sc: SubCategory
  categoryName: string
  onEdit: (sc: SubCategory) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sc.id })

  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-[var(--color-border)] ${isDragging ? 'opacity-50' : ''}`}
    >
      <td className="w-10 cursor-grab py-3" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-[var(--color-text-secondary)]" />
      </td>
      <td className="py-3 text-[var(--color-text-secondary)]">{categoryName}</td>
      <td className="py-3 font-medium text-[var(--color-text-primary)]">{sc.name_en}</td>
      <td className="py-3 text-[var(--color-text-secondary)]">{sc.name_ar || '–'}</td>
      <td className="py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            sc.visible
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-[var(--color-text-secondary)]'
          }`}
        >
          {sc.visible ? 'Visible' : 'Hidden'}
        </span>
      </td>
      <td className="py-3">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(sc)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(sc.id)}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

const schema = z.object({
  category_id: z.string().min(1, 'Category required'),
  name_en: z.string().min(1, 'Name (EN) required'),
  name_ar: z.string().min(1, 'Name (AR) required'),
  visible: z.boolean(),
})

type FormData = z.infer<typeof schema>

const defaultValues: FormData = {
  category_id: '',
  name_en: '',
  name_ar: '',
  visible: true,
}

export function SubCategoriesPage() {
  const categories = useStore((s) => s.categories)
  const subcategories = useStore((s) => s.subcategories)
  const addSubCategory = useStore((s) => s.addSubCategory)
  const updateSubCategory = useStore((s) => s.updateSubCategory)
  const deleteSubCategory = useStore((s) => s.deleteSubCategory)
  const reorderSubCategories = useStore((s) => s.reorderSubCategories)
  const toast = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SubCategory | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('')

  const {
    register,
    handleSubmit,
    reset,
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

  const openEdit = (sc: SubCategory) => {
    setEditing(sc)
    reset({
      category_id: sc.category_id,
      name_en: sc.name_en,
      name_ar: sc.name_ar,
      visible: sc.visible,
    })
    setModalOpen(true)
  }

  const onSave = async (data: FormData) => {
    try {
      const payload = {
        category_id: data.category_id,
        name_en: data.name_en,
        name_ar: data.name_ar,
        visible: data.visible,
        order: subcategories.filter((item) => item.category_id === data.category_id).length,
      }

      if (editing) {
        const updated = await adminAPI.updateSubCategory(editing.id, payload)
        updateSubCategory(editing.id, updated)
        toast('Sub-category updated')
      } else {
        const created = await adminAPI.createSubCategory(payload)
        addSubCategory(created)
        toast('Sub-category added')
      }
    } catch (error) {
      console.error(error)
      toast('Failed to save sub-category', 'error')
    }

    setModalOpen(false)
  }

  const onDelete = async (id: string) => {
    if (confirm('Delete this sub-category? Menu items referencing it will not break but field may become empty.')) {
      try {
        await adminAPI.deleteSubCategory(id)
        deleteSubCategory(id)
        toast('Sub-category deleted', 'error')
      } catch (error) {
        console.error(error)
        toast('Failed to delete sub-category', 'error')
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
    const activeSc = subcategories.find((s) => s.id === active.id)
    const overSc = subcategories.find((s) => s.id === over.id)
    if (!activeSc || !overSc || activeSc.category_id !== overSc.category_id) return

    const inCat = subcategories
      .filter((s) => s.category_id === activeSc.category_id)
      .sort((a, b) => a.order - b.order)

    const oldIndex = inCat.findIndex((s) => s.id === active.id)
    const newIndex = inCat.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const updatedList = [...inCat]
    const [moved] = updatedList.splice(oldIndex, 1)
    updatedList.splice(newIndex, 0, moved)

    reorderSubCategories(activeSc.category_id, oldIndex, newIndex)

    try {
      await Promise.all(
        updatedList.map((sc, idx) => adminAPI.updateSubCategory(sc.id, { order: idx }))
      )
    } catch (error) {
      console.error(error)
      toast('Failed to save sub-category order', 'error')
    }
  }

  const filteredSubs = filterCategory
    ? subcategories.filter((s) => s.category_id === filterCategory)
    : subcategories
  const sortedSubs = [...filteredSubs].sort((a, b) => {
    if (a.category_id !== b.category_id) return 0
    return a.order - b.order
  })

  return (
    <>
      <Header
        title="Sub-Categories"
        subtitle="Manage sub-category groups used by menu items"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add sub-category
          </Button>
        }
      />

      <Card className="mt-6">
        <div className="mb-4 flex gap-4">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-[var(--color-text-primary)]"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name_en}</option>
            ))}
          </select>
        </div>
        {sortedSubs.length === 0 ? (
          <p className="py-8 text-center text-[var(--color-text-secondary)]">No sub-categories yet.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]">
                  <th className="w-10 py-3"></th>
                  <th className="py-3">Category</th>
                  <th className="py-3">Name (EN)</th>
                  <th className="py-3">Name (AR)</th>
                  <th className="py-3">Visibility</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                <SortableContext items={sortedSubs.map((s) => s.id)}>
                  {sortedSubs.map((sc) => {
                    const cat = categories.find((c) => c.id === sc.category_id)
                    return (
                      <SortableSubCategoryRow
                        key={sc.id}
                        sc={sc}
                        categoryName={cat?.name_en ?? '–'}
                        onEdit={openEdit}
                        onDelete={onDelete}
                      />
                    )
                  })}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit sub-category' : 'Add sub-category'}
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
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select {...register('category_id')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]">
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name_en}</option>
              ))}
            </select>
            {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>}
          </div>
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
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('visible')} />
            Visible
          </label>
        </form>
      </Modal>
    </>
  )
}
