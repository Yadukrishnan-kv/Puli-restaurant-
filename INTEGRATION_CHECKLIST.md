# Frontend Integration Quick Start Checklist

Quick reference checklist for integrating API with both frontend applications.

## Pre-Integration Setup

- [ ] Backend running: `npm run dev` in `puli-mern-backend-v2`
- [ ] MongoDB connection verified in backend `.env`
- [ ] Both frontends have `.env.example` files (auto-created)
- [ ] Node modules installed in both frontends: `npm install`

## Admin Frontend (`puli-digimenu-adminV2`) - Step by Step

### Setup
- [ ] Copy `.env.example` to `.env`:
  ```bash
  cp puli-digimenu-adminV2/.env.example puli-digimenu-adminV2/.env
  ```
- [ ] Verify `VITE_API_URL=http://localhost:5000` in `.env`
- [ ] Test connection: `curl http://localhost:5000/api/health` (or similar)

### Code Changes
- [ ] **App.tsx** - Add `useAdminData()` hook on mount:
  ```typescript
  import { useAdminData } from '@/hooks/useAdminData'
  
  const { loading, error, isLoggedIn, loadAllData } = useAdminData()
  useEffect(() => {
    if (isLoggedIn && !loading) loadAllData()
  }, [isLoggedIn, loading])
  ```

- [ ] **Login Page** - Update to use API:
  ```typescript
  import { useAdminData } from '@/hooks/useAdminData'
  
  const { handleLogin } = useAdminData({ autoLoad: false })
  // Call handleLogin(email, password) on form submit
  ```

- [ ] **MenuItems.tsx** - Replace static store init with API:
  ```typescript
  // OLD: const items = useStore((s) => s.menuItems)
  // NEW: Items loaded automatically from useAdminData()
  
  // For mutations:
  const newItem = await adminAPI.createMenuItem(itemData)
  const updated = await adminAPI.updateMenuItem(id, data)
  await adminAPI.deleteMenuItem(id)
  ```

- [ ] **Categories.tsx** - Same pattern as MenuItems

- [ ] **MenuSections.tsx** - Same pattern:
  ```typescript
  const sections = useStore((s) => s.sections)
  await adminAPI.createMenuSection(data)
  await adminAPI.updateMenuSection(id, data)
  await adminAPI.deleteMenuSection(id)
  ```

- [ ] **Classifications.tsx** - Same pattern

- [ ] **Filters.tsx** (FilterTags) - Same pattern:
  ```typescript
  const tags = useStore((s) => s.filters)
  await adminAPI.createFilterTag(data)
  ```

- [ ] **Banner.tsx** - Single item pattern:
  ```typescript
  import { useAdminData } from '@/hooks/useAdminData'
  
  const banner = useStore((s) => s.banner)
  const { handleUpdate } = useAdminMutations()
  
  await adminAPI.updateBanner(bannerData)
  ```

- [ ] **Story.tsx** - Single item pattern:
  ```typescript
  const story = useStore((s) => s.story)
  await adminAPI.updateStory(storyData)
  ```

- [ ] **Settings.tsx** - Single item pattern:
  ```typescript
  const settings = useStore((s) => s.settings)
  await adminAPI.updateSettings(settingsData)
  ```

- [ ] **Dashboard.tsx** - Verify data loads:
  - Should show sections, categories, items, etc. from store
  - All loaded by `useAdminData()` on app mount

### Testing
- [ ] Admin app starts without errors: `npm run dev`
- [ ] Login page displays
- [ ] Can login with `admin@puli.com` / `Admin123456!`
- [ ] Dashboard displays menu sections
- [ ] Can create new menu item
- [ ] Can update existing item
- [ ] Can delete item
- [ ] Can edit categories
- [ ] Can edit filter tags
- [ ] Can update banner
- [ ] Can update story
- [ ] Can update settings
- [ ] Logout works properly

---

## Customer Frontend (`puli-digital-menu_V2`) - Step by Step

### Setup
- [ ] Copy `.env.example` to `.env`:
  ```bash
  cp puli-digital-menu_V2/.env.example puli-digital-menu_V2/.env
  ```
- [ ] Verify `VITE_API_URL=http://localhost:5000` in `.env`

### Code Changes

