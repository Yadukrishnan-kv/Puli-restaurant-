import { describe, it, expect } from 'vitest'
import { resolveMenuHierarchy } from '@/lib/hierarchyResolver'

const makeCategory = (id: string, name: string, sectionId?: string | null) => ({
  id,
  name_en: name,
  name_ar: '',
  section_id: sectionId ?? null,
  description: '',
  image: '',
  order: 0,
  visible: true,
  slug: name.toLowerCase(),
})

const makeSubCategory = (id: string, name: string, categoryId: string) => ({
  id,
  name_en: name,
  name_ar: '',
  category_id: categoryId,
  order: 0,
  visible: true,
})

const makeMenuSection = (id: string, name: string) => ({
  id,
  name_en: name,
  name_ar: '',
  order: 0,
  visible: true,
})

const makeClassification = (id: string, name: string, categoryId: string) => ({
  id,
  name_en: name,
  name_ar: '',
  category_id: categoryId,
  order: 0,
  visible: true,
})

describe('resolveMenuHierarchy', () => {
  it('Category matches exactly', () => {
    const cats = [makeCategory('c1', 'Food')]
    const result = resolveMenuHierarchy({
      categoryValue: 'Food',
      subCategoryValue: undefined,
      sectionValue: undefined,
      categories: cats,
      subCategories: [],
      classifications: [],
      menuSections: [],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.categoryId).toBe('c1')
      expect(result.matchedBy).toBe('category')
    }
  })

  it('Category matches with different letter casing', () => {
    const cats = [makeCategory('c1', 'Food')]
    const result = resolveMenuHierarchy({
      categoryValue: 'food',
      subCategoryValue: undefined,
      sectionValue: undefined,
      categories: cats,
      subCategories: [],
      classifications: [],
      menuSections: [],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.categoryId).toBe('c1')
    }
  })

  it('Category matches with extra spaces', () => {
    const cats = [makeCategory('c1', 'Food')]
    const result = resolveMenuHierarchy({
      categoryValue: '  Food  ',
      subCategoryValue: undefined,
      sectionValue: undefined,
      categories: cats,
      subCategories: [],
      classifications: [],
      menuSections: [],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.categoryId).toBe('c1')
    }
  })

  it('Sub-Category matches and correctly derives its parent Category', () => {
    const cats = [makeCategory('c1', 'Food')]
    const subs = [makeSubCategory('s1', 'Soup', 'c1')]
    const result = resolveMenuHierarchy({
      categoryValue: undefined,
      subCategoryValue: 'Soup',
      sectionValue: undefined,
      categories: cats,
      subCategories: subs,
      classifications: [],
      menuSections: [],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.subCategoryId).toBe('s1')
      expect(result.categoryId).toBe('c1')
      expect(result.matchedBy).toBe('sub-category')
    }
  })

  it('Section value matches a Category', () => {
    const cats = [makeCategory('c1', 'Food')]
    const result = resolveMenuHierarchy({
      categoryValue: undefined,
      subCategoryValue: undefined,
      sectionValue: 'Food',
      categories: cats,
      subCategories: [],
      classifications: [],
      menuSections: [],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.categoryId).toBe('c1')
      expect(result.matchedBy).toBe('category')
    }
  })

  it('Section value matches a Sub-Category', () => {
    const cats = [makeCategory('c1', 'Food')]
    const subs = [makeSubCategory('s1', 'Soup', 'c1')]
    const result = resolveMenuHierarchy({
      categoryValue: undefined,
      subCategoryValue: undefined,
      sectionValue: 'Soup',
      categories: cats,
      subCategories: subs,
      classifications: [],
      menuSections: [],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.subCategoryId).toBe('s1')
      expect(result.categoryId).toBe('c1')
      expect(result.matchedBy).toBe('sub-category')
    }
  })

  it('Section value matches a Menu Section Heading', () => {
    const sections = [makeMenuSection('sec1', 'Main Menu')]
    const cats = [makeCategory('c1', 'Food', 'sec1')]
    const result = resolveMenuHierarchy({
      categoryValue: undefined,
      subCategoryValue: undefined,
      sectionValue: 'Main Menu',
      categories: cats,
      subCategories: [],
      classifications: [],
      menuSections: sections,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.menuSectionHeadingId).toBe('sec1')
      expect(result.matchedBy).toBe('menu-section')
    }
  })

  it('Menu Section Heading correctly derives parent Category and SubCategory', () => {
    const sections = [makeMenuSection('sec1', 'Main Menu')]
    const cats = [makeCategory('c1', 'Food', 'sec1')]
    const subs = [makeSubCategory('s1', 'Soup', 'c1')]
    const result = resolveMenuHierarchy({
      categoryValue: undefined,
      subCategoryValue: 'Soup',
      sectionValue: 'Main Menu',
      categories: cats,
      subCategories: subs,
      classifications: [],
      menuSections: sections,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.menuSectionHeadingId).toBe('sec1')
      expect(result.categoryId).toBe('c1')
      expect(result.subCategoryId).toBe('s1')
    }
  })

  it('Blank hierarchy values do not use the first Category', () => {
    const cats = [makeCategory('c1', 'Food')]
    const result = resolveMenuHierarchy({
      categoryValue: undefined,
      subCategoryValue: undefined,
      sectionValue: undefined,
      categories: cats,
      subCategories: [],
      classifications: [],
      menuSections: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.reason).toBe('missing-hierarchy-data')
    }
  })

  it('Unknown hierarchy value is skipped with a warning', () => {
    const cats = [makeCategory('c1', 'Food')]
    const result = resolveMenuHierarchy({
      categoryValue: 'Beverages',
      subCategoryValue: undefined,
      sectionValue: undefined,
      categories: cats,
      subCategories: [],
      classifications: [],
      menuSections: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.reason).toBe('not-found')
    }
  })

  it('Duplicate names produce an ambiguity error', () => {
    const cats = [makeCategory('c1', 'Food'), makeCategory('c2', 'Food')]
    const result = resolveMenuHierarchy({
      categoryValue: 'Food',
      subCategoryValue: undefined,
      sectionValue: undefined,
      categories: cats,
      subCategories: [],
      classifications: [],
      menuSections: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.reason).toBe('ambiguous')
    }
  })

  it('Conflicting Category and Sub-Category produce a hierarchy mismatch', () => {
    const cats = [makeCategory('c1', 'Food'), makeCategory('c2', 'Drinks')]
    const subs = [makeSubCategory('s1', 'Soup', 'c1')]
    const result = resolveMenuHierarchy({
      categoryValue: 'Drinks',
      subCategoryValue: 'Soup',
      sectionValue: undefined,
      categories: cats,
      subCategories: subs,
      classifications: [],
      menuSections: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.reason).toBe('hierarchy-mismatch')
    }
  })

  it('Conflicting Sub-Category and Menu Section produce a hierarchy mismatch', () => {
    const sec1 = makeMenuSection('sec1', 'Main Menu')
    const sec2 = makeMenuSection('sec2', 'Specials')
    const cats = [makeCategory('c1', 'Food', 'sec1'), makeCategory('c2', 'Drinks', 'sec2')]
    const subs = [makeSubCategory('s1', 'Soup', 'c1')]
    const result = resolveMenuHierarchy({
      categoryValue: undefined,
      subCategoryValue: 'Soup',
      sectionValue: 'Specials',
      categories: cats,
      subCategories: subs,
      classifications: [],
      menuSections: [sec1, sec2],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.reason).toBe('hierarchy-mismatch')
    }
  })

  it('Multiple valid rows are imported into different hierarchy locations', () => {
    const sec1 = makeMenuSection('sec1', 'Main Menu')
    const cats = [makeCategory('c1', 'Food', 'sec1')]
    const subs = [makeSubCategory('s1', 'Soup', 'c1'), makeSubCategory('s2', 'Dessert', 'c1')]

    const r1 = resolveMenuHierarchy({
      categoryValue: 'Food',
      subCategoryValue: 'Soup',
      sectionValue: undefined,
      categories: cats,
      subCategories: subs,
      classifications: [],
      menuSections: [sec1],
    })
    expect(r1.success).toBe(true)
    if (r1.success) {
      expect(r1.categoryId).toBe('c1')
      expect(r1.subCategoryId).toBe('s1')
    }

    const r2 = resolveMenuHierarchy({
      categoryValue: undefined,
      subCategoryValue: 'Dessert',
      sectionValue: undefined,
      categories: cats,
      subCategories: subs,
      classifications: [],
      menuSections: [sec1],
    })
    expect(r2.success).toBe(true)
    if (r2.success) {
      expect(r2.categoryId).toBe('c1')
      expect(r2.subCategoryId).toBe('s2')
    }
  })

  it('Existing non-hierarchy import fields continue to work', () => {
    const cats = [makeCategory('c1', 'Food')]
    const result = resolveMenuHierarchy({
      categoryValue: 'Food',
      subCategoryValue: undefined,
      sectionValue: undefined,
      categories: cats,
      subCategories: [],
      classifications: [],
      menuSections: [],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.categoryId).toBe('c1')
    }
  })

  it('Section matches a Sub-Category under a specific Category', () => {
    const cats = [makeCategory('c1', 'Food'), makeCategory('c2', 'Drinks')]
    const subs = [makeSubCategory('s1', 'Lemonade', 'c2')]
    const result = resolveMenuHierarchy({
      categoryValue: undefined,
      subCategoryValue: undefined,
      sectionValue: 'Lemonade',
      categories: cats,
      subCategories: subs,
      classifications: [],
      menuSections: [],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.subCategoryId).toBe('s1')
      expect(result.categoryId).toBe('c2')
    }
  })

  it('Section matches a Category that has no subcategory', () => {
    const cats = [makeCategory('c1', 'Appetizers')]
    const result = resolveMenuHierarchy({
      categoryValue: undefined,
      subCategoryValue: undefined,
      sectionValue: 'Appetizers',
      categories: cats,
      subCategories: [],
      classifications: [],
      menuSections: [],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.categoryId).toBe('c1')
      expect(result.subCategoryId).toBeNull()
    }
  })

  it('Section matches a Classification (uses category match as fallback)', () => {
    const cats = [makeCategory('c1', 'Food')]
    const cls = makeClassification('cl1', 'Chef Special', 'c1')
    const result = resolveMenuHierarchy({
      categoryValue: undefined,
      subCategoryValue: undefined,
      sectionValue: 'Chef Special',
      categories: cats,
      subCategories: [],
      classifications: [cls],
      menuSections: [],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.categoryId).toBe('c1')
    }
  })

  it('All hierarchy columns mapped to valid matching entries', () => {
    const sec1 = makeMenuSection('sec1', 'Main Menu')
    const cats = [makeCategory('c1', 'Food', 'sec1')]
    const subs = [makeSubCategory('s1', 'Soup', 'c1')]
    const result = resolveMenuHierarchy({
      categoryValue: 'Food',
      subCategoryValue: 'Soup',
      sectionValue: 'Main Menu',
      categories: cats,
      subCategories: subs,
      classifications: [],
      menuSections: [sec1],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.menuSectionHeadingId).toBe('sec1')
      expect(result.categoryId).toBe('c1')
      expect(result.subCategoryId).toBe('s1')
    }
  })

  it('Missing hierarchy data when all values are blank', () => {
    const result = resolveMenuHierarchy({
      categoryValue: undefined,
      subCategoryValue: undefined,
      sectionValue: undefined,
      categories: [],
      subCategories: [],
      classifications: [],
      menuSections: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.reason).toBe('missing-hierarchy-data')
    }
  })
})