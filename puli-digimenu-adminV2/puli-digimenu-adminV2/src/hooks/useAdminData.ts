import { useEffect, useState } from 'react'
import { adminAPI } from '@/lib/adminAPI'
import { useStore } from '@/store/useStore'

interface UseAdminDataOptions {
  autoLoad?: boolean
}

/**
 * Hook to load data from backend API into Zustand store
 * Usage: useAdminData()
 */
export function useAdminData(options: UseAdminDataOptions = {}) {
  const { autoLoad = true } = options

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Store setters
  const setSections = useStore((s) => s.setSections)
  const setCategories = useStore((s) => s.setCategories)
  const setClassifications = useStore((s) => s.setClassifications)
  const setSubCategories = useStore((s) => s.setSubCategories)
  const setCountries = useStore((s) => s.setCountries)
  const setMenuItems = useStore((s) => s.setMenuItems)
  const setFilters = useStore((s) => s.setFilters)
  const setBanner = useStore((s) => s.setBanner)
  const setStory = useStore((s) => s.setStory)
  const setSettings = useStore((s) => s.setSettings)

  // Check if logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    setIsLoggedIn(!!token)
    if (token) {
      adminAPI.setToken(token)
    }
  }, [])

  // Load all data
  const loadAllData = async () => {
    if (!isLoggedIn) {
      setError('Not logged in')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [sections, categories, classifications, subcategories, countries, items, tags, banner, story, settings] = await Promise.all([
        adminAPI.getMenuSections(),
        adminAPI.getCategories(),
        adminAPI.getClassifications(),
        adminAPI.getSubCategories(),
        adminAPI.getCountries(),
        adminAPI.getMenuItems(),
        adminAPI.getFilterTags(),
        adminAPI.getBanner(),
        adminAPI.getStory(),
        adminAPI.getSettings(),
      ])

      // Update store
      setSections(sections)
      setCategories(categories)
      setClassifications(classifications)
      setSubCategories(subcategories)
      setCountries(countries)
      setMenuItems(items)
      setFilters(tags)
      setBanner(banner)
      setStory(story)
      setSettings(settings)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data'
      setError(message)
      console.error('Failed to load admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Login handler
  const handleLogin = async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    try {
      await adminAPI.login(email, password)
      setIsLoggedIn(true)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      console.error('Login error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Logout handler
  const handleLogout = () => {
    adminAPI.clearToken()
    setIsLoggedIn(false)
    setError(null)
  }

  // Auto-load on mount if logged in
  useEffect(() => {
    if (autoLoad && isLoggedIn) {
      loadAllData()
    }
  }, [autoLoad, isLoggedIn])

  return {
    loading,
    error,
    isLoggedIn,
    loadAllData,
    handleLogin,
    handleLogout,
  }
}

/**
 * Hook for creating/updating items with optimistic updates
 */
export function useAdminMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Menu items
  const createMenuItem = async (item: Parameters<typeof adminAPI.createMenuItem>[0]) => {
    setLoading(true)
    setError(null)
    try {
      return await adminAPI.createMenuItem(item)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create item'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateMenuItem = async (id: string, data: Parameters<typeof adminAPI.updateMenuItem>[1]) => {
    setLoading(true)
    setError(null)
    try {
      return await adminAPI.updateMenuItem(id, data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update item'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteMenuItem = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      return await adminAPI.deleteMenuItem(id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete item'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Categories
  const createCategory = async (category: Parameters<typeof adminAPI.createCategory>[0]) => {
    setLoading(true)
    setError(null)
    try {
      return await adminAPI.createCategory(category)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create category'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateCategory = async (id: string, data: Parameters<typeof adminAPI.updateCategory>[1]) => {
    setLoading(true)
    setError(null)
    try {
      return await adminAPI.updateCategory(id, data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update category'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteCategory = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      return await adminAPI.deleteCategory(id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete category'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    createCategory,
    updateCategory,
    deleteCategory,
  }
}
