# Frontend API Integration Guide

Complete guide for integrating the backend API with both frontend applications.

## Table of Contents
1. [Setup](#setup)
2. [Admin Frontend Integration](#admin-frontend-integration)
3. [Customer Frontend Integration](#customer-frontend-integration)
4. [API Reference Summary](#api-reference-summary)
5. [Troubleshooting](#troubleshooting)

---

## Setup

### Prerequisites
- Backend running: `npm run dev` in `puli-mern-backend-v2` directory
- MongoDB connection configured in backend `.env`
- Both frontend projects have `.env.example` files created

### Step 1: Create .env files in both frontends

**Admin Frontend:**
```bash
cd puli-digimenu-adminV2/puli-digimenu-adminV2/
cp .env.example .env
```

**Customer Frontend:**
```bash
cd puli-digital-menu_V2/puli-digital-menu_V2/
cp .env.example .env
```

### Step 2: Update .env if backend runs on different port
If backend is not on localhost:5000, update `VITE_API_URL`:
```
VITE_API_URL=http://your-backend-url:port
```

### Step 3: Install dependencies (if not already done)
```bash
npm install
```

---

## Admin Frontend Integration

**Location:** `puli-digimenu-adminV2/puli-digimenu-adminV2/`

### Core Files
- `src/lib/adminAPI.ts` - API client class
- `src/hooks/useAdminData.ts` - React hooks for data management
- `src/store/useStore.ts` - Zustand store (already exists)

### Integration Steps

#### Step 1: Create Login Page/Component

Replace or update your login page to use the API:

```typescript
// src/pages/Login.tsx
import { useState } from 'react'
import { useAdminData } from '@/hooks/useAdminData'

export function LoginPage() {
  const [email, setEmail] = useState('admin@puli.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { handleLogin } = useAdminData({ autoLoad: false })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await handleLogin(email, password)
      // Redirect on success
      navigate('/dashboard')
    } catch (err) {
      console.error('Login failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

#### Step 2: Update App.tsx to load data on mount

```typescript
// src/App.tsx
import { useEffect } from 'react'
import { useAdminData } from '@/hooks/useAdminData'

function App() {
  const { loading, error, isLoggedIn, loadAllData } = useAdminData()

  useEffect(() => {
    if (isLoggedIn && !loading) {
      loadAllData()
    }
  }, [isLoggedIn])

  if (!isLoggedIn) return <LoginPage />
  if (loading) return <div>Loading menu data...</div>
  if (error) return <div>Error loading data: {error}</div>

  return (
    <MainLayout>
      <Dashboard />
    </MainLayout>
  )
}

export default App
```

#### Step 3: Update Menu Items Page to use CRUD

```typescript
// src/pages/MenuItems.tsx
import { useAdminData } from '@/hooks/useAdminData'
import { useStore } from '@/store/useStore'

export function MenuItemsPage() {
  const { loading } = useAdminData()
  const menuItems = useStore((s) => s.menuItems)
  const { createMenuItem, updateMenuItem, deleteMenuItem } = useStore(
    (s) => s
  )

  const handleCreate = async (itemData: MenuItemInput) => {
    try {
      const newItem = await adminAPI.createMenuItem(itemData)
      // Store will be updated by hook
    } catch (err) {
      // Handle error
    }
  }

  const handleUpdate = async (id: string, itemData: Partial<MenuItem>) => {
    try {
      const updated = await adminAPI.updateMenuItem(id, itemData)
      // Store will be updated
    } catch (err) {
      // Handle error
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      await adminAPI.deleteMenuItem(id)
      // Store will be updated
    } catch (err) {
      // Handle error
    }
  }

  if (loading) return <div>Loading items...</div>

  return (
    <div>
      <h1>Menu Items</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Visible</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {menuItems.map((item) => (
            <tr key={item._id}>
              <td>{item.name_en}</td>
              <td>{item.category_id}</td>
              <td>{item.price}</td>
              <td>{item.visible ? 'Yes' : 'No'}</td>
              <td>
                <button onClick={() => handleUpdate(item._id, {})}>
                  Edit
                </button>
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

#### Step 4: Update similar pages for:
- Categories
- Classifications
- Menu Sections
- Filter Tags
- Banner
- Story
- Settings

All follow the same pattern:
1. Get data from store
2. Use `adminAPI.createX()`, `adminAPI.updateX()`, `adminAPI.deleteX()` for mutations
3. Handle errors and loading states

---

## Customer Frontend Integration

**Location:** `puli-digital-menu_V2/puli-digital-menu_V2/`

### Core Files
- `src/lib/customerAPI.ts` - API client class
- `src/hooks/useMenuAPI.ts` - React hooks for menu operations
- `src/data/menuData.ts` - Remove this (old static data)

### Integration Steps

#### Step 1: Update HomePage.tsx

**Before:**
```typescript
import menuData from '@/data/menuData'

export function HomePage() {
  return (
    <div>
      {menuData.sections.map((section) => (
        // render section
      ))}
    </div>
  )
}
```

**After:**
```typescript
import { useMenuData, useFeaturedItems } from '@/hooks/useMenuAPI'

export function HomePage() {
  const { menu, loading, error } = useMenuData()
  const { chefSpecials, popularItems } = useFeaturedItems(
    menu?.flatMap((s) => s.items) || []
  )

  if (loading) return <div>Loading menu...</div>
  if (error) return <div>Error: {error}</div>
  if (!menu?.length) return <div>No menu data</div>

  return (
    <div>
      {/* Featured Section */}
      <section className="featured">
        <h2>Chef's Specials</h2>
        {chefSpecials.slice(0, 6).map((item) => (
          <DishItem key={item._id} item={item} />
        ))}
      </section>

      {/* All Sections */}
      {menu.map((section) => (
        <section key={section._id}>
          <h2>{section.name_en}</h2>
          <div className="items-grid">
            {section.items.map((item) => (
              <DishItem key={item._id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
```

#### Step 2: Update CategoryPage.tsx

```typescript
import { useMenuData } from '@/hooks/useMenuAPI'
import { useParams } from 'react-router-dom'

export function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const { menu, loading } = useMenuData()

  const category = menu?.find((s) =>
    s.items.some((i) => i.category_id === categoryId)
  )
  const items = category?.items || []

  if (loading) return <div>Loading...</div>
  if (!items.length) return <div>No items in this category</div>

  return (
    <div>
      <h1>{category?.name_en}</h1>
      <div className="items-grid">
        {items.map((item) => (
          <DishItem key={item._id} item={item} />
        ))}
      </div>
    </div>
  )
}
```

#### Step 3: Update Search/Filter Component

```typescript
import {
  useAllMenuItems,
  useMenuFilter,
  useFilterTags,
} from '@/hooks/useMenuAPI'

export function SearchBar() {
  const { items, loading } = useAllMenuItems()
  const { tags } = useFilterTags()
  const { filteredItems, handleSearch, handleFilterTags, handleSort } =
    useMenuFilter(items)

  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Search menu..."
        onChange={(e) => handleSearch(e.target.value)}
        className="search-input"
      />

      <select onChange={(e) => handleSort(e.target.value as any)}>
        <option value="order">Default</option>
        <option value="name">Name (A-Z)</option>
        <option value="price-asc">Price (Low to High)</option>
        <option value="price-desc">Price (High to Low)</option>
      </select>

      <div className="filter-tags">
        {tags.map((tag) => (
          <button
            key={tag._id}
            onClick={() => handleFilterTags(tag._id)}
            className="tag-btn"
          >
            {tag.name_en}
          </button>
        ))}
      </div>

      <div className="results">
        {filteredItems.map((item) => (
          <DishItem key={item._id} item={item} />
        ))}
      </div>
    </div>
  )
}
```

#### Step 4: Update DishItem Component to show dynamic fields

```typescript
export function DishItem({ item }: { item: MenuItemData }) {
  return (
    <div className="dish-card">
      <h3>{item.name_en}</h3>
      <p className="description">{item.description_en}</p>

      <div className="price">SR {item.price}</div>

      {/* Dynamic Fields */}
      {item.spice_level !== undefined && (
        <div className="spice-badge">
          {'🌶️'.repeat(item.spice_level) || 'No Spice'} ({item.spice_level}/3)
        </div>
      )}

      {item.country_code && <div className="country">{item.country_code}</div>}

      {item.dietary_tags?.includes('vegetarian') && (
        <div className="veg-badge">🥬 Vegetarian</div>
      )}

      {item.allergens?.length > 0 && (
        <div className="allergens">
          Allergens: {item.allergens.join(', ')}
        </div>
      )}

      {item.available_from && item.available_to && (
        <div className="availability">
          Available {item.available_from} - {item.available_to}
        </div>
      )}

      <button className="add-to-cart">Add to Cart</button>
    </div>
  )
}
```

#### Step 5: Delete old static data file

```bash
rm src/data/menuData.ts
```

Update any imports of menuData to use the hooks instead.

---

## API Reference Summary

### Admin API Methods

**Authentication:**
- `adminAPI.login(email, password)` → `{ token, user }`
- `adminAPI.setToken(token)` - Sets JWT token for auth
- `adminAPI.clearToken()` - Clears token on logout

**Menu Sections:**
- `getMenuSections()` → MenuSection[]
- `createMenuSection(data)` → MenuSection
- `updateMenuSection(id, data)` → MenuSection
- `deleteMenuSection(id)` → void

**Categories:**
- `getCategories()` → Category[]
- `createCategory(data)` → Category
- `updateCategory(id, data)` → Category
- `deleteCategory(id)` → void

**Menu Items:**
- `getMenuItems()` → MenuItem[]
- `getMenuItem(id)` → MenuItem
- `createMenuItem(data)` → MenuItem
- `updateMenuItem(id, data)` → MenuItem
- `deleteMenuItem(id)` → void

**Classifications:**
- `getClassifications()` → Classification[]
- `createClassification(data)` → Classification
- `updateClassification(id, data)` → Classification
- `deleteClassification(id)` → void

**Filter Tags:**
- `getFilterTags()` → FilterTag[]
- `createFilterTag(data)` → FilterTag
- `updateFilterTag(id, data)` → FilterTag
- `deleteFilterTag(id)` → void

**Banner & Story:**
- `getBanner()` → Banner
- `updateBanner(data)` → Banner
- `getStory()` → Story
- `updateStory(data)` → Story

**Settings & Logs:**
- `getSettings()` → Settings
- `updateSettings(data)` → Settings
- `getActivityLog(filters)` → ActivityLog[]

### Customer API Methods

**Menu Data:**
- `getMenu()` → MenuData[] (hierarchical structure)
- `getAllMenuItems()` → MenuItemData[] (flat list)
- `getCategories()` → CategoryData[]
- `getFilterTags()` → FilterTagData[]

**Utility Methods:**
- `filterByAllergens(items, allergens)` → MenuItemData[]
- `filterByTags(items, tagIds)` → MenuItemData[]
- `filterBySpiceLevel(items, level)` → MenuItemData[]
- `filterByCountry(items, code)` → MenuItemData[]
- `searchItems(items, query)` → MenuItemData[]
- `sortItems(items, sortBy)` → MenuItemData[]
- `getPopularItems(items)` → MenuItemData[]
- `getChefSpecials(items)` → MenuItemData[]
- `getVegetarianItems(items)` → MenuItemData[]

### React Hooks

**Admin Hooks:**
```typescript
// Load all menu data with auto-login check
const { 
  loading, 
  error, 
  isLoggedIn, 
  loadAllData,
  handleLogin,
  handleLogout 
} = useAdminData(options?: { autoLoad?: boolean })

// CRUD mutations
const { 
  createMenuItem, 
  updateMenuItem, 
  deleteMenuItem,
  // ... similar for other entities
} = useAdminMutations()
```

**Customer Hooks:**
```typescript
// Get full menu hierarchy
const { menu, loading, error } = useMenuData()

// Get all items in flat list
const { items, loading, error } = useAllMenuItems()

// Get categories
const { categories, loading, error } = useCategories()

// Get filter tags
const { tags, loading, error } = useFilterTags()

// Apply filters and search
const { filteredItems, handleSearch, handleFilterAllergens, handleFilterTags, handleFilterSpiceLevel, handleSort } = useMenuFilter(items)

// Get featured items
const { popularItems, chefSpecials, vegetarianItems } = useFeaturedItems(items)
```

---

## Troubleshooting

### "CORS error" or "Failed to fetch"
**Cause:** Backend not running or CORS not configured
**Solution:**
1. Verify backend is running: `npm run dev` in `puli-mern-backend-v2`
2. Check `VITE_API_URL` in frontend `.env` matches backend URL
3. Check backend has CORS middleware enabled

### "401 Unauthorized"
**Cause:** JWT token expired or invalid
**Solution:**
1. Login again
2. Token is saved in localStorage after login
3. Token lasts 8 hours from creation
4. Clear localStorage and login fresh if stuck

### "Cannot find module '@/hooks/useMenuAPI'"
**Cause:** TypeScript path alias not configured
**Solution:**
1. Check `tsconfig.json` has `"paths": { "@/*": ["src/*"] }`
2. Restart dev server after updating tsconfig

### Store not updating after API call
**Cause:** Hook not properly connecting to store
**Solution:**
1. Verify `useAdminData()` is called on component mount
2. Check store actions are being called in hooks
3. Verify API response has correct field names

### Items not loading in customer app
**Cause:** Menu data not fetched or empty
**Solution:**
1. Verify backend has menu items (check MongoDB)
2. Check `useMenuData()` is properly called in component
3. Verify API endpoint returns data: `GET http://localhost:5000/api/public/menu`

### Filter/Search not working
**Cause:** `useMenuFilter()` not properly initialized
**Solution:**
1. Ensure items array is passed to hook
2. Check item data has correct field names (name_en, name_ar, etc.)
3. Verify search query is being passed to `handleSearch()`

---

## Next Steps

1. ✅ Create `.env` files in both frontends
2. ✅ Update Login page to use `adminAPI.login()`
3. ✅ Update App.tsx to call `loadAllData()` on mount
4. ✅ Update all admin pages to use API hooks
5. ✅ Update HomePage.tsx to use `useMenuData()`
6. ✅ Update CategoryPage.tsx to use menu data
7. ✅ Update search/filter to use hooks
8. ✅ Delete old static data (`menuData.ts`)
9. ✅ Test full integration with running backend
10. ✅ Deploy both frontends with production API URL

---

## Support

For API response examples, see the backend documentation at:
`puli-mern-backend-v2/DOCUMENTATION.md`

For type definitions, see:
- Admin: `puli-digimenu-adminV2/src/types/index.ts`
- Customer: Check interfaces in `customerAPI.ts`
