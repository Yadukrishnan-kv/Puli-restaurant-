import type { MenuItemData, CategoryData } from './customerAPI'

const COUNTRY_CODE_MAP: Record<string, string> = {
  'India': 'IN',
  'Japan': 'JP',
  'Thailand': 'TH',
  'China': 'CN',
  'Korea': 'KR',
  'Lebanon': 'LB',
  'Vietnam': 'VN',
  'Malaysia': 'MY',
  'Indonesia': 'ID',
  'Singapore': 'SG',
}

/**
 * Extract country code from item classification or tags
 */
export function getCountryCodeForItem(item: MenuItemData): string | undefined {
  if (item.country_code) return item.country_code
  
  // Try to infer from tags
  const countryTags = ['japan', 'thailand', 'china', 'southKorea', 'lebanon', 'vietnam', 'malaysia', 'indonesia', 'singapore', 'india']
  const tag = item.tags?.find((t) => countryTags.includes(t.toLowerCase()))
  
  if (tag) {
    const tagUpper = tag.toLowerCase()
    if (tagUpper === 'japan') return 'JP'
    if (tagUpper === 'thailand') return 'TH'
    if (tagUpper === 'china') return 'CN'
    if (tagUpper === 'southkorea') return 'KR'
    if (tagUpper === 'lebanon') return 'LB'
    if (tagUpper === 'vietnam') return 'VN'
    if (tagUpper === 'malaysia') return 'MY'
    if (tagUpper === 'indonesia') return 'ID'
    if (tagUpper === 'singapore') return 'SG'
    if (tagUpper === 'india') return 'IN'
  }
  
  return undefined
}

/**
 * Check if item is from vegetarian section
 */
export function isVegetarianSection(sectionName?: string): boolean {
  if (!sectionName) return false
  return sectionName.toUpperCase().includes('VEGETARIAN')
}

/**
 * Convert country code to flag emoji
 */
export function countryCodeToFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

/**
 * Slugify a string for use in URLs
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Get slug from category
 */
export function getCategorySlug(category: CategoryData): string {
  return slugify(category.name_en)
}
