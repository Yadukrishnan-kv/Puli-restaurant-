import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { useStore } from '@/store/useStore'

export function TranslationsPage() {
  const { categories, menuItems, story, banner } = useStore()

  return (
    <>
      <Header
        title="Translations"
        subtitle="English and Arabic content. Edit in respective sections (Categories, Menu Items, Story)."
      />

      <Card className="mt-8">
        <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
          All editable fields support English and Arabic. Arabic displays in RTL on the frontend. 
          Use Categories, Menu Items, Story, and Filters to edit bilingual content.
        </p>
        <div className="space-y-6">
          <section>
            <h3 className="mb-2 font-semibold text-[var(--color-text-primary)]">Banner</h3>
            <p><strong>EN:</strong> {banner.title} — {banner.subtitle}</p>
            <p className="mt-1 text-[var(--color-text-secondary)]"><strong>AR:</strong> (Add Arabic in Banner if needed)</p>
          </section>
          <section>
            <h3 className="mb-2 font-semibold text-[var(--color-text-primary)]">Story</h3>
            <p><strong>EN:</strong> {story.title}</p>
            <p className="mt-1 truncate text-[var(--color-text-secondary)]">{story.description.slice(0, 100)}…</p>
          </section>
          <section>
            <h3 className="mb-2 font-semibold text-[var(--color-text-primary)]">Categories ({categories.length})</h3>
            <ul className="list-inside list-disc text-sm">
              {categories.slice(0, 5).map((c) => (
                <li key={c.id}>{c.name_en} / {c.name_ar || '–'}</li>
              ))}
              {categories.length > 5 && <li>… and {categories.length - 5} more</li>}
            </ul>
          </section>
          <section>
            <h3 className="mb-2 font-semibold text-[var(--color-text-primary)]">Menu items ({menuItems.length})</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">Each dish has name_en, name_ar, description_en, description_ar in Menu Items.</p>
          </section>
        </div>
      </Card>
    </>
  )
}
