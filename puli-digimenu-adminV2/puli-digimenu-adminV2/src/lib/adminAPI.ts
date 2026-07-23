import axios, { AxiosInstance, AxiosError } from 'axios'
import type { MenuSection, Category, Classification, SubCategory, Country, MenuItem, Banner, StorySection, FilterTag, Settings, MediaItem } from '@/types'

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:5000'
const APP_BASE_PATH = ((import.meta.env.BASE_URL as string | undefined) || '/').replace(/\/$/, '')

type RefValue = string | { id?: string; _id?: string } | null | undefined

const ABSOLUTE_URL_REGEX = /^https?:\/\//i

function extractArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    if (typeof obj.error === 'string' && obj.error.trim()) {
      throw new Error(obj.error)
    }

    const candidateKeys = ['data', 'items', 'results', 'rows', 'list']
    for (const key of candidateKeys) {
      const value = obj[key]
      if (Array.isArray(value)) return value as T[]
    }
  }

  return []
}

function extractObject<T>(payload: unknown): T {
  if (payload === null || payload === undefined) return {} as T
  if (typeof payload !== 'object') return {} as T

  const obj = payload as Record<string, unknown>
  if (typeof obj.error === 'string' && obj.error.trim()) {
    throw new Error(obj.error)
  }

  const wrapped = obj.data
  if (wrapped && typeof wrapped === 'object' && !Array.isArray(wrapped)) {
    return wrapped as T
  }

  return payload as T
}

function toAbsoluteAssetUrl(url: string | undefined | null): string {
  if (!url) return ''
  if (ABSOLUTE_URL_REGEX.test(url) || url.startsWith('data:')) return url
  if (url.startsWith('/assets/')) return url

  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
  const path = url.startsWith('/') ? url : `/${url}`
  return `${base}${path}`
}

function normalizeRefId(value: RefValue): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  return value.id ?? value._id ?? null
}

function normalizeCategory(category: Category): Category {
  return {
    ...category,
    image: toAbsoluteAssetUrl(category.image),
  }
}

function normalizeCountry(country: Country): Country {
  return {
    ...country,
    flag_image: toAbsoluteAssetUrl(country.flag_image),
  }
}

function normalizeMenuItem(item: MenuItem): MenuItem {
  return {
    ...item,
    category_id: normalizeRefId(item.category_id as RefValue) ?? '',
    subcategory_id: normalizeRefId(item.subcategory_id as RefValue),
    classification_id: normalizeRefId(item.classification_id as RefValue),
    country_id: normalizeRefId(item.country_id as RefValue),
    image: toAbsoluteAssetUrl(item.image),
  }
}

class AdminAPIClient {
  private client: AxiosInstance
  private token: string | null = null
  private hasRedirectedForUnauthorized = false

