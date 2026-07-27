import type { Category, Classification, MenuSection, SubCategory } from '@/types'

function normalize(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null
  const s = String(value)
  const trimmed = s.trim()
  if (!trimmed) return null
  return trimmed.replace(/\s+/g, ' ').toLowerCase()
}

function matchesName(dbName: string, inputValue: string | null): boolean {
  if (inputValue === null) return false
  return dbName.toLowerCase() === inputValue
}

export type HierarchyMatchedBy = 'menu-section' | 'category' | 'sub-category' | null

export interface HierarchyResolveSuccess {
  success: true
  categoryId: string | null
  subCategoryId: string | null
  classificationId: string | null
  menuSectionHeadingId: string | null
  matchedBy: HierarchyMatchedBy
}

export interface HierarchyResolveFailure {
  success: false
  reason: 'not-found' | 'ambiguous' | 'hierarchy-mismatch' | 'missing-hierarchy-data'
  message: string
}

export type HierarchyResult = HierarchyResolveSuccess | HierarchyResolveFailure

export interface ResolveMenuHierarchyInput {
  categoryValue: string | undefined
  subCategoryValue: string | undefined
  sectionValue: string | undefined
  extraValues?: string[]
  categories: Category[]
  subCategories: SubCategory[]
  classifications: Classification[]
  menuSections: MenuSection[]
}

interface ExtraHierarchyMatch {
  categoryId?: string | null
  subCategoryId?: string | null
  classificationId?: string | null
  menuSectionHeadingId?: string | null
  matchedBy: HierarchyMatchedBy
}

function tryMatchAllHierarchyTypes(
  normValue: string,
  categories: Category[],
  subCategories: SubCategory[],
  classifications: Classification[],
  menuSections: MenuSection[],
): ExtraHierarchyMatch | null {
  // Priority 1: Menu Section Heading (singular match only)
  const secMatches = findExactMatches(menuSections, normValue)
  if (secMatches.length === 1) {
    return { menuSectionHeadingId: secMatches[0].id, matchedBy: 'menu-section' }
  }
  // Priority 2: Sub-Category (singular match only)
  const subMatches = findExactMatches(subCategories, normValue)
  if (subMatches.length === 1) {
    return { subCategoryId: subMatches[0].id, categoryId: subMatches[0].category_id, matchedBy: 'sub-category' }
  }
  // Priority 3: Category (singular match only)
  const catMatches = findExactMatches(categories, normValue)
  if (catMatches.length === 1) {
    return { categoryId: catMatches[0].id, matchedBy: 'category' }
  }
  // Priority 4: Classification (falls back to category)
  const clsMatches = findExactMatches(classifications, normValue)
  if (clsMatches.length === 1) {
    return { classificationId: clsMatches[0].id, categoryId: clsMatches[0].category_id, matchedBy: 'category' }
  }
  return null
}

function findExactMatches<T extends { name_en: string; id: string }>(
  items: T[],
  normalizedValue: string | null,
): T[] {
  if (!normalizedValue) return []
  return items.filter((item) => matchesName(item.name_en, normalizedValue))
}

