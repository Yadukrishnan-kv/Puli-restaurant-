import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/store/useStore'
import { useToast } from '@/context/ToastContext'
import { adminAPI } from '@/lib/adminAPI'
import type { MenuItem as MenuItemType } from '@/types'

export function FeaturedPage() {
  const { menuItems, updateMenuItem, categories } = useStore()
  const toast = useToast()
  const [filter, setFilter] = useState<'chef_special' | 'popular' | 'recommended'>('chef_special')

  const getCatName = (id: string) => categories.find((c) => c.id === id)?.name_en ?? '–'
  const byBadge = {
    chef_special: menuItems.filter((m) => m.chef_special),
    popular: menuItems.filter((m) => m.popular),
    recommended: menuItems.filter((m) => m.recommended),
  }
  const list = byBadge[filter]

  const toggleBadge = async (item: MenuItemType, badge: 'chef_special' | 'popular' | 'recommended') => {
    try {
      const updated = await adminAPI.updateMenuItem(item.id, { [badge]: !item[badge] })
      updateMenuItem(item.id, updated)
      toast(item[badge] ? `Removed ${badge} from ${item.name_en}` : `Added ${badge} to ${item.name_en}`)
    } catch (error) {
      console.error(error)
      toast('Failed to update badge', 'error')
    }
  }

  return (
    <>
      <Header
        title="Featured Dishes"
        subtitle="Highlight dishes with Chef Special, Popular, or Recommended badges"
      />

      <Card className="mt-8">
        <div className="mb-6 flex gap-2">
          {(['chef_special', 'popular', 'recommended'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                filter === key
                  ? 'bg-[var(--color-accent-primary)] text-[var(--color-background-primary)]'
                  : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
              }`}
            >
              {key.replace('_', ' ')}
            </button>
          ))}
        </div>
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          These badges appear on the frontend menu. Toggle them per dish from here or from Menu Items.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-sm text-[var(--color-text-secondary)]">
                <th className="py-3">Image</th>
                <th className="py-3">Dish</th>
                <th className="py-3">Category</th>
                <th className="py-3">Badge</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id} className="border-b border-[var(--color-border)]">
                  <td className="py-3">
                    {item.image ? (
                      <img src={item.image} alt="" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-[var(--color-border)]" />
                    )}
                  </td>
                  <td className="py-3 font-medium text-[var(--color-text-primary)]">{item.name_en}</td>
                  <td className="py-3 text-[var(--color-text-secondary)]">{getCatName(item.category_id)}</td>
                  <td className="py-3">
                    <Button
                      size="sm"
                      variant={item[filter] ? 'primary' : 'secondary'}
                      onClick={() => toggleBadge(item, filter)}
                    >
                      {item[filter] ? 'On' : 'Off'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && (
          <p className="py-6 text-center text-[var(--color-text-secondary)]">No dishes with this badge yet. Add from Menu Items.</p>
        )}
      </Card>
    </>
  )
}