- [ ] **HomePage.tsx** - Replace static data:
  ```typescript
  // REMOVE: import menuData from '@/data/menuData'
  
  // ADD:
  import { useMenuData, useFeaturedItems } from '@/hooks/useMenuAPI'
  
  const { menu, loading, error } = useMenuData()
  const { chefSpecials, popularItems } = useFeaturedItems(menu?.flatMap((s) => s.items) || [])
  
  // Use `menu` instead of `menuData.sections`
  // Use `chefSpecials` for featured section
  ```

- [ ] **CategoryPage.tsx** - Replace static data:
  ```typescript
  import { useMenuData } from '@/hooks/useMenuAPI'
  
  const { menu, loading } = useMenuData()
  const categoryItems = menu?.find(s => s.items.some(i => i.category_id === catId))?.items || []
  // Use `categoryItems` instead of static filtered data
  ```

- [ ] **SearchBar/SearchMegaDropdown.tsx** - Add API-based search:
  ```typescript
  import { useAllMenuItems, useMenuFilter } from '@/hooks/useMenuAPI'
  
  const { items, loading } = useAllMenuItems()
  const { filteredItems, handleSearch } = useMenuFilter(items)
  
  onChange={(e) => handleSearch(e.target.value)}
  // Display `filteredItems` instead of static search results
  ```

- [ ] **FilterDrawer.tsx** - Replace static filters:
  ```typescript
  import { useFilterTags } from '@/hooks/useMenuAPI'
  
  const { tags, loading } = useFilterTags()
  // Use `tags` for filter options instead of static data
  ```

- [ ] **DishItem.tsx** - Update to show dynamic fields:
  ```typescript
  {item.spice_level !== undefined && (
    <span>🌶️ {item.spice_level}/3</span>
  )}
  {item.country_code && <span>{item.country_code}</span>}
  {item.allergens?.length > 0 && (
    <span>Allergens: {item.allergens.join(', ')}</span>
  )}
  // Show all available fields from backend
  ```

- [ ] **CustomDropdown.tsx** - If used for categories:
  ```typescript
  import { useCategories } from '@/hooks/useMenuAPI'
  
  const { categories, loading } = useCategories()
  // Use `categories` for dropdown options
  ```

- [ ] **HeroBanner.tsx** - Get banner from backend:
  ```typescript
  // If your backend has banner API, fetch it
  const bannerData = await customerAPI.getBanner()
  // Use banner image/text from API instead of static
  ```

- [ ] **StorySection.tsx** - Get story from backend:
  ```typescript
  // Fetch from backend if API provides it
  const storyData = await customerAPI.getStory()
  ```

- [ ] **Delete static data file:**
  ```bash
  rm src/data/menuData.ts
  ```
  - Search codebase for any remaining `menuData` imports
  - Replace with hook imports
  - Fix any TypeScript errors

### Testing
- [ ] Customer app starts without errors: `npm run dev`
- [ ] HomePage displays menu from backend
- [ ] Categories show with correct items
- [ ] Search works (searches backend data)
- [ ] Filter tags are displayed
- [ ] Can filter by allergens
- [ ] Spice level displays correctly
- [ ] Country code shows if present
- [ ] Dietary tags show (e.g., vegetarian badge)
- [ ] Price displays correctly
- [ ] Featured/popular items show
- [ ] Load times are acceptable
- [ ] No console errors

---

## Verification Commands

### Backend Health Check
```bash
# Test backend is running
curl http://localhost:5000/api/health

# Get menu items (public endpoint)
curl http://localhost:5000/api/public/menu-items

# Get categories (public endpoint)
curl http://localhost:5000/api/public/categories
```

### Admin Frontend Check
```bash
# Admin app should start without errors
cd puli-digimenu-adminV2/puli-digimenu-adminV2/
npm run dev

# Check for TypeScript errors
npm run build
```

### Customer Frontend Check
```bash
# Customer app should start without errors
cd puli-digital-menu_V2/puli-digital-menu_V2/
npm run dev

# Check for TypeScript errors
npm run build
```

---

## Common Issues & Quick Fixes

### Issue: "Cannot find module '@/lib/adminAPI'"
**Fix:** 
1. Verify files exist: `src/lib/adminAPI.ts`, `src/hooks/useAdminData.ts`
2. Check `tsconfig.json` has proper paths configuration
3. Restart dev server: `npm run dev`