export function resolveMenuHierarchy(input: ResolveMenuHierarchyInput): HierarchyResult {
  const { categoryValue, subCategoryValue, sectionValue, categories, subCategories, classifications, menuSections } = input

  const normCategory = normalize(categoryValue)
  const normSubCategory = normalize(subCategoryValue)
  const normSection = normalize(sectionValue)

  const hasCategory = normCategory !== null
  const hasSubCategory = normSubCategory !== null
  const hasSection = normSection !== null

  if (!hasCategory && !hasSubCategory && !hasSection) {
    return {
      success: false,
      reason: 'missing-hierarchy-data',
      message: 'No hierarchy column (Category, Sub-Category, or Section) mapped or provided',
    }
  }

  let targetCategoryId: string | null = null
  let targetSubCategoryId: string | null = null
  let targetClassificationId: string | null = null
  let targetMenuSectionId: string | null = null
  let matchedBy: HierarchyMatchedBy = null

  // Step 1: Resolve Section value against all hierarchy types (priority: Section Heading > SubCategory > Category)
  if (hasSection) {
    // Priority 1: Try Menu Section Heading
    const sectionMatches = findExactMatches(menuSections, normSection)
    if (sectionMatches.length === 1) {
      targetMenuSectionId = sectionMatches[0].id
      matchedBy = 'menu-section'
    } else if (sectionMatches.length > 1) {
      return {
        success: false,
        reason: 'ambiguous',
        message: `Section "${sectionValue}" matches multiple Menu Section Headings: ${sectionMatches.map((s) => s.name_en).join(', ')}`,
      }
    }

    // Priority 2: Try Sub-Category
    if (!targetMenuSectionId) {
      const subCatMatches = findExactMatches(subCategories, normSection)
      if (subCatMatches.length === 1) {
        targetSubCategoryId = subCatMatches[0].id
        targetCategoryId = subCatMatches[0].category_id
        matchedBy = 'sub-category'
      } else if (subCatMatches.length > 1) {
        const uniqueByCategory = new Map<string, SubCategory[]>()
        for (const sm of subCatMatches) {
          const key = sm.category_id
          if (!uniqueByCategory.has(key)) uniqueByCategory.set(key, [])
          uniqueByCategory.get(key)!.push(sm)
        }
        if (uniqueByCategory.size === 1) {
          targetSubCategoryId = subCatMatches[0].id
          targetCategoryId = subCatMatches[0].category_id
          matchedBy = 'sub-category'
        } else {
          return {
            success: false,
            reason: 'ambiguous',
            message: `Section "${sectionValue}" matches multiple Sub-Categories across different categories`,
          }
        }
      }
    }

    // Priority 3: Try Category
    if (!targetMenuSectionId && !targetSubCategoryId) {
      const categoryMatches = findExactMatches(categories, normSection)
      if (categoryMatches.length === 1) {
        targetCategoryId = categoryMatches[0].id
        matchedBy = matchedBy ?? 'category'
      } else if (categoryMatches.length > 1) {
        return {
          success: false,
          reason: 'ambiguous',
          message: `Section "${sectionValue}" matches multiple Categories`,
        }
      }
    }

    // Priority 4: Try Classification (falls back to Category match if Classification name also matches a Category)
    if (!targetMenuSectionId && !targetSubCategoryId && !targetCategoryId) {
      const classMatches = findExactMatches(classifications, normSection)
      if (classMatches.length === 1) {
        targetClassificationId = classMatches[0].id
        targetCategoryId = classMatches[0].category_id
        matchedBy = 'category'
      } else if (classMatches.length > 1) {
        const uniqueByCategory = new Map<string, Classification[]>()
        for (const cm of classMatches) {
          const key = cm.category_id
          if (!uniqueByCategory.has(key)) uniqueByCategory.set(key, [])
          uniqueByCategory.get(key)!.push(cm)
        }
        if (uniqueByCategory.size === 1) {
          targetClassificationId = classMatches[0].id
          targetCategoryId = classMatches[0].category_id
          matchedBy = 'category'
        } else {
          return {
            success: false,
            reason: 'ambiguous',
            message: `Section "${sectionValue}" matches multiple Classifications across different categories`,
          }
        }
      } else {
        return {
          success: false,
          reason: 'not-found',
          message: `Section "${sectionValue}" does not match any Menu Section Heading, Sub-Category, Category, or Classification`,
        }
      }
    }
  }

  // Step 2: Resolve Category value (also used after section match to override/confirm category)
  if (hasCategory) {
    const categoryMatches = findExactMatches(categories, normCategory)
    if (categoryMatches.length === 1) {
      // If section already set a different category, check for mismatch
      if (targetCategoryId && targetCategoryId !== categoryMatches[0].id) {
        return {
          success: false,
          reason: 'hierarchy-mismatch',
          message: `Category "${categoryValue}" (${categoryMatches[0].id}) conflicts with Section-derived Category (${targetCategoryId})`,
        }
      }
      targetCategoryId = categoryMatches[0].id
      matchedBy = matchedBy ?? 'category'
    } else if (categoryMatches.length > 1) {
      return {
        success: false,
        reason: 'ambiguous',
        message: `Category "${categoryValue}" matches multiple Categories: ${categoryMatches.map((c) => c.name_en).join(', ')}`,
      }
    } else {
      return {
        success: false,
        reason: 'not-found',
        message: `Category "${categoryValue}" does not match any existing Category`,
      }
    }
  }

  // Step 3: Resolve Sub-Category value (also used after section/category match)
  if (hasSubCategory) {
    const candidates = targetCategoryId
      ? subCategories.filter((sc) => sc.category_id === targetCategoryId)
      : subCategories

    const subCatMatches = findExactMatches(candidates, normSubCategory)
    if (subCatMatches.length === 1) {
      const sc = subCatMatches[0]
      if (targetCategoryId && sc.category_id !== targetCategoryId) {
        return {
          success: false,
          reason: 'hierarchy-mismatch',
          message: `Sub-Category "${subCategoryValue}" does not belong to Category "${categoryValue}"`,
        }
      }
      targetSubCategoryId = sc.id
      targetCategoryId = sc.category_id
      matchedBy = matchedBy ?? 'sub-category'
    } else if (subCatMatches.length > 1) {
      return {
        success: false,
        reason: 'ambiguous',
        message: `Sub-Category "${subCategoryValue}" is ambiguous — multiple matches: ${subCatMatches.map((s) => s.name_en).join(', ')}`,
      }
    } else if (targetCategoryId) {
      const existsElsewhere = subCategories.find((sc) => matchesName(sc.name_en, normSubCategory))
      if (existsElsewhere) {
        return {
          success: false,
          reason: 'hierarchy-mismatch',
          message: `Sub-Category "${subCategoryValue}" belongs to a different Category than "${categoryValue}"`,
        }
      }
      return {
        success: false,
        reason: 'not-found',
        message: `Sub-Category "${subCategoryValue}" not found under Category "${categoryValue}"`,
      }
    } else {
      return {
        success: false,
        reason: 'not-found',
        message: `Sub-Category "${subCategoryValue}" does not match any Sub-Category`,
      }
    }
  }

  // Step 4: Validate hierarchy consistency after section + subcategory match
  if (hasSection && hasSubCategory && targetMenuSectionId && targetSubCategoryId) {
    const parentCat = categories.find((c) => c.id === subCategories.find((s) => s.id === targetSubCategoryId)?.category_id)
    if (parentCat && parentCat.section_id !== targetMenuSectionId) {
      return {
        success: false,
        reason: 'hierarchy-mismatch',
        message: `Sub-Category "${subCategoryValue}" does not belong to a Category under Section "${sectionValue}"`,
      }
    }
  }

  // Step 5: Validate hierarchy consistency after section + category match
  if (hasSection && hasCategory && targetMenuSectionId && targetCategoryId) {
    const cat = categories.find((c) => c.id === targetCategoryId)
    if (cat && cat.section_id !== targetMenuSectionId) {
      return {
        success: false,
        reason: 'hierarchy-mismatch',
        message: `Category "${categoryValue}" does not belong to Section "${sectionValue}"`,
      }
    }
  }

  // Step 6: Validate that subcategory belongs to the resolved category
  if (targetSubCategoryId && targetCategoryId) {
    const sc = subCategories.find((s) => s.id === targetSubCategoryId)
    if (sc && sc.category_id !== targetCategoryId) {
      return {
        success: false,
        reason: 'hierarchy-mismatch',
        message: `Sub-Category "${subCategoryValue}" belongs to a different Category than "${categoryValue}"`,
      }
    }
  }

  // Step 7: Try unmatched extra values from unmapped columns
  const extraValues = input.extraValues ?? []
  for (const extraValue of extraValues) {
    const normExtra = normalize(extraValue)
    if (!normExtra) continue
    // Skip values that were already consumed by mapped columns
    if (normExtra === normCategory || normExtra === normSubCategory || normExtra === normSection) continue

    const extraMatch = tryMatchAllHierarchyTypes(normExtra, categories, subCategories, classifications, menuSections)
    if (extraMatch) {
      // Apply extra match only if the corresponding target is not already set
      if (!targetMenuSectionId && extraMatch.menuSectionHeadingId) {
        targetMenuSectionId = extraMatch.menuSectionHeadingId
        matchedBy = extraMatch.matchedBy
      }
      if (!targetSubCategoryId && extraMatch.subCategoryId) {
        targetSubCategoryId = extraMatch.subCategoryId
        targetCategoryId = extraMatch.categoryId ?? targetCategoryId
        matchedBy = extraMatch.matchedBy
      }
      if (!targetCategoryId && extraMatch.categoryId) {
        targetCategoryId = extraMatch.categoryId
        matchedBy = extraMatch.matchedBy
      }
      if (!targetClassificationId && extraMatch.classificationId) {
        targetClassificationId = extraMatch.classificationId
        targetCategoryId = extraMatch.categoryId ?? targetCategoryId
        matchedBy = extraMatch.matchedBy
      }
    }
  }

// If after all processing we have a menuSection but no category,
      // try to auto-derive it if there's exactly one Category under that section.
      if (targetMenuSectionId && !targetCategoryId) {
        const catsUnderSection = categories.filter((c) => c.section_id === targetMenuSectionId)
        if (catsUnderSection.length === 1) {
          targetCategoryId = catsUnderSection[0].id
          matchedBy = matchedBy ?? 'category'
        } else if (catsUnderSection.length === 0) {
          return {
            success: false,
            reason: 'missing-hierarchy-data',
            message: `Section "${sectionValue}" has no Categories underneath it`,
          }
        } else {
          return {
            success: false,
            reason: 'ambiguous',
            message: `Section "${sectionValue}" has multiple Categories — specify which Category to use`,
          }
        }
      }

      // If after all processing we have no category, it's a failure
      if (!targetCategoryId) {
        return {
          success: false,
          reason: 'missing-hierarchy-data',
          message: 'No valid category could be resolved from any column (mapped or unmapped)',
        }
      }

  return {
    success: true,
    categoryId: targetCategoryId,
    subCategoryId: targetSubCategoryId,
    classificationId: targetClassificationId,
    menuSectionHeadingId: targetMenuSectionId,
    matchedBy,
  }
}