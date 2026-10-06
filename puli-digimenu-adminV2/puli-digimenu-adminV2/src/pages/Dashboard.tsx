import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FolderTree, UtensilsCrossed, Star, Clock, Plus, Upload, ImageIcon } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

function StatLink({
  to,
  children,
  className,
}: {
  to: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  )
}

const statCards = [
  {
    key: 'categories',
    label: 'Total Categories',
    icon: FolderTree,
    path: '/categories',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    key: 'dishes',
    label: 'Total Dishes',
    icon: UtensilsCrossed,
    path: '/menu-items',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'featured',
    label: 'Featured Dishes',
    icon: Star,
    path: '/featured',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    key: 'recent',
    label: 'Recently Updated',
    icon: Clock,
    path: '/menu-items',
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
]

export function Dashboard() {
  const categories = useStore((s) => s.categories)
  const menuItems = useStore((s) => s.menuItems)
  const featuredCount = menuItems.filter(
    (m) => m.chef_special || m.popular || m.recommended
  ).length

  const stats = {
    categories: categories.length,
    dishes: menuItems.length,
    featured: featuredCount,
    recent: menuItems.length, // could filter by updatedAt if we add it
  }

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Overview of your menu content"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" to="/categories">
              <Plus className="mr-2 h-4 w-4" />
              Add category
            </Button>
            <Button size="sm" to="/menu-items">
              <UtensilsCrossed className="mr-2 h-4 w-4" />
              Add dish
            </Button>
            <Button variant="ghost" size="sm" to="/media">
              <Upload className="mr-2 h-4 w-4" />
              Upload image
            </Button>
          </div>
        }
      />

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <StatLink to={card.path}>
              <Card className="transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                      {card.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)]">
                      {stats[card.key as keyof typeof stats]}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-xl',
                      card.color
                    )}
                  >
                    <card.icon className="h-6 w-6" />
                  </div>
                </div>
              </Card>
            </StatLink>
          </motion.div>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Where to add content</CardTitle>
        </CardHeader>
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          Use these links to add or edit each part of your menu.
        </p>
        <ol className="list-inside list-decimal space-y-2 text-sm">
          <li>
            <strong className="text-[var(--color-text-primary)]">Hero slider</strong> (top images) →{' '}
            <Link to="/banner" className="font-medium text-[var(--color-accent-primary)] hover:underline">
              Banner
            </Link>
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)]">PULI intro</strong> (story text) →{' '}
            <Link to="/story" className="font-medium text-[var(--color-accent-primary)] hover:underline">
              Story Section
            </Link>
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)]">Section headings</strong> (e.g. Main Menu, Special Menu, Breakfast, Happy Hour) and{' '}
            <strong className="text-[var(--color-text-primary)]">categories</strong> (Food Menu | Beverages | Desserts) →{' '}
            <Link to="/menu-layout" className="font-medium text-[var(--color-accent-primary)] hover:underline">
              Menu layout
            </Link>
            {' '}— use “Add section heading” to add new headings anytime.
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)]">Sub-categories</strong> (Soup, Main course, Rice, etc. under each category) →{' '}
            <Link to="/categories" className="font-medium text-[var(--color-accent-primary)] hover:underline">
              Categories
            </Link>
            {' '}→ Edit a category → add sub-categories at the bottom.
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)]">Dishes</strong> →{' '}
            <Link to="/menu-items" className="font-medium text-[var(--color-accent-primary)] hover:underline">
              Menu Items
            </Link>
            {' '}or use “Manage items” on a category in Menu layout.
          </li>
        </ol>
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-3">
            <Button to="/categories">
              <Plus className="mr-2 h-4 w-4" />
              Add category
            </Button>
            <Button variant="secondary" to="/menu-items">
              <UtensilsCrossed className="mr-2 h-4 w-4" />
              Add dish
            </Button>
            <Button variant="ghost" to="/media">
              <ImageIcon className="mr-2 h-4 w-4" />
              Upload image
            </Button>
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Data export</CardTitle>
          </CardHeader>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Export your menu data as JSON from Settings to use in the frontend or backup.
          </p>
          <div className="mt-4">
            <Button variant="secondary" size="sm" to="/settings">
              Go to Settings
            </Button>
          </div>
        </Card>
      </div>
    </>
  )
}
