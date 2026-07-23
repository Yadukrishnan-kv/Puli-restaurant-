# Quick Implementation Examples - Before & After

Real code examples showing how to update actual pages from static to API-based.

## Admin Frontend Examples

### Example 1: MenuItems Page

#### BEFORE (Static Data)
```typescript
// src/pages/MenuItems.tsx
import { useStore } from '@/store/useStore'

export function MenuItems() {
  const menuItems = useStore((s) => s.menuItems)
  const categories = useStore((s) => s.categories)
  
  const handleDelete = (id: string) => {
    const updatedItems = menuItems.filter((item) => item._id !== id)
    // Update local state only - not persisted!
    useStore.setState({ menuItems: updatedItems })
  }

  return (
    <div>
      <h1>Menu Items ({menuItems.length})</h1>
      <table>
        <tbody>
          {menuItems.map((item) => (
            <tr key={item._id}>
              <td>{item.name_en}</td>
              <td>{item.price}</td>
              <td>
                <button onClick={() => handleDelete(item._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

#### AFTER (API Integration)
```typescript
// src/pages/MenuItems.tsx
import { useStore } from '@/store/useStore'
import { adminAPI } from '@/lib/adminAPI'
import { useAdminData } from '@/hooks/useAdminData'

export function MenuItems() {
  const { loading: initialLoading } = useAdminData()
  const menuItems = useStore((s) => s.menuItems)
  const categories = useStore((s) => s.categories)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string>('')

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    setDeleting(id)
    setError('')
    try {
      await adminAPI.deleteMenuItem(id)
      // Store will be updated by the hook
      useStore.setState({
        menuItems: menuItems.filter((item) => item._id !== id)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  if (initialLoading) return <div>Loading menu items...</div>
  if (error) return <div style={{ color: 'red' }}>{error}</div>

  return (
    <div>
      <h1>Menu Items ({menuItems.length})</h1>
      <table>
        <tbody>
          {menuItems.map((item) => (
            <tr key={item._id}>
              <td>{item.name_en}</td>
              <td>{item.price}</td>
              <td>
                <button
                  onClick={() => handleDelete(item._id)}
                  disabled={deleting === item._id}
                >
                  {deleting === item._id ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

**Key Changes:**
- Added `useAdminData()` to ensure data is loaded
- Wrapped delete in try-catch with error handling
- Added loading state while deleting
- Made API call to backend before updating store
- Added confirmation dialog

---

### Example 2: Categories Page

#### BEFORE (Static)
```typescript
// src/pages/Categories.tsx
import { useStore } from '@/store/useStore'
import { useState } from 'react'

export function Categories() {
  const categories = useStore((s) => s.categories)
  const [newName, setNewName] = useState('')

  const handleCreate = () => {
    const newCategory = {
      _id: Date.now().toString(),
      name_en: newName,
      name_ar: newName,
      description_en: '',
      description_ar: '',
      order: categories.length + 1,
    }
    useStore.setState({
      categories: [...categories, newCategory]
    })
    setNewName('')
  }

  return (
    <div>
      <h1>Categories</h1>
      <input
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="Category name"
      />
      <button onClick={handleCreate}>Create</button>

      <ul>
        {categories.map((cat) => (
          <li key={cat._id}>{cat.name_en}</li>
        ))}
      </ul>
    </div>
  )
}
```

#### AFTER (API Integration)
```typescript
// src/pages/Categories.tsx
import { useStore } from '@/store/useStore'
import { adminAPI } from '@/lib/adminAPI'
import { useAdminData } from '@/hooks/useAdminData'
import { useState } from 'react'

export function Categories() {
  const { loading: initialLoading } = useAdminData()
  const categories = useStore((s) => s.categories)
  const [newName, setNewName] = useState('')
  const [newNameAr, setNewNameAr] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!newName.trim()) {
      setError('Category name is required')
      return
    }

    setCreating(true)
    setError('')
    try {
      const newCategory = await adminAPI.createCategory({
        name_en: newName,
        name_ar: newNameAr || newName,
        description_en: '',
        description_ar: '',
        order: categories.length + 1,
      })

      // Update store with new category
      useStore.setState({
        categories: [...categories, newCategory as any]
      })

      setNewName('')
      setNewNameAr('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category')
    } finally {
      setCreating(false)
    }
  }

  if (initialLoading) return <div>Loading categories...</div>

  return (
    <div>
      <h1>Categories ({categories.length})</h1>
      
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Category name (English)"
        />
        <input
          type="text"
          value={newNameAr}
          onChange={(e) => setNewNameAr(e.target.value)}
          placeholder="Category name (Arabic)"
        />
        <button onClick={handleCreate} disabled={creating}>
          {creating ? 'Creating...' : 'Create'}
        </button>
      </div>

      <ul>
        {categories.map((cat) => (
          <li key={cat._id}>
            {cat.name_en}
            {cat.name_ar && ` / ${cat.name_ar}`}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

**Key Changes:**
- Added bilingual support (English + Arabic)
- Made API call to `adminAPI.createCategory()`
- Added loading and error states
- Validation before submit
- Update store with API response

---

### Example 3: Banner/Story Single Item Management

#### BEFORE (Static)
```typescript
// src/pages/Banner.tsx
import { useStore } from '@/store/useStore'
import { useState } from 'react'

export function Banner() {
  const banner = useStore((s) => s.banner)
  const [image, setImage] = useState(banner?.image_url || '')
  const [title, setTitle] = useState(banner?.title || '')

  const handleSave = () => {
    useStore.setState({
      banner: {
        ...banner,
        image_url: image,
        title: title,
      }
    })
    alert('Saved locally (not persisted)')
  }

  return (
    <div>
      <h1>Banner Settings</h1>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Banner title"
      />
      <input
        type="text"
        value={image}
        onChange={(e) => setImage(e.target.value)}
        placeholder="Image URL"
      />
      <button onClick={handleSave}>Save</button>
    </div>
  )
}
```

#### AFTER (API Integration)
```typescript
// src/pages/Banner.tsx
import { useStore } from '@/store/useStore'
import { adminAPI } from '@/lib/adminAPI'
import { useAdminData } from '@/hooks/useAdminData'
import { useState, useEffect } from 'react'

export function Banner() {
  const { loading: initialLoading } = useAdminData()
  const banner = useStore((s) => s.banner)
  const [image, setImage] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Initialize form with current banner data
  useEffect(() => {
    if (banner) {
      setTitle(banner.title_en || '')
      setImage(banner.image_url || '')
    }
  }, [banner])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      const updatedBanner = await adminAPI.updateBanner({
        title_en: title,
        title_ar: title, // TODO: Add separate Arabic input
        image_url: image,
      })

      // Update store
      useStore.setState({ banner: updatedBanner as any })
      setSaved(true)

      // Hide success message after 3 seconds
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save banner')
    } finally {
      setSaving(false)
    }
  }

  if (initialLoading) return <div>Loading banner settings...</div>

  return (
    <div>
      <h1>Banner Settings</h1>

      {error && <div style={{ color: 'red' }}>{error}</div>}
      {saved && <div style={{ color: 'green' }}>Banner updated successfully!</div>}

      <div style={{ marginBottom: '10px' }}>
        <label>Banner Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Banner title"
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Image URL</label>
        <input
          type="text"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
        {image && <img src={image} style={{ maxWidth: '200px', marginTop: '10px' }} />}
      </div>

      <button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}
```

**Key Changes:**
- Load banner data on mount with `useEffect`
- Make API call to `adminAPI.updateBanner()`
- Show success/error messages
- Add image preview
- Disable button while saving

---

## Customer Frontend Examples

### Example 1: HomePage - Menu Display

#### BEFORE (Static Data)
```typescript
// src/pages/HomePage.tsx
import menuData from '@/data/menuData'
import CategoryCard from '@/components/CategoryCard'
import HeroBanner from '@/components/HeroBanner'

export function HomePage() {
  return (
    <div>
      <HeroBanner />

      <div className="featured-section">
        <h2>Featured Items</h2>
        {menuData.sections[0]?.items.map((item) => (
          <DishItem key={item.id} item={item} />
        ))}
      </div>

      {menuData.sections.map((section) => (
        <div key={section.id} className="section">
          <h2>{section.name}</h2>
          <div className="items-grid">
            {section.items.map((item) => (
              <DishItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

#### AFTER (API Integration)
```typescript
// src/pages/HomePage.tsx
import { useMenuData, useFeaturedItems } from '@/hooks/useMenuAPI'
import CategoryCard from '@/components/CategoryCard'
import HeroBanner from '@/components/HeroBanner'
import DishItem from '@/components/DishItem'

export function HomePage() {
  const { menu, loading, error } = useMenuData()
  const { chefSpecials } = useFeaturedItems(
    menu?.flatMap((section) => section.items) || []
  )

  if (loading) return <div className="loading">Loading menu...</div>
  if (error) return <div className="error">Error loading menu: {error}</div>
  if (!menu || menu.length === 0) return <div>No menu available</div>

  return (
    <div>
      <HeroBanner />

      {chefSpecials.length > 0 && (
        <div className="featured-section">
          <h2>Chef's Special</h2>
          <div className="items-grid">
            {chefSpecials.slice(0, 6).map((item) => (
              <DishItem key={item._id} item={item} />
            ))}
          </div>
        </div>
      )}

      {menu.map((section) => (
        <div key={section._id} className="section">
          <h2>{section.name_en}</h2>
          {section.description_en && <p>{section.description_en}</p>}
          <div className="items-grid">
            {section.items.map((item) => (
              <DishItem key={item._id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Key Changes:**
- Remove `import menuData`
- Add hooks: `useMenuData()` and `useFeaturedItems()`
- Handle loading and error states
- Use `_id` instead of `id` (MongoDB field names)
- Use `name_en` instead of `name`
- Show featured items using helper hook
- Use `section._id` instead of `section.id`

---

### Example 2: Search Bar with API

#### BEFORE (Static Data)
```typescript
// src/components/SearchBar.tsx
import { useState } from 'react'
import menuData from '@/data/menuData'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])

  const handleSearch = (value: string) => {
    setQuery(value)
    
    if (!value) {
      setResults([])
      return
    }

    const filtered = menuData.sections
      .flatMap((s) => s.items)
      .filter((item) =>
        item.name.toLowerCase().includes(value.toLowerCase())
      )
    
    setResults(filtered)
  }

  return (
    <div className="search-bar">
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search menu..."
      />
      {results.length > 0 && (
        <div className="results">
          {results.map((item) => (
            <div key={item.id} className="result-item">
              {item.name} - {item.price}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

#### AFTER (API Integration)
```typescript
// src/components/SearchBar.tsx
import { useState } from 'react'
import { useAllMenuItems, useMenuFilter } from '@/hooks/useMenuAPI'

export function SearchBar() {
  const { items, loading: itemsLoading } = useAllMenuItems()
  const { filteredItems, handleSearch } = useMenuFilter(items)
  const [query, setQuery] = useState('')

  const handleInputChange = (value: string) => {
    setQuery(value)
    handleSearch(value)
  }

  if (itemsLoading) return <div>Loading search...</div>

  return (
    <div className="search-bar">
      <input
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="Search menu..."
      />
      {query && filteredItems.length > 0 && (
        <div className="results">
          {filteredItems.map((item) => (
            <div key={item._id} className="result-item">
              <strong>{item.name_en}</strong>
              <span className="price">SR {item.price}</span>
            </div>
          ))}
        </div>
      )}
      {query && filteredItems.length === 0 && (
        <div className="no-results">No items found</div>
      )}
    </div>
  )
}
```

**Key Changes:**
- Remove `import menuData`
- Add: `useAllMenuItems()` and `useMenuFilter()` hooks
- Use `handleSearch()` from hook instead of manual filtering
- Show loading state
- Handle empty results message
- Use `_id` and `name_en` instead of old field names
- Display "SR" currency code

---

### Example 3: Filter Tags Component

#### BEFORE (Static)
```typescript
// src/components/FilterDrawer.tsx
import menuData from '@/data/menuData'

export function FilterDrawer() {
  const tags = menuData.filterTags

  const handleFilterClick = (tagId: string) => {
    // Local state only - not functional
    console.log('Filter clicked:', tagId)
  }

  return (
    <div className="filter-drawer">
      <h3>Filters</h3>
      <div className="filter-tags">
        {tags.map((tag) => (
          <button key={tag.id} onClick={() => handleFilterClick(tag.id)}>
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  )
}
```

#### AFTER (API Integration)
```typescript
// src/components/FilterDrawer.tsx
import { useState } from 'react'
import { useFilterTags, useAllMenuItems, useMenuFilter } from '@/hooks/useMenuAPI'

export function FilterDrawer({ onFilter }: { onFilter?: (items: any[]) => void }) {
  const { tags, loading: tagsLoading } = useFilterTags()
  const { items } = useAllMenuItems()
  const { filteredItems, handleFilterTags } = useMenuFilter(items)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const handleTagClick = (tagId: string) => {
    let newSelected: string[]
    
    if (selectedTags.includes(tagId)) {
      newSelected = selectedTags.filter((id) => id !== tagId)
    } else {
      newSelected = [...selectedTags, tagId]
    }

    setSelectedTags(newSelected)
    
    // Apply filter
    const filtered = newSelected.length > 0
      ? items.filter((item) =>
          newSelected.every((tagId) =>
            item.filter_tags?.includes(tagId)
          )
        )
      : items

    onFilter?.(filtered)
  }

  if (tagsLoading) return <div>Loading filters...</div>

  return (
    <div className="filter-drawer">
      <h3>Filters ({tags.length})</h3>
      <div className="filter-tags">
        {tags.map((tag) => (
          <button
            key={tag._id}
            onClick={() => handleTagClick(tag._id)}
            className={selectedTags.includes(tag._id) ? 'active' : ''}
          >
            {tag.name_en}
            {tag.badge_type && <span className="badge">{tag.badge_type}</span>}
          </button>
        ))}
      </div>
      <div className="clear-filters">
        {selectedTags.length > 0 && (
          <button onClick={() => {
            setSelectedTags([])
            onFilter?.(items)
          }}>
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}
```

**Key Changes:**
- Remove `import menuData`
- Add: `useFilterTags()` and `useMenuFilter()` hooks
- Track selected tags with state
- Pass filtered items to parent via callback
- Toggle selection on click
- Show active state for selected filters
- Add "Clear Filters" button
- Handle loading state
- Use `_id` and `name_en` fields

---

### Example 4: DishItem with Dynamic Fields

#### BEFORE (Static)
```typescript
// src/components/DishItem.tsx
export function DishItem({ item }: { item: any }) {
  return (
    <div className="dish-card">
      <img src={item.image} alt={item.name} />
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <div className="price">SR {item.price}</div>
      <button>Add to Cart</button>
    </div>
  )
}
```

#### AFTER (API Integration with Dynamic Fields)
```typescript
// src/components/DishItem.tsx
interface MenuItemData {
  _id: string
  name_en: string
  name_ar: string
  description_en: string
  description_ar: string
  price: number
  image_url?: string
  spice_level?: number
  country_code?: string
  allergens?: string[]
  dietary_tags?: string[]
  available_from?: string
  available_to?: string
  available_days?: string[]
}

export function DishItem({ item }: { item: MenuItemData }) {
  return (
    <div className="dish-card">
      {item.image_url && (
        <img src={item.image_url} alt={item.name_en} />
      )}

      <h3>{item.name_en}</h3>
      {item.name_ar && <p className="name-ar">{item.name_ar}</p>}

      <p className="description">{item.description_en}</p>

      <div className="price">SR {item.price}</div>

      {/* Dynamic Fields */}
      <div className="metadata">
        {/* Spice Level */}
        {item.spice_level !== undefined && (
          <div className="spec">
            <span className="label">Spice:</span>
            <span>
              {'🌶️'.repeat(item.spice_level)}
              {item.spice_level === 0 ? '🥬' : ''} ({item.spice_level}/3)
            </span>
          </div>
        )}

        {/* Country Code */}
        {item.country_code && (
          <div className="spec">
            <span className="label">Origin:</span>
            <span>{item.country_code}</span>
          </div>
        )}

        {/* Dietary Tags */}
        {item.dietary_tags && item.dietary_tags.length > 0 && (
          <div className="spec">
            {item.dietary_tags.map((tag) => (
              <span key={tag} className="badge dietary">
                {tag === 'vegetarian' && '🥬'}
                {tag === 'vegan' && '🌱'}
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Allergens */}
        {item.allergens && item.allergens.length > 0 && (
          <div className="spec">
            <span className="label">Allergens:</span>
            <span>{item.allergens.join(', ')}</span>
          </div>
        )}

        {/* Availability Times */}
        {item.available_from && item.available_to && (
          <div className="spec">
            <span className="label">Available:</span>
            <span>
              {item.available_from.substring(0, 5)} - {item.available_to.substring(0, 5)}
            </span>
          </div>
        )}

        {/* Availability Days */}
        {item.available_days && item.available_days.length > 0 && (
          <div className="spec">
            <span className="label">Days:</span>
            <span>{item.available_days.join(', ')}</span>
          </div>
        )}
      </div>

      <button className="add-to-cart">Add to Cart</button>
    </div>
  )
}
```

**Key Changes:**
- Add proper TypeScript interface
- Use `_id` and `name_en` fields
- Add image_url field
- Display all dynamic fields dynamically
- Add spice level with emoji indicators
- Show dietary tags with icons
- Display allergens if present
- Show availability windows if set
- Show available days if set
- Update field names from old to new

---

## Summary of Common Changes

### The Pattern
1. **Remove**: `import menuData from '@/data/menuData'`
2. **Add**: `import { useXXX } from '@/hooks/useMenuAPI'`
3. **Replace**: Static data assignments with hook calls
4. **Update**: Field names from old to MongoDB field names
   - `id` → `_id`
   - `name` → `name_en` (or `name_ar` for Arabic)
   - `description` → `description_en` (or `description_ar`)
5. **Add**: Loading and error states
6. **Handle**: Empty data case

### Field Name Mapping Reference
| Old Field | New Field |
|-----------|-----------|
| `id` | `_id` |
| `name` | `name_en`, `name_ar` |
| `description` | `description_en`, `description_ar` |
| `price` | `price` (same) |
| `image` | `image_url` |
| `category` | `category_id` |
| (new) | `spice_level` |
| (new) | `country_code` |
| (new) | `allergens` |
| (new) | `dietary_tags` |
| (new) | `available_from`, `available_to` |
| (new) | `available_days` |

---

## Testing After Updates

After making changes, test:
1. ✅ Page loads without console errors
2. ✅ Data displays correctly
3. ✅ Loading spinner shows while fetching
4. ✅ Error message shows on API failure
5. ✅ Actions (create/update/delete) work
6. ✅ Dynamic fields display if present
7. ✅ Filter/search results are correct
8. ✅ TypeScript compilation has no errors

