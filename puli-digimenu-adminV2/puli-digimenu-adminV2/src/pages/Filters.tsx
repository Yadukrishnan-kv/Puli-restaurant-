import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useStore } from '@/store/useStore'
import { useToast } from '@/context/ToastContext'
import { adminAPI } from '@/lib/adminAPI'
import { Pencil, Tag } from 'lucide-react'
import { useState } from 'react'
import type { FilterTag } from '@/types'

export function FiltersPage() {
  const filters = useStore((s) => s.filters)
  const updateFilter = useStore((s) => s.updateFilter)
  const toast = useToast()
  const [editing, setEditing] = useState<FilterTag | null>(null)
  const [labelEn, setLabelEn] = useState('')
  const [labelAr, setLabelAr] = useState('')
  const [enabled, setEnabled] = useState(true)

  const openEdit = (f: FilterTag) => {
    setEditing(f)
    setLabelEn(f.label_en)
    setLabelAr(f.label_ar)
    setEnabled(f.enabled)
  }

  const saveEdit = async () => {
    if (!editing) return
    try {
      const updated = await adminAPI.updateFilterTag(editing.id, { label_en: labelEn, label_ar: labelAr, enabled })
      updateFilter(editing.id, updated)
      toast('Filter updated')
      setEditing(null)
    } catch (error) {
      console.error(error)
      toast('Failed to update filter', 'error')
    }
  }

  const toggleEnabled = async (f: FilterTag) => {
    try {
      const updated = await adminAPI.updateFilterTag(f.id, { enabled: !f.enabled })
      updateFilter(f.id, updated)
      toast(f.enabled ? 'Filter disabled' : 'Filter enabled')
    } catch (error) {
      console.error(error)
      toast('Failed to update filter', 'error')
    }
  }

  const badges = filters.filter((f) => f.type === 'badge')
  const allergens = filters.filter((f) => f.type === 'allergen')

  return (
    <>
      <Header
        title="Filters & Tags"
        subtitle="Menu filters and allergen tags (e.g. Chef Special, Dairy, Nuts)"
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">Badge filters</h3>
          <ul className="space-y-2">
            {badges.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-[var(--color-text-secondary)]" />
                  <span className="font-medium">{f.label_en}</span>
                  <span className="text-sm text-[var(--color-text-secondary)]">/ {f.label_ar}</span>
                </div>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={f.enabled}
                      onChange={() => toggleEnabled(f)}
                    />
                    Enabled
                  </label>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(f)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">Allergen filters</h3>
          <ul className="space-y-2">
            {allergens.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-[var(--color-text-secondary)]" />
                  <span className="font-medium">{f.label_en}</span>
                  <span className="text-sm text-[var(--color-text-secondary)]">/ {f.label_ar}</span>
                </div>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={f.enabled}
                      onChange={() => toggleEnabled(f)}
                    />
                    Enabled
                  </label>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(f)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit filter"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </div>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Label (English)</label>
              <input
                value={labelEn}
                onChange={(e) => setLabelEn(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Label (Arabic)</label>
              <input
                value={labelAr}
                onChange={(e) => setLabelAr(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text-primary)]"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Enabled
            </label>
          </div>
        )}
      </Modal>
    </>
  )
}