  constructor(baseURL = API_BASE_URL) {
    this.loadToken()

    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor: Add auth token to every request
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers['Authorization'] = `Bearer ${this.token}`
      }
      return config
    })

    // Response interceptor: Handle 401 errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.clearToken()
          const requestUrl = error.config?.url || ''
          if (!requestUrl.includes('/api/auth/login')) {
            this.redirectToLogin()
          }
        }
        throw error
      }
    )
  }

  private redirectToLogin() {
    if (typeof window === 'undefined' || this.hasRedirectedForUnauthorized) return

    const loginPath = `${APP_BASE_PATH}/login` || '/login'
    const currentPath = window.location.pathname
    if (currentPath === loginPath) return

    this.hasRedirectedForUnauthorized = true
    window.location.assign(loginPath)
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken')
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
    }
  }

  // ============ AUTHENTICATION ============

  async login(email: string, password: string) {
    const response = await this.client.post<{ token: string; user: { id: string; email: string } }>(
      '/api/auth/login',
      { email, password }
    )
    this.setToken(response.data.token)
    return response.data
  }

  // ============ MENU SECTIONS ============

  async getMenuSections() {
    const response = await this.client.get<unknown>('/api/menu-sections')
    return extractArray<MenuSection>(response.data)
  }

  async createMenuSection(section: Omit<MenuSection, 'id'>) {
    const response = await this.client.post<MenuSection>('/api/menu-sections', section)
    return response.data
  }

  async updateMenuSection(id: string, section: Partial<MenuSection>) {
    const response = await this.client.put<MenuSection>(`/api/menu-sections/${id}`, section)
    return response.data
  }

  async deleteMenuSection(id: string) {
    await this.client.delete(`/api/menu-sections/${id}`)
  }

  // ============ CATEGORIES ============

  async getCategories() {
    const response = await this.client.get<unknown>('/api/categories')
    return extractArray<Category>(response.data).map(normalizeCategory)
  }

  async createCategory(category: Omit<Category, 'id'>) {
    const response = await this.client.post<Category>('/api/categories', category)
    return normalizeCategory(response.data)
  }

  async updateCategory(id: string, category: Partial<Category>) {
    const response = await this.client.put<Category>(`/api/categories/${id}`, category)
    return normalizeCategory(response.data)
  }

  async deleteCategory(id: string) {
    await this.client.delete(`/api/categories/${id}`)
  }

  // ============ CLASSIFICATIONS ============

  async getClassifications() {
    const response = await this.client.get<unknown>('/api/classifications')
    return extractArray<Classification>(response.data)
  }

  async createClassification(classification: Omit<Classification, 'id'>) {
    const response = await this.client.post<Classification>('/api/classifications', classification)
    return response.data
  }

  async updateClassification(id: string, classification: Partial<Classification>) {
    const response = await this.client.put<Classification>(`/api/classifications/${id}`, classification)
    return response.data
  }

  async deleteClassification(id: string) {
    await this.client.delete(`/api/classifications/${id}`)
  }

  // ============ SUBCATEGORIES ============

  async getSubCategories() {
    const response = await this.client.get<unknown>('/api/subcategories')
    return extractArray<SubCategory>(response.data)
  }

  async createSubCategory(subcategory: Omit<SubCategory, 'id'>) {
    const response = await this.client.post<SubCategory>('/api/subcategories', subcategory)
    return response.data
  }

  async updateSubCategory(id: string, subcategory: Partial<SubCategory>) {
    const response = await this.client.put<SubCategory>(`/api/subcategories/${id}`, subcategory)
    return response.data
  }

  async deleteSubCategory(id: string) {
    await this.client.delete(`/api/subcategories/${id}`)
  }

  // ============ COUNTRIES ============

  async getCountries() {
    const response = await this.client.get<unknown>('/api/countries')
    return extractArray<Country>(response.data).map(normalizeCountry)
  }

  async createCountry(country: Omit<Country, 'id'>) {
    const response = await this.client.post<Country>('/api/countries', country)
    return normalizeCountry(response.data)
  }

  async updateCountry(id: string, country: Partial<Country>) {
    const response = await this.client.put<Country>(`/api/countries/${id}`, country)
    return normalizeCountry(response.data)
  }

  async deleteCountry(id: string) {
    await this.client.delete(`/api/countries/${id}`)
  }

  // ============ MENU ITEMS ============

  async getMenuItems() {
    const response = await this.client.get<unknown>('/api/menu-items')
    return extractArray<MenuItem>(response.data).map(normalizeMenuItem)
  }

  async getMenuItem(id: string) {
    const response = await this.client.get<MenuItem>(`/api/menu-items/${id}`)
    return normalizeMenuItem(response.data)
  }

  async createMenuItem(item: Omit<MenuItem, 'id'>) {
    const response = await this.client.post<MenuItem>('/api/menu-items', item)
    return normalizeMenuItem(response.data)
  }

  async updateMenuItem(id: string, item: Partial<MenuItem>) {
    const response = await this.client.put<MenuItem>(`/api/menu-items/${id}`, item)
    return normalizeMenuItem(response.data)
  }

  async deleteMenuItem(id: string) {
    await this.client.delete(`/api/menu-items/${id}`)
  }

  // ============ FILTER TAGS ============

  async getFilterTags() {
    const response = await this.client.get<unknown>('/api/filter-tags')
    return extractArray<FilterTag>(response.data)
  }

  async createFilterTag(tag: Omit<FilterTag, 'id'>) {
    const response = await this.client.post<FilterTag>('/api/filter-tags', tag)
    return response.data
  }

  async updateFilterTag(id: string, tag: Partial<FilterTag>) {
    const response = await this.client.put<FilterTag>(`/api/filter-tags/${id}`, tag)
    return response.data
  }

  async deleteFilterTag(id: string) {
    await this.client.delete(`/api/filter-tags/${id}`)
  }

  // ============ BANNER & STORY ============

  async getBanner() {
    const response = await this.client.get<unknown>('/api/banner')
    const banner = extractObject<Banner>(response.data)
    return {
      ...banner,
      background_image: toAbsoluteAssetUrl(banner.background_image),
    }
  }

  async updateBanner(id: string, banner: Partial<Banner>) {
    const response = await this.client.put<Banner>(`/api/banner/${id}`, banner)
    return {
      ...response.data,
      background_image: toAbsoluteAssetUrl(response.data.background_image),
    }
  }

  async getStory() {
    const response = await this.client.get<unknown>('/api/story')
    const story = extractObject<StorySection>(response.data)
    return {
      ...story,
      background_image: toAbsoluteAssetUrl(story.background_image),
    }
  }

  async updateStory(id: string, story: Partial<StorySection>) {
    const response = await this.client.put<StorySection>(`/api/story/${id}`, story)
    return {
      ...response.data,
      background_image: toAbsoluteAssetUrl(response.data.background_image),
    }
  }

  // ============ SETTINGS ============

  async getSettings() {
    const response = await this.client.get<unknown>('/api/settings')
    const settings = extractObject<Settings>(response.data)
    return {
      ...settings,
      logo_url: toAbsoluteAssetUrl(settings.logo_url),
      logo_dark_url: toAbsoluteAssetUrl(settings.logo_dark_url),
      logo_light_url: toAbsoluteAssetUrl(settings.logo_light_url),
      favicon_url: toAbsoluteAssetUrl(settings.favicon_url),
    }
  }

  async updateSettings(id: string, settings: Partial<Settings>) {
    const response = await this.client.put<Settings>(`/api/settings/${id}`, settings)
    return {
      ...response.data,
      logo_url: toAbsoluteAssetUrl(response.data.logo_url),
      logo_dark_url: toAbsoluteAssetUrl(response.data.logo_dark_url),
      logo_light_url: toAbsoluteAssetUrl(response.data.logo_light_url),
      favicon_url: toAbsoluteAssetUrl(response.data.favicon_url),
    }
  }

  // ============ MEDIA / UPLOADS ============

  async getMedia() {
    const response = await this.client.get<unknown>('/api/media')
    return extractArray<MediaItem>(response.data).map((item) => ({
      ...item,
      url: toAbsoluteAssetUrl(item.url),
    }))
  }

  async uploadMedia(dataUrl: string, name?: string, size?: number) {
    const response = await this.client.post<MediaItem>('/api/media', {
      dataUrl,
      name,
      size,
    })
    return {
      ...response.data,
      url: toAbsoluteAssetUrl(response.data.url),
    }
  }

  async deleteMedia(id: string) {
    await this.client.delete(`/api/media/${id}`)
  }

  // ============ ACTIVITY LOG ============

  async getCustomers(page: number = 1, pageSize: number = 20) {
    const response = await this.client.get<{ data: any[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/api/customers?page=${page}&pageSize=${pageSize}`
    )
    return response.data
  }

  async createCustomer(customer: { fullName: string; contactNumber: string; email: string; dateOfBirth?: string; anniversaryDate?: string }) {
    const response = await this.client.post('/api/customers', customer)
    return response.data
  }
}

export const adminAPI = new AdminAPIClient()
export default AdminAPIClient
