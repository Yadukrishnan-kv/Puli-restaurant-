/**
 * Customer Frontend - Menu Data Integration Example
 * 
 * Shows how to replace static menuData.ts with API hooks
 */

import { useState, useEffect } from 'react'
import type { MenuItemData } from '@/lib/customerAPI'
import {
  useMenuData,
  useAllMenuItems,
  useCategories,
  useFilterTags,
  useMenuFilter,
  useFeaturedItems,
} from '@/hooks/useMenuAPI'

/**
 * Example: Replace HomePage static data with API
 * Before: import menuData from '@/data/menuData'
 * After: Use the hooks below
 */
export function HomePageExample() {
  const { menu, loading, error } = useMenuData()
  const { popularItems, chefSpecials, vegetarianItems } = useFeaturedItems(
    menu?.flatMap((section: any) => section.items) || []
  )

  if (loading) return <div>Loading menu...</div>
  if (error) return <div>Error: {error}</div>
  if (!menu) return <div>No menu data</div>

  return (
    <div>
      <h1>Welcome to Our Menu</h1>

      {/* Hero Banner Section */}
      <section className="hero">
        <h2>Featured Dishes</h2>
        <div className="items-grid">
          {chefSpecials.slice(0, 3).map((item: MenuItemData) => (
            <div key={item._id} className="item-card">
              <h3>{item.name_en}</h3>
              <p>Price: {item.price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Items */}
      <section>
        <h2>Popular Items</h2>
        <div className="items-grid">
          {popularItems.slice(0, 6).map((item: MenuItemData) => (
            <div key={item._id} className="item-card">
              <h3>{item.name_en}</h3>
              <p>{item.description_en}</p>
              <p>Price: {item.price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Menu Sections */}
      {menu.map((section: any) => (
        <section key={section._id}>
          <h2>{section.name_en}</h2>
          <div className="items-grid">
            {section.items.map((item: MenuItemData) => (
              <div key={item._id} className="item-card">
                <h3>{item.name_en}</h3>
                <p>{item.description_en}</p>
                <p className="price">SR {item.price}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/**
 * Example: Category Page with filtering
 */
export function CategoryPageExample() {
  const { menu, loading } = useMenuData()
  const categoryId = 'some-id' // From route params
  const category = menu?.find((s: any) =>
    s.items.some((i: MenuItemData) => i.category_id === categoryId)
  )
  const categoryItems = category?.items || []

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>Category Items</h1>
      <div className="items-list">
        {categoryItems.map((item: MenuItemData) => (
          <div key={item._id} className="item-card">
            <h3>{item.name_en}</h3>
            <p>{item.description_en}</p>
            <p>SR {item.price}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Example: Search and Filter Component
 */
export function SearchAndFilterExample() {
  const { items, loading } = useAllMenuItems()
  const { categories, loading: categoriesLoading } = useCategories()
  const { tags, loading: tagsLoading } = useFilterTags()
  const { filteredItems, handleSearch, handleFilterTags, handleSort } =
    useMenuFilter(items)

  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    handleSearch(query)
  }

  if (loading || categoriesLoading || tagsLoading) return <div>Loading...</div>

  return (
    <div className="search-filter-container">
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search menu items..."
        value={searchQuery}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="search-input"
      />

      {/* Sort Options */}
      <select onChange={(e) => handleSort(e.target.value as any)}>
        <option value="order">Default</option>
        <option value="name">Name (A-Z)</option>
        <option value="price-asc">Price (Low to High)</option>
        <option value="price-desc">Price (High to Low)</option>
        <option value="popularity">Most Popular</option>
      </select>

      {/* Filter Tags */}
      <div className="filter-tags">
        {tags.map((tag: any) => (
          <button
            key={tag._id}
            className="tag-button"
            onClick={() => handleFilterTags(tag._id)}
          >
            {tag.name_en}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="items-list">
        {filteredItems.length === 0 ? (
          <p>No items found</p>
        ) : (
          filteredItems.map((item: MenuItemData) => (
            <div key={item._id} className="item-card">
              <h3>{item.name_en}</h3>
              <p>{item.description_en}</p>
              <p className="price">SR {item.price}</p>
              {item.spice_level && <span>🌶️ {item.spice_level}/3</span>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/**
 * Example: Menu Item Detail with Dynamic Fields
 */
export function MenuItemDetailExample({ itemId }: { itemId: string }) {
  const { items, loading } = useAllMenuItems()
  const item = items.find((i: MenuItemData) => i._id === itemId)

  if (loading) return <div>Loading...</div>
  if (!item) return <div>Item not found</div>

  return (
    <div className="item-detail">
      <h1>{item.name_en}</h1>
      <p className="description">{item.description_en}</p>

      {/* Price */}
      <div className="price-section">
        <span className="currency">SR</span>
        <span className="price">{item.price}</span>
      </div>

      {/* Dynamic Fields */}
      <div className="properties">
        {item.spice_level !== undefined && (
          <div className="property">
            <label>Spice Level:</label>
            <span>{'🌶️'.repeat(item.spice_level)} {item.spice_level}/3</span>
          </div>
        )}

        {item.country_code && (
          <div className="property">
            <label>Origin:</label>
            <span>{item.country_code}</span>
          </div>
        )}

        {item.allergens && item.allergens.length > 0 && (
          <div className="property">
            <label>Allergens:</label>
            <span>{item.allergens.join(', ')}</span>
          </div>
        )}

        {item.dietary_tags && item.dietary_tags.length > 0 && (
          <div className="property">
            <label>Dietary:</label>
            <span>{item.dietary_tags.join(', ')}</span>
          </div>
        )}

        {item.available_from && item.available_to && (
          <div className="property">
            <label>Available:</label>
            <span>
              {item.available_from.substring(0, 5)} -{' '}
              {item.available_to.substring(0, 5)}
            </span>
          </div>
        )}

        {item.available_days && item.available_days.length > 0 && (
          <div className="property">
            <label>Available Days:</label>
            <span>{item.available_days.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Add to Cart Button */}
      <button className="add-to-cart">Add to Cart</button>
    </div>
  )
}

/**
 * Example: Vegetarian Items Page
 */
export function VegetarianPageExample() {
  const { items, loading } = useAllMenuItems()
  const { vegetarianItems } = useFeaturedItems(items)

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>Vegetarian Items</h1>
      <p>{vegetarianItems.length} items available</p>

      <div className="items-grid">
        {vegetarianItems.map((item: MenuItemData) => (
          <div key={item._id} className="item-card">
            <h3>{item.name_en}</h3>
            <p>{item.description_en}</p>
            <div className="price">SR {item.price}</div>
            {item.dietary_tags?.includes('vegetarian') && (
              <span className="veg-badge">🥬 Vegetarian</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Example: Menu by Spice Level
 */
export function SpiceLevelFilterExample() {
  const { items, loading } = useAllMenuItems()
  const spiceLevels = [0, 1, 2, 3]

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>Browse by Spice Level</h1>

      {spiceLevels.map((level) => {
        const itemsAtLevel = items.filter((i: MenuItemData) => i.spice_level === level)
        return (
          <section key={level}>
            <h2>
              Spice Level {level}: {'🌶️'.repeat(level) || 'Mild'}
            </h2>
            <div className="items-grid">
              {itemsAtLevel.map((item: MenuItemData) => (
                <div key={item._id} className="item-card">
                  <h3>{item.name_en}</h3>
                  <p>{item.description_en}</p>
                  <p className="price">SR {item.price}</p>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/**
 * Example: Country-based Menu
 */
export function CountryMenuExample() {
  const { items, loading } = useAllMenuItems()
  const countries: string[] = [...new Set(items.filter((i: MenuItemData) => i.country_code).map((i: MenuItemData) => i.country_code || ''))].filter(Boolean) as string[]

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>Cuisine by Country</h1>

      {countries.map((country: string) => {
        const countryItems = items.filter((i: MenuItemData) => i.country_code === country)
        return (
          <section key={country}>
            <h2>{country}</h2>
            <div className="items-grid">
              {countryItems.map((item: MenuItemData) => (
                <div key={item._id} className="item-card">
                  <h3>{item.name_en}</h3>
                  <p className="price">SR {item.price}</p>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/**
 * Example: Bilingual Menu Display
 */
export function BilingualMenuExample() {
  const { menu, loading } = useMenuData()
  const [isArabic, setIsArabic] = useState(false)

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <button onClick={() => setIsArabic(!isArabic)}>
        {isArabic ? 'English' : 'العربية'}
      </button>

      {menu?.map((section: any) => (
        <section key={section._id}>
          <h2>{isArabic ? section.name_ar : section.name_en}</h2>
          {section.description_ar && (
            <p>{isArabic ? section.description_ar : section.description_en}</p>
          )}

          <div className="items-grid">
            {section.items.map((item: MenuItemData) => (
              <div key={item._id} className="item-card">
                <h3>{isArabic ? item.name_ar : item.name_en}</h3>
                <p>{isArabic ? item.description_ar : item.description_en}</p>
                <p>SR {item.price}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
