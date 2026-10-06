import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { adminAPI } from '@/lib/adminAPI'
import {
  LayoutDashboard,
  Layout,
  ImageIcon,
  BookOpen,
  FolderTree,
  Globe,
  UtensilsCrossed,
  Star,
  Tags,
  Library,
  CalendarClock,
  Languages,
  Settings,
  Sun,
  Moon,
  Users,
  LogOut,
} from 'lucide-react'

const BASE = ((import.meta.env.BASE_URL as string) || '/').replace(/\/$/, '')
const LOGO_LIGHT_THEME = `${BASE}/assets/Logo_EN.svg`
const LOGO_DARK_THEME = `${BASE}/assets/Logo_lgt_EN.svg`

function useEffectiveTheme(): 'light' | 'dark' {
  const themeMode = useStore((s) => s.settings.theme_mode)
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  useEffect(() => {
    if (themeMode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setSystemDark(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [themeMode])
  if (themeMode === 'dark') return 'dark'
  if (themeMode === 'light') return 'light'
  return systemDark ? 'dark' : 'light'
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/menu-layout', icon: Layout, label: 'Menu layout' },
  { to: '/banner', icon: ImageIcon, label: 'Banner' },
  { to: '/story', icon: BookOpen, label: 'Story Section' },
  { to: '/categories', icon: FolderTree, label: 'Categories' },
   { to: '/subcategories', icon: FolderTree, label: 'Sub-Categories' },
  { to: '/countries', icon: Globe, label: 'Countries' },
  { to: '/menu-items', icon: UtensilsCrossed, label: 'Menu Items' },
  { to: '/featured', icon: Star, label: 'Featured Dishes' },
  { to: '/filters', icon: Tags, label: 'Filters & Tags' },
  { to: '/media', icon: Library, label: 'Media Library' },
  { to: '/scheduling', icon: CalendarClock, label: 'Menu Scheduling' },
  { to: '/translations', icon: Languages, label: 'Translations' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const effectiveTheme = useEffectiveTheme()
  const setSettings = useStore((s) => s.setSettings)
  const isDark = effectiveTheme === 'dark'

  const logoUrl = effectiveTheme === 'dark' ? LOGO_DARK_THEME : LOGO_LIGHT_THEME

  const toggleTheme = () => {
    setSettings({ theme_mode: isDark ? 'light' : 'dark' })
  }

  const handleLogout = () => {
    adminAPI.clearToken()
    navigate('/login')
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <motion.aside
        initial={false}
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[var(--color-border)] bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] transition-transform duration-200 ease-in-out md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-[var(--color-border)] px-4">
          <NavLink to="/" className="flex items-center gap-2" onClick={onClose}>
            {logoUrl ? (
              <img src={logoUrl} alt="PULI" className="h-8 w-auto max-w-[140px] object-contain" />
            ) : (
              <span className="text-lg font-semibold text-[var(--color-text-primary)]">PULI Admin</span>
            )}
          </NavLink>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--color-surface-elevated)] text-[var(--color-accent-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]'
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[var(--color-border)] p-3 space-y-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? (
              <Sun className="h-5 w-5 shrink-0" />
            ) : (
              <Moon className="h-5 w-5 shrink-0" />
            )}
            <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-red-500/10 hover:text-red-600"
            title="Sign out"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </motion.aside>
    </>
  )
}
