import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { ToastProvider } from '@/context/ToastContext'
import { useStore } from '@/store/useStore'
import { adminAPI } from '@/lib/adminAPI'
import { LoginPage } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { MenuLayoutPage } from '@/pages/MenuLayout'
import { BannerPage } from '@/pages/Banner'
import { StoryPage } from '@/pages/Story'
import { CategoriesPage } from '@/pages/Categories'
import { SubCategoriesPage } from '@/pages/SubCategories'
import { CountriesPage } from '@/pages/Countries'
import { MenuItemsPage } from '@/pages/MenuItems'
import { FeaturedPage } from '@/pages/Featured'
import { FiltersPage } from '@/pages/Filters'
import { MediaPage } from '@/pages/Media'
import { SchedulingPage } from '@/pages/Scheduling'
import { TranslationsPage } from '@/pages/Translations'
import { SettingsPage } from '@/pages/Settings'
import { CustomersPage } from '@/pages/Customers'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('authToken')
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function getEffectiveTheme(mode: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return mode
}

function ThemeSync() {
  const themeMode = useStore((s) => s.settings.theme_mode)
  useEffect(() => {
    const theme = getEffectiveTheme(themeMode)
    document.documentElement.dataset.theme = theme
  }, [themeMode])
  useEffect(() => {
    if (themeMode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      document.documentElement.dataset.theme = mq.matches ? 'dark' : 'light'
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [themeMode])
  return null
}

function FaviconSync() {
  const faviconUrl = useStore((s) => s.settings.favicon_url)
  useEffect(() => {
    if (!faviconUrl) return
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = faviconUrl
    link.type = 'image/svg+xml'
  }, [faviconUrl])
  return null
}

function App() {
  const setSections = useStore((s) => s.setSections)
  const setCategories = useStore((s) => s.setCategories)
  const setClassifications = useStore((s) => s.setClassifications)
  const setSubCategories = useStore((s) => s.setSubCategories)
  const setCountries = useStore((s) => s.setCountries)
  const setMenuItems = useStore((s) => s.setMenuItems)
  const setBanner = useStore((s) => s.setBanner)
  const setStory = useStore((s) => s.setStory)
  const setSettings = useStore((s) => s.setSettings)
  const setFilters = useStore((s) => s.setFilters)
  const currentFilters = useStore((s) => s.filters)
  const setMedia = useStore((s) => s.setMedia)

  useEffect(() => {
    const load = async () => {
      try {
        // Auto-login if credentials are provided and not already authenticated
        const shouldAutoLogin = !localStorage.getItem('authToken') && import.meta.env.VITE_ADMIN_EMAIL && import.meta.env.VITE_ADMIN_PASSWORD
        if (shouldAutoLogin) {
          await adminAPI.login(import.meta.env.VITE_ADMIN_EMAIL, import.meta.env.VITE_ADMIN_PASSWORD)
        }

        const [sections, categories, classifications, subcategories, countries, menuItems, banner, story, settings, filters, media] = await Promise.all([
          adminAPI.getMenuSections(),
          adminAPI.getCategories(),
          adminAPI.getClassifications(),
          adminAPI.getSubCategories(),
          adminAPI.getCountries(),
          adminAPI.getMenuItems(),
          adminAPI.getBanner(),
          adminAPI.getStory(),
          adminAPI.getSettings(),
          adminAPI.getFilterTags(),
          adminAPI.getMedia(),
        ])

        setSections(sections)
        setCategories(categories)
        setClassifications(classifications)
        setSubCategories(subcategories)
        setCountries(countries)
        setMenuItems(menuItems)
        setBanner(banner)
        setStory(story)
        setSettings(settings)
        if (filters && filters.length > 0) {
          setFilters(filters)
        } else {
          setFilters(currentFilters)
        }
        setMedia(media)
      } catch (error) {
        // Ignore; data will be populated as the user works with the UI.
        console.error('Failed to load initial data', error)
      }
    }

    load()
  }, [setSections, setCategories, setClassifications, setMenuItems, setBanner, setStory, setSettings, setFilters, setMedia])

  return (
    <ToastProvider>
      <ThemeSync />
      <FaviconSync />
      <BrowserRouter basename='/admin'>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="menu-layout" element={<MenuLayoutPage />} />
            <Route path="banner" element={<BannerPage />} />
            <Route path="story" element={<StoryPage />} />
            <Route path="categories" element={<CategoriesPage />} />
             <Route path="subcategories" element={<SubCategoriesPage />} />
            <Route path="countries" element={<CountriesPage />} />
            <Route path="menu-items" element={<MenuItemsPage />} />
            <Route path="featured" element={<FeaturedPage />} />
            <Route path="filters" element={<FiltersPage />} />
            <Route path="media" element={<MediaPage />} />
            <Route path="scheduling" element={<SchedulingPage />} />
            <Route path="translations" element={<TranslationsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
