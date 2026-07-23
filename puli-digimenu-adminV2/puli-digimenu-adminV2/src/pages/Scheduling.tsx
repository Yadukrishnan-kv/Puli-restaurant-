import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { useStore } from '@/store/useStore'
import { DAYS } from '@/lib/utils'

export function SchedulingPage() {
  const menuItems = useStore((s) => s.menuItems)
  const categories = useStore((s) => s.categories)
  const getCatName = (id: string) => categories.find((c) => c.id === id)?.name_en ?? '–'

  const withSchedule = menuItems.filter(
    (m) => m.available_from || m.available_to || (m.available_days && m.available_days.length > 0)
  )

  const dayLabel = (day: number) => DAYS.find((d) => d.value === day)?.label ?? `Day ${day}`

  return (
    <>
      <Header
        title="Menu Scheduling"
        subtitle="Items with time or day restrictions appear here. Edit in Menu Items."
      />

      <Card className="mt-8">
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          Set &quot;Available From&quot;, &quot;Available To&quot;, and &quot;Available Days&quot; on each dish in Menu Items. 
          The frontend will hide items outside their schedule.
        </p>
        {withSchedule.length === 0 ? (
          <p className="py-8 text-center text-[var(--color-text-secondary)]">
            No items have scheduling yet. Edit dishes in Menu Items to set availability.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-sm text-[var(--color-text-secondary)]">
                  <th className="py-3">Dish</th>
                  <th className="py-3">Category</th>
                  <th className="py-3">From</th>
                  <th className="py-3">To</th>
                  <th className="py-3">Days</th>
                </tr>
              </thead>
              <tbody>
                {withSchedule.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--color-border)]">
                    <td className="py-3 font-medium text-[var(--color-text-primary)]">{item.name_en}</td>
                    <td className="py-3 text-[var(--color-text-secondary)]">{getCatName(item.category_id)}</td>
                    <td className="py-3 font-mono text-sm">{item.available_from ?? '–'}</td>
                    <td className="py-3 font-mono text-sm">{item.available_to ?? '–'}</td>
                    <td className="py-3 text-sm">
                      {item.available_days?.length
                        ? item.available_days.map(dayLabel).join(', ')
                        : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
