import { useState, useRef, useCallback } from 'react'
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
import { GripVertical, Pencil, Trash2, Plus, Copy, Eye, EyeOff, Upload } from 'lucide-react'

import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ImageUpload } from '@/components/forms/ImageUpload'
import { useStore } from '@/store/useStore'
import { useToast } from '@/context/ToastContext'
import { adminAPI } from '@/lib/adminAPI'
import { resolveMenuHierarchy } from '@/lib/hierarchyResolver'
import * as XLSX from 'xlsx'
import type { MenuItem as MenuItemType } from '@/types'

const schema = z.object({
  name_en: z.string().min(1, 'Name (EN) required'),
  name_ar: z.string(),
  description_en: z.string(),
  description_ar: z.string(),
  price: z.coerce.number().min(0),
  category_id: z.string().min(1, 'Category required'),
  subcategory_id: z.string().min(1, 'Sub-category is required'),
  country_id: z.string(),
  tags: z.string(),
  calories: z.union([z.string().min(0), z.number()]).transform((v) => (v === '' ? null : v)),
  allergens: z.string(),
  visible: z.boolean(),
  chef_special: z.boolean(),
  popular: z.boolean(),
  recommended: z.boolean(),
  available_from: z.string().nullable(),
  available_to: z.string().nullable(),
  available_days: z.string(),
})

type FormData = z.infer<typeof schema>