### Issue: "CORS error: Access-Control-Allow-Origin"
**Fix:**
1. Verify backend is running: `npm run dev` in backend directory
2. Check `VITE_API_URL` matches backend URL
3. Restart both frontend and backend

### Issue: "401 Unauthorized" on every request
**Fix:**
1. Login first (admin frontend)
2. Check token is saved in localStorage
3. Verify backend token is less than 8 hours old

### Issue: Menu not loading in customer app
**Fix:**
1. Check backend has items in MongoDB: `db.menuItems.find()`
2. Test endpoint: `curl http://localhost:5000/api/public/menu-items`
3. Verify `useMenuData()` is called before rendering

### Issue: TypeScript errors about types
**Fix:**
1. Check `src/types/index.ts` has all required types
2. Verify API response matches expected interface
3. Use `any` temporarily if needed, then fix types

### Issue: Store not updating after create/update/delete
**Fix:**
1. Verify mutation hook is being called correctly
2. Check API returns new/updated data
3. Ensure store actions are defined in Zustand store
4. Log API response to verify it's correct

---

## Integration Timeline

Estimated time to complete full integration:

- **Setup (.env files)**: 5 minutes
- **Admin frontend updates**: 1-2 hours
  - Login page: 15 min
  - App.tsx + Menu items: 30 min
  - Categories + Classifications: 20 min
  - Sections + Tags + Banner/Story/Settings: 30 min
  - Testing: 15 min

- **Customer frontend updates**: 1-1.5 hours
  - HomePage: 20 min
  - CategoryPage: 15 min
  - Search/Filter: 20 min
  - DishItem updates: 10 min
  - Delete old files + fixes: 15 min
  - Testing: 20 min

- **Total**: 2-3.5 hours for complete integration

---

## Files Modified Summary

### Admin Frontend Files to Update
- `src/App.tsx` - Add hook initialization
- `src/pages/Dashboard.tsx` - Add loading state
- `src/pages/Login.tsx` (or create) - Add login form
- `src/pages/MenuItems.tsx` - Replace store with API
- `src/pages/Categories.tsx` - Replace store with API
- `src/pages/MenuLayout.tsx` - Replace store with API
- `src/pages/Filters.tsx` - Replace store with API
- `src/pages/Banner.tsx` - Replace store with API
- `src/pages/Story.tsx` - Replace store with API
- `src/pages/Settings.tsx` - Replace store with API

### Customer Frontend Files to Update
- `.env.example` → `.env` - Set VITE_API_URL
- `src/pages/HomePage.tsx` - Add hooks, remove menuData import
- `src/pages/CategoryPage.tsx` - Add hooks
- `src/components/SearchBar.tsx` - Add search hook
- `src/components/FilterDrawer.tsx` - Add filter hooks
- `src/components/DishItem.tsx` - Update fields display
- `src/data/menuData.ts` - DELETE THIS FILE
- Any other files importing menuData - Update imports

### Both Frontends
- `.env` (created from .env.example)
- `src/.env.local` (optional, for local dev)

---

## Success Criteria

After integration is complete:

✅ Admin frontend:
- Can login with credentials
- Menu data loads from backend on app start
- Can view all menu sections, categories, items
- Can create new items/categories/sections
- Can edit existing items/categories/sections
- Can delete items/categories/sections
- Can manage tags, banner, story, settings
- No console errors or warnings

✅ Customer frontend:
- Can browse menu from backend
- Can search menu items
- Can filter by allergens/tags/spice level
- Can see featured/popular items
- Dynamic fields display (spice, country, allergens)
- No console errors or warnings
- Same menu content as backend

✅ Both:
- No CORS errors
- No TypeScript compilation errors
- No 404 errors when accessing API
- All features work smoothly

---

## Need Help?

1. **API Documentation**: See `puli-mern-backend-v2/DOCUMENTATION.md`
2. **Example Code**: See `src/examples/` folder in each frontend
3. **Type Definitions**: Check `src/lib/adminAPI.ts` and `src/lib/customerAPI.ts`
4. **Integration Guide**: See `FRONTEND_INTEGRATION_GUIDE.md` (detailed guide)