function SortableMenuItemRow({
  item,
  categoryName,
  subcategoryName,
  countryName,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleVisible,
}: {
  item: MenuItemType
  categoryName: string
  subcategoryName: string
  countryName: string
  onEdit: (i: MenuItemType) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onToggleVisible: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-[var(--color-border)] ${isDragging ? 'opacity-50' : ''} ${!item.visible ? 'opacity-60' : ''}`}
    >
      <td className="w-10 cursor-grab py-3" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-[var(--color-text-secondary)]" />
      </td>
      <td className="py-3">
        {item.image ? (
          <img src={item.image} alt="" className="h-10 w-10 rounded object-cover" />
        ) : (
          <div className="h-10 w-10 rounded bg-[var(--color-border)]" />
        )}
      </td>
      <td className="py-3 font-medium text-[var(--color-text-primary)]">{item.name_en}</td>
      <td className="py-3 text-[var(--color-text-secondary)]">{categoryName}</td>
      <td className="py-3 text-[var(--color-text-secondary)]">{subcategoryName}</td>
      <td className="py-3 text-[var(--color-text-secondary)]">{countryName}</td>
      <td className="py-3 font-mono text-[var(--color-text-secondary)]">{Number(item.price) > 0 ? item.price : 'As Per Size'}</td>
      <td className="py-3">
        <div className="flex gap-1">
          {item.chef_special && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs dark:bg-amber-900/30">Chef</span>
          )}
          {item.popular && (
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs dark:bg-blue-900/30">Popular</span>
          )}
          {item.recommended && (
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs dark:bg-emerald-900/30">Rec</span>
          )}
        </div>
      </td>
      <td className="py-3">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDuplicate(item.id)}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onToggleVisible(item.id)}>
            {item.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

export function MenuItemsPage() {
  const { categories, subcategories, classifications, sections, countries, menuItems, addMenuItem, updateMenuItem, deleteMenuItem, reorderMenuItems } = useStore()
  const toast = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MenuItemType | null>(null)
  const [image, setImage] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('')

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importRows, setImportRows] = useState<Record<string, string>[]>([])
  const [importColumns, setImportColumns] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<Array<{ row: number; name: string; status: string; message: string }>>([])

  const MENUITEM_FIELDS = [
    { value: '', label: '— Skip column —' },
    { value: 'name_en', label: 'Name (EN) *' },
    { value: 'name_ar', label: 'Name (AR)' },
    { value: 'description_en', label: 'Description (EN)' },
    { value: 'description_ar', label: 'Description (AR)' },
    { value: 'price', label: 'Price *' },
    { value: 'category', label: 'Category (name)' },
    { value: 'subcategory', label: 'Sub-category (name)' },
    { value: 'section', label: 'Section (Category, Sub-Category, or Section Heading)' },
    { value: 'country', label: 'Country (name)' },
    { value: 'tags', label: 'Tags (comma-separated)' },
    { value: 'calories', label: 'Calories' },
    { value: 'allergens', label: 'Allergens (comma-separated)' },
    { value: 'visible', label: 'Visible (yes/no, true/false, 1/0)' },
    { value: 'chef_special', label: 'Chef Special (yes/no)' },
    { value: 'popular', label: 'Popular (yes/no)' },
    { value: 'recommended', label: 'Recommended (yes/no)' },
    { value: 'available_from', label: 'Available From (HH:MM)' },
    { value: 'available_to', label: 'Available To (HH:MM)' },
    { value: 'available_days', label: 'Available Days (0-6 comma-separated)' },
    { value: 'image', label: 'Image URL' },
  ]

  const FIELD_ALIASES: Record<string, string> = {
    name: 'name_en', 'name(english)': 'name_en', 'name english': 'name_en', 'dish name': 'name_en',
    'name(arabic)': 'name_ar', 'name arabic': 'name_ar', 'arabic name': 'name_ar',
    description: 'description_en', 'description(english)': 'description_en',
    'description(arabic)': 'description_ar', 'arabic description': 'description_ar',
    'sub category': 'subcategory', subcategory: 'subcategory', 'sub-category': 'subcategory',
    section: 'section', 'menu section': 'section', 'section heading': 'section',
    'menu section heading': 'section',
    calories: 'calories', allergens: 'allergens',
    tags: 'tags', 'dietary tags': 'tags',
    visible: 'visible', 'hide': 'visible', 'show': 'visible',
    'chef special': 'chef_special', chef: 'chef_special',
    popular: 'popular', recommend: 'recommended', recommended: 'recommended',
    'available from': 'available_from', 'available from time': 'available_from', 'start time': 'available_from',
    'available to': 'available_to', 'available to time': 'available_to', 'end time': 'available_to',
    'available days': 'available_days', 'days': 'available_days', 'availability days': 'available_days',
    image: 'image', 'image url': 'image', 'photo': 'image', 'picture': 'image',
  }

  const autoDetectMapping = useCallback((columns: string[]) => {
    const mapping: Record<string, string> = {}
    for (const col of columns) {
      const normalized = col.toLowerCase().replace(/[_-\s]+/g, ' ').trim()
      const matched = FIELD_ALIASES[normalized]
      if (matched) {
        mapping[col] = matched
      } else {
        // Try direct match against field names
        const direct = MENUITEM_FIELDS.find(f => f.value && f.value.replace(/_/g, ' ') === normalized)
        if (direct) {
          mapping[col] = direct.value
        } else {
          mapping[col] = ''
        }
      }
    }
    return mapping
  }, [])

  const parseBool = (v: string | undefined | null): boolean => {
    if (!v) return false
    const s = String(v).trim().toLowerCase()
    return ['yes', 'true', '1', 'y', 'on'].includes(s)
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
      if (data.length === 0) {
        toast('File is empty', 'error')
        return
      }
      const columns = Object.keys(data[0])
      setImportRows(data)
      setImportColumns(columns)
      setColumnMapping(autoDetectMapping(columns))
      setImportModalOpen(true)
    } catch {
      toast('Failed to read file', 'error')
    }
    e.target.value = ''
  }

  const handleImport = async () => {
    const mapping = Object.entries(columnMapping).filter(([_, v]) => v)
    if (!mapping.find(([_, v]) => v === 'name_en')) {
      toast('Map at least the Name (EN) column', 'error')
      return
    }
    setImporting(true)
    const results: Array<{ row: number; name: string; status: string; message: string }> = []
    let success = 0
    let failed = 0

    for (let i = 0; i < importRows.length; i++) {
      const row = importRows[i]
      try {
        const mapped: Record<string, unknown> = {}
        for (const [col, field] of mapping) {
          mapped[field] = row[col] ?? ''
        }

        if (!mapped.name_en) {
          failed++
          results.push({ row: i + 2, name: String(row[importColumns[0]] ?? ''), status: 'Failed', message: 'Name (EN) is empty' })
          continue
        }

        const categoryValue = mapped.category ? String(mapped.category) : undefined
        const subCategoryValue = mapped.subcategory ? String(mapped.subcategory) : undefined
        const sectionValue = mapped.section ? String(mapped.section) : undefined

        // Collect values from unmapped columns for extra hierarchy matching
        const extraValues: string[] = []
        for (const col of importColumns) {
          const field = columnMapping[col]
          if (!field) {
            const val = row[col]
            if (val && String(val).trim()) {
              extraValues.push(String(val))
            }
          }
        }

        const hierarchyResult = resolveMenuHierarchy({
          categoryValue,
          subCategoryValue,
          sectionValue,
          extraValues,
          categories,
          subCategories: subcategories,
          classifications,
          menuSections: sections,
        })

        if (!hierarchyResult.success) {
          failed++
          const productName = String(mapped.name_en ?? '').trim()
          results.push({ row: i + 2, name: productName, status: 'Skipped', message: hierarchyResult.message })
          continue
        }

        if (!hierarchyResult.categoryId) {
          failed++
          const productName = String(mapped.name_en ?? '').trim()
          results.push({ row: i + 2, name: productName, status: 'Skipped', message: 'No valid category could be resolved for this item' })
          continue
        }

        let countryId: string | null = null
        if (mapped.country) {
          const co = countries.find((c) => c.name_en.toLowerCase() === String(mapped.country).trim().toLowerCase())
          if (co) countryId = co.id
        }

        const tags = mapped.tags ? String(mapped.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : []
        const allergens = mapped.allergens ? String(mapped.allergens).split(',').map((a: string) => a.trim()).filter(Boolean) : []
        const availableDays = mapped.available_days
          ? String(mapped.available_days).split(',').map((d: string) => parseInt(d.trim(), 10)).filter((n: number) => !isNaN(n) && n >= 0 && n <= 6)
          : []
        const strPrice = String(mapped.price ?? '').replace(/[^0-9.]/g, '')
        const price = parseFloat(strPrice) || 0

        const payload = {
          name_en: String(mapped.name_en ?? '').trim(),
          name_ar: String(mapped.name_ar ?? '').trim(),
          description_en: String(mapped.description_en ?? '').trim(),
          description_ar: String(mapped.description_ar ?? '').trim(),
          price,
          category_id: hierarchyResult.categoryId,
          subcategory_id: hierarchyResult.subCategoryId,
          classification_id: hierarchyResult.classificationId,
          country_id: countryId,
          image: String(mapped.image ?? ''),
          tags,
          calories: mapped.calories ? String(mapped.calories).trim() : null,
          allergens,
          visible: 'visible' in mapped ? parseBool(String(mapped.visible)) : true,
          chef_special: parseBool(String(mapped.chef_special ?? '')),
          popular: parseBool(String(mapped.popular ?? '')),
          recommended: parseBool(String(mapped.recommended ?? '')),
          available_from: String(mapped.available_from ?? '').trim() || null,
          available_to: String(mapped.available_to ?? '').trim() || null,
          available_days: availableDays,
          order: menuItems.filter((m) => m.category_id === hierarchyResult.categoryId).length + i,
        }

        const created = await adminAPI.createMenuItem(payload)
        addMenuItem(created)
        success++
        results.push({ row: i + 2, name: String(payload.name_en), status: 'Imported', message: hierarchyResult.matchedBy ? `Matched via ${hierarchyResult.matchedBy}` : 'Valid' })
      } catch {
        failed++
        results.push({ row: i + 2, name: String(row[importColumns[0]] ?? ''), status: 'Failed', message: 'API error' })
      }
    }

    setImportResults(results)
    setImportModalOpen(false)
    setImporting(false)
    toast(`Imported: ${success} items${failed > 0 ? `, Skipped/Failed: ${failed}` : ''}`, failed > 0 ? 'error' : undefined)
  }

  const getCatName = (id: string) => categories.find((c) => c.id === id)?.name_en ?? '–'
  const getSubCategoryName = (id: string | null) =>
    id ? subcategories.find((c) => c.id === id)?.name_en ?? '–' : '–'
  const getCountryName = (id: string | null) =>
    id ? countries.find((c) => c.id === id)?.name_en ?? '–' : '–'

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: '',
      price: 0,
      category_id: categories[0]?.id ?? '',
      subcategory_id: (() => {
        const cid = categories[0]?.id ?? ''
        const subs = subcategories.filter((cl) => cl.category_id === cid).sort((a, b) => a.order - b.order)
        return subs[0]?.id ?? ''
      })(),
      country_id: '',
      tags: '',
      calories: null,
      allergens: '',
      visible: true,
      chef_special: false,
      popular: false,
      recommended: false,
      available_from: null,
      available_to: null,
      available_days: '',
    },
  })

  const selectedCategoryId = watch('category_id')
  const subcategoriesForCategory = subcategories
    .filter((cl) => cl.category_id === selectedCategoryId)
    .sort((a, b) => a.order - b.order)

  const openCreate = () => {
    setEditing(null)
    setImage('')
    const firstCategoryId = categories[0]?.id ?? ''
    const firstSubs = subcategories.filter((cl) => cl.category_id === firstCategoryId).sort((a, b) => a.order - b.order)
    reset({
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: '',
      price: 0,
      category_id: firstCategoryId,
      subcategory_id: firstSubs[0]?.id ?? '',
      country_id: '',
      tags: '',
      calories: '' as unknown as number | null,
      allergens: '',
      visible: true,
      chef_special: false,
      popular: false,
      recommended: false,
      available_from: null,
      available_to: null,
      available_days: '',
    })
    setModalOpen(true)
  }

  const openEdit = (item: MenuItemType) => {
    setEditing(item)
    setImage(item.image)
    const subsForCat = subcategories.filter((cl) => cl.category_id === item.category_id).sort((a, b) => a.order - b.order)
    const defaultSubId = item.subcategory_id && subsForCat.some((cl) => cl.id === item.subcategory_id)
      ? item.subcategory_id
      : item.classification_id && subsForCat.some((cl) => cl.id === item.classification_id)
      ? item.classification_id
      : subsForCat[0]?.id ?? ''
    reset({
      name_en: item.name_en,
      name_ar: item.name_ar,
      description_en: item.description_en,
      description_ar: item.description_ar,
      price: item.price,
      category_id: item.category_id,
      subcategory_id: defaultSubId,
      country_id: item.country_id ?? '',
      tags: item.tags.join(', '),
      calories: item.calories,
      allergens: item.allergens.join(', '),
      visible: item.visible,
      chef_special: item.chef_special,
      popular: item.popular,
      recommended: item.recommended,
      available_from: item.available_from,
      available_to: item.available_to,
      available_days: item.available_days.join(','),
    })
    setModalOpen(true)
  }

  const onSave = async (data: FormData) => {
    const tags = data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
    const allergens = data.allergens ? data.allergens.split(',').map((a) => a.trim()).filter(Boolean) : []
    const available_days = data.available_days
      ? data.available_days.split(',').map((d) => parseInt(d.trim(), 10)).filter((n) => !isNaN(n) && n >= 0 && n <= 6)
      : []

    if (subcategoriesForCategory.length === 0) {
      toast('This category has no sub-categories. Add sub-categories first.', 'error')
      return
    }
    const subcategoryId = data.subcategory_id && subcategoriesForCategory.some((cl) => cl.id === data.subcategory_id)
      ? data.subcategory_id
      : subcategoriesForCategory[0]?.id ?? null
    if (!subcategoryId) {
      toast('Please select a sub-category', 'error')
      return
    }

    const countryId = data.country_id || null

    try {
      const payload = {
        name_en: data.name_en,
        name_ar: data.name_ar,
        description_en: data.description_en,
        description_ar: data.description_ar,
        price: data.price,
        category_id: data.category_id,
        subcategory_id: subcategoryId,
        classification_id: null,
        country_id: countryId,
        image,
        tags,
        calories: data.calories ?? null,
        allergens,
        visible: data.visible,
        chef_special: data.chef_special,
        popular: data.popular,
        recommended: data.recommended,
        available_from: data.available_from || null,
        available_to: data.available_to || null,
        available_days,
        order: editing
          ? editing.order
          : menuItems.filter((m) => m.category_id === data.category_id).length,
      }

      if (editing) {
        const updated = await adminAPI.updateMenuItem(editing.id, payload)
        updateMenuItem(editing.id, updated)
        toast('Dish updated')
      } else {
        const created = await adminAPI.createMenuItem(payload)
        addMenuItem(created)
        toast('Dish added')
      }
    } catch (error) {
      console.error(error)
      toast('Failed to save dish', 'error')
    }

    setModalOpen(false)
  }

  const onDelete = async (id: string) => {
    if (confirm('Delete this dish?')) {
      try {
        await adminAPI.deleteMenuItem(id)
        deleteMenuItem(id)
        toast('Dish deleted', 'error')
      } catch (error) {
        console.error(error)
        toast('Failed to delete dish', 'error')
      }
    }
  }

  const onDuplicate = async (id: string) => {
    const item = menuItems.find((m) => m.id === id)
    if (!item) return

    try {
      const duplicate = {
        ...item,
        name_en: `${item.name_en} (Copy)`,
        name_ar: `${item.name_ar} (نسخة)`,
        order: menuItems.filter((m) => m.category_id === item.category_id).length,
      }
      const created = await adminAPI.createMenuItem(duplicate)
      addMenuItem(created)
      toast('Dish duplicated')
    } catch (error) {
      console.error(error)
      toast('Failed to duplicate dish', 'error')
    }
  }

  const onToggleVisible = async (id: string) => {
    const item = menuItems.find((m) => m.id === id)
    if (!item) return

    try {
      const updated = await adminAPI.updateMenuItem(id, { visible: !item.visible })
      updateMenuItem(id, updated)
    } catch (error) {
      console.error(error)
      toast('Failed to update visibility', 'error')
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeItem = menuItems.find((m) => m.id === active.id)
    const overItem = menuItems.find((m) => m.id === over.id)
    if (!activeItem || !overItem || activeItem.category_id !== overItem.category_id) return

    const inCategory = menuItems
      .filter((m) => m.category_id === activeItem.category_id)
      .sort((a, b) => a.order - b.order)

    const oldIndex = inCategory.findIndex((m) => m.id === active.id)
    const newIndex = inCategory.findIndex((m) => m.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const updatedList = [...inCategory]
    const [moved] = updatedList.splice(oldIndex, 1)
    updatedList.splice(newIndex, 0, moved)

    reorderMenuItems(activeItem.category_id, oldIndex, newIndex)

    try {
      await Promise.all(
        updatedList.map((m, idx) =>
          adminAPI.updateMenuItem(m.id, { order: idx })
        )
      )
    } catch (error) {
      console.error(error)
      toast('Failed to save dish order', 'error')
    }
  }

  const filteredItems = filterCategory
    ? menuItems.filter((m) => m.category_id === filterCategory)
    : menuItems
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.category_id !== b.category_id) return 0
    return a.order - b.order
  })


  // Export handler
  const handleExport = () => {
    // Export all fields from menuItems, using names for category, subcategory, and country
    const spiceOrder = ['mild', 'spicy', 'extra spicy'];
    const data = menuItems.map((item) => {
      const category = categories.find((c) => c.id === item.category_id)
      const subcategory = subcategories.find((sc) => sc.id === item.subcategory_id)
      const country = countries.find((co) => co.id === item.country_id)
      // Only include spice tags, sort as Mild, Spicy, Extra Spicy
      const spiceTags = (item.tags || [])
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => spiceOrder.includes(tag))
        .sort((a, b) => spiceOrder.indexOf(a) - spiceOrder.indexOf(b))
        .map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1));

      // Highlights column: Chef Special, Popular, Recommended
      const highlights = [];
      if (item.chef_special) highlights.push('Chef Special');
      if (item.popular) highlights.push('Popular');
      if (item.recommended) highlights.push('Recommended');

      return {
        id: item.id,
        name_en: item.name_en,
        name_ar: item.name_ar,
        description_en: item.description_en,
        description_ar: item.description_ar,
        price: item.price,
        category: category ? category.name_en : item.category_id,
        subcategory: subcategory ? subcategory.name_en : item.subcategory_id,
        country: country ? country.name_en : item.country_id,
        tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags,
        'Spice level': spiceTags.join(', '),
        Highlights: highlights.join(', '),
        calories: item.calories,
        allergens: Array.isArray(item.allergens) ? item.allergens.join(', ') : item.allergens,
        visible: item.visible,
        chef_special: item.chef_special,
        popular: item.popular,
        recommended: item.recommended,
        available_from: item.available_from,
        available_to: item.available_to,
        available_days: Array.isArray(item.available_days) ? item.available_days.join(',') : item.available_days,
        image: item.image,
        order: item.order,
      }
    })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'MenuItems')
    XLSX.writeFile(wb, 'menu_items_export.xlsx')
  }

  return (
    <>
      <Header
        title="Menu Items"
        subtitle="Manage dishes and their order"
        action={
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelected}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} variant="secondary" type="button">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button onClick={handleExport} variant="primary" type="button">
              Export
            </Button>
            <Button onClick={() => openCreate()} disabled={categories.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Add dish
            </Button>
          </div>
        }
      />

      {categories.length === 0 && (
        <Card className="mt-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20">
          <p className="text-amber-800 dark:text-amber-200">Create at least one category before adding dishes.</p>
        </Card>
      )}

      <Card className="mt-8">
        <div className="mb-4 flex gap-4">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-[var(--color-text-primary)]"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_en}
              </option>
            ))}
          </select>
        </div>
        {sortedItems.length === 0 ? (
          <p className="py-8 text-center text-[var(--color-text-secondary)]">No dishes yet.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-sm text-[var(--color-text-secondary)]">
                  <th className="w-10 py-3"></th>
                  <th className="py-3">Image</th>
                  <th className="py-3">Name</th>
                  <th className="py-3">Category</th>
                  <th className="py-3">Sub-category</th>
                  <th className="py-3">Country</th>
                  <th className="py-3">Price</th>
                  <th className="py-3">Badges</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                <SortableContext items={sortedItems.map((m) => m.id)}>
                  {sortedItems.map((item) => (
                    <SortableMenuItemRow
                      key={item.id}
                      item={item}
                      categoryName={getCatName(item.category_id)}
                      subcategoryName={getSubCategoryName(item.subcategory_id ?? item.classification_id ?? null)}
                      countryName={getCountryName(item.country_id ?? null)}
                      onEdit={openEdit}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                      onToggleVisible={onToggleVisible}
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
        title={editing ? 'Edit dish' : 'Add dish'}
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSave)}>Save</Button>
          </div>
        }
      >
        <form id="dish-form" onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Name (EN)</label>
              <input {...register('name_en')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" />
              {errors.name_en && <p className="mt-1 text-sm text-red-600">{errors.name_en.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Name (AR)</label>
              <input {...register('name_ar')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Description (EN)</label>
              <textarea {...register('description_en')} rows={2} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description (AR)</label>
              <textarea {...register('description_ar')} rows={2} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Price</label>
              <input type="number" step="0.01" min="0" placeholder="Leave blank or 0 for 'As Per Size'" {...register('price')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" />
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Enter 0 (or leave blank) to show &ldquo;As Per Size&rdquo; on the menu.</p>
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select
                {...register('category_id', {
                  onChange: () => {
                    const next = watch('category_id')
                    const nextSubs = subcategories.filter((cl) => cl.category_id === next).sort((a, b) => a.order - b.order)
                    setValue('subcategory_id', nextSubs[0]?.id ?? '')
                  },
                })}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name_en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Sub-category (required)</label>
              <select
                {...register('subcategory_id')}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
              >
                {subcategoriesForCategory.length === 0 ? (
                  <option value="">— Add sub-categories first —</option>
                ) : (
                  subcategoriesForCategory.map((cl) => (
                    <option key={cl.id} value={cl.id}>{cl.name_en}</option>
                  ))
                )}
              </select>
              {subcategoriesForCategory.length === 0 && (
                <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                  Add sub-categories in Sub-Categories section first.
                </p>
              )}
              {errors.subcategory_id && (
                <p className="mt-1 text-sm text-red-600">{errors.subcategory_id.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Country (optional)</label>
              <select
                {...register('country_id')}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
              >
                <option value="">Select country</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name_en}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Dish image</label>
            <ImageUpload value={image} onChange={setImage} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Tags (comma-separated)</label>
              <input {...register('tags')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" placeholder="e.g. Spicy, Vegan" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Calories</label>
              <input type="text" {...register('calories')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" placeholder="e.g. 100 or 100-200" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Allergens (comma-separated)</label>
            <input {...register('allergens')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" placeholder="e.g. Nuts, Dairy" />
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('visible')} className="h-4 w-4 rounded" />
              Visible
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('chef_special')} className="h-4 w-4 rounded" />
              Chef Special
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('popular')} className="h-4 w-4 rounded" />
              Popular
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('recommended')} className="h-4 w-4 rounded" />
              Recommended
            </label>
          </div>
          <div className="border-t border-[var(--color-border)] pt-4">
            <p className="mb-2 text-sm font-medium">Availability (optional)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm">Available from (time)</label>
                <input type="time" {...register('available_from')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Available to (time)</label>
                <input type="time" {...register('available_to')} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" />
              </div>
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Available days: 0=Sun, 1=Mon, ... 6=Sat (comma-separated, e.g. 1,2,3,4,5)</p>
            <input {...register('available_days')} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]" placeholder="e.g. 1,2,3,4,5" />
          </div>
        </form>
      </Modal>

      <Modal
        open={importModalOpen}
        onClose={() => { if (!importing) setImportModalOpen(false) }}
        title="Import Menu Items"
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setImportModalOpen(false)} disabled={importing}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? `Importing... (0/${importRows.length})` : `Import ${importRows.length} items`}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Map each column from your file to a menu item field. Fields marked with * are required.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="py-2 pr-4 text-left font-medium text-[var(--color-text-primary)]">File Column</th>
                  <th className="py-2 text-left font-medium text-[var(--color-text-primary)]">Maps To</th>
                  <th className="py-2 pl-4 text-left font-medium text-[var(--color-text-primary)]">Preview</th>
                </tr>
              </thead>
              <tbody>
                {importColumns.map((col) => (
                  <tr key={col} className="border-b border-[var(--color-border)]">
                    <td className="py-2 pr-4 font-medium text-[var(--color-text-primary)]">{col}</td>
                    <td className="py-2">
                      <select
                        value={columnMapping[col] ?? ''}
                        onChange={(e) => setColumnMapping((prev) => ({ ...prev, [col]: e.target.value }))}
                        className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2 py-1 text-sm text-[var(--color-text-primary)]"
                      >
                        {MENUITEM_FIELDS.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="max-w-[200px] truncate py-2 pl-4 text-[var(--color-text-secondary)]">
                      {importRows[0]?.[col] ?? ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium text-[var(--color-text-secondary)]">
              Preview first {Math.min(3, importRows.length)} row(s)
            </summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    {importColumns.map((col) => (
                      <th key={col} className="px-2 py-1 text-left font-medium text-[var(--color-text-secondary)]">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importRows.slice(0, 3).map((row, ri) => (
                    <tr key={ri} className="border-b border-[var(--color-border)]">
                      {importColumns.map((col) => (
                        <td key={col} className="max-w-[150px] truncate px-2 py-1 text-[var(--color-text-primary)]">{row[col] ?? ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          {importResults.length > 0 && (
            <div className="mt-4">
              <details open className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-[var(--color-text-secondary)]">
                  Import Results: {importResults.filter((r) => r.status === 'Imported').length} imported, {importResults.filter((r) => r.status !== 'Imported').length} skipped/failed
                </summary>
                <div className="mt-2 overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--color-border)]">
                        <th className="px-2 py-1 text-left font-medium text-[var(--color-text-secondary)]">Row</th>
                        <th className="px-2 py-1 text-left font-medium text-[var(--color-text-secondary)]">Product</th>
                        <th className="px-2 py-1 text-left font-medium text-[var(--color-text-secondary)]">Status</th>
                        <th className="px-2 py-1 text-left font-medium text-[var(--color-text-secondary)]">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResults.map((r, ri) => (
                        <tr key={ri} className="border-b border-[var(--color-border)]">
                          <td className="px-2 py-1 text-[var(--color-text-primary)]">{r.row}</td>
                          <td className="px-2 py-1 text-[var(--color-text-primary)]">{r.name}</td>
                          <td className="px-2 py-1">
                            {r.status === 'Imported' ? (
                              <span className="text-emerald-600">{r.status}</span>
                            ) : r.status === 'Skipped' ? (
                              <span className="text-amber-600">{r.status}</span>
                            ) : (
                              <span className="text-red-600">{r.status}</span>
                            )}
                          </td>
                          <td className="px-2 py-1 text-[var(--color-text-secondary)]">{r.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
