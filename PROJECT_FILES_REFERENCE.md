# Project File Structure & API Integration Files

Complete reference for all files created for API integration.

## Repository Structure

```
Puli/
├── puli-digimenu-adminV2/                 # Admin Panel Frontend
│   └── puli-digimenu-adminV2/
│       ├── src/
│       │   ├── lib/
│       │   │   └── adminAPI.ts            ✨ NEW - Admin API Client
│       │   ├── hooks/
│       │   │   └── useAdminData.ts        ✨ NEW - Admin Data Hooks
│       │   ├── examples/
│       │   │   └── AdminAPIIntegration.tsx ✨ NEW - Example Code
│       │   ├── pages/
│       │   │   ├── Dashboard.tsx          (update needed)
│       │   │   ├── MenuItems.tsx          (update needed)
│       │   │   ├── Categories.tsx         (update needed)
│       │   │   ├── MenuLayout.tsx         (update needed)
│       │   │   ├── Filters.tsx            (update needed)
│       │   │   ├── Banner.tsx             (update needed)
│       │   │   ├── Story.tsx              (update needed)
│       │   │   ├── Settings.tsx           (update needed)
│       │   │   ├── Translations.tsx
│       │   │   ├── Scheduling.tsx
│       │   │   └── Featured.tsx
│       │   ├── store/
│       │   │   └── useStore.ts            (existing - unchanged)
│       │   ├── types/
│       │   │   └── index.ts               (verify types match API)
│       │   ├── App.tsx                    (update needed)
│       │   ├── main.tsx
│       │   └── index.css
│       ├── .env.example                   ✨ NEW - Environment Template
│       ├── .env                           (create from .env.example)
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
│
├── puli-digital-menu_V2/                  # Customer Frontend
│   └── puli-digital-menu_V2/
│       ├── src/
│       │   ├── lib/
│       │   │   └── customerAPI.ts         ✨ NEW - Customer API Client
│       │   ├── hooks/
│       │   │   └── useMenuAPI.ts          ✨ NEW - Menu Data Hooks
│       │   ├── examples/
│       │   │   └── CustomerAPIIntegration.tsx ✨ NEW - Example Code
│       │   ├── pages/
│       │   │   ├── HomePage.tsx           (update needed)
│       │   │   └── CategoryPage.tsx       (update needed)
│       │   ├── components/
│       │   │   ├── SearchBar.tsx          (update needed)
│       │   │   ├── FilterDrawer.tsx       (update needed)
│       │   │   ├── DishItem.tsx           (update needed)
│       │   │   ├── HeroBanner.tsx         (optional update)
│       │   │   ├── StorySection.tsx       (optional update)
│       │   │   └── CategoryGrid.tsx
│       │   ├── data/
│       │   │   └── menuData.ts            ⚠️ DELETE THIS
│       │   ├── context/
│       │   │   └── FilterContext.tsx
│       │   ├── hooks/
│       │   │   └── useTheme.tsx
│       │   ├── i18n/
│       │   │   └── config.ts
│       │   ├── styles/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── vite-env.d.ts
│       ├── .env.example                   ✨ NEW - Environment Template
│       ├── .env                           (create from .env.example)
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
│
├── puli-mern-backend-v2/                  # Backend API Server
│   ├── server.js                          (main Express app - already exists)
│   ├── models/
│   │   ├── MenuItem.js
│   │   ├── Category.js
│   │   ├── Classification.js
│   │   ├── MenuSection.js
│   │   ├── FilterTag.js
│   │   ├── Banner.js
│   │   ├── Story.js
│   │   ├── Settings.js
│   │   ├── User.js
│   │   └── ActivityLog.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── logging.js
│   ├── .env                               (with MONGO_URI, JWT_SECRET)
│   ├── package.json
│   └── README.md
│
├── FRONTEND_INTEGRATION_GUIDE.md          ✨ NEW - Detailed Integration Guide
├── INTEGRATION_CHECKLIST.md               ✨ NEW - Step-by-Step Checklist
├── BEFORE_AFTER_EXAMPLES.md               ✨ NEW - Code Examples
├── Backend Docs/
│   ├── DOCUMENTATION.md
│   ├── SETUP_GUIDE.md
│   └── API_REFERENCE.md
└── README.md                              (main project README)
```

---

## Files Created in This Phase

### Admin Frontend New Files

#### 1. API Client: `src/lib/adminAPI.ts`
- **Purpose**: Centralized API client for all admin operations
- **Size**: 272 lines
- **Key Methods**:
  - Authentication: `login()`, `setToken()`, `clearToken()`
  - Menu Sections: CRUD operations
  - Categories: CRUD operations
  - Menu Items: CRUD operations (full featured with dynamic fields)
  - Classifications: CRUD operations
  - Filter Tags: CRUD operations
  - Banner: Get/Update operations
  - Story: Get/Update operations
  - Settings: Get/Update operations
  - Activity Log: Get operations
- **Features**:
  - Automatic JWT token management
  - Type-safe with interfaces
  - Error handling with 401 interception
  - Convenient `request()` method for all API calls

#### 2. React Hooks: `src/hooks/useAdminData.ts`
- **Purpose**: React hooks for admin data management
- **Size**: 174 lines
- **Hooks**:
  - `useAdminData(options?: { autoLoad?: boolean })`
    - Returns: `loading`, `error`, `isLoggedIn`, `loadAllData()`, `handleLogin()`, `handleLogout()`
    - Auto-loads all menu data if logged in
    - Integrates with Zustand store
  - `useAdminMutations()`
    - Returns custom mutation functions for CRUD operations
    - Handles individual error states
- **Features**:
  - Auto-login detection via localStorage token
  - Parallel data loading (7 endpoints simultaneously)
  - Automatic store updates
  - Error messages with user context

#### 3. Example Code: `src/examples/AdminAPIIntegration.tsx`
- **Purpose**: Reference implementations for common admin operations
- **Includes**:
  - LoginExample: Login form with API integration
  - DashboardExample: Data loading on mount
  - CreateMenuItemExample: Creating new items
  - UpdateMenuItemExample: Updating existing items
  - DeleteMenuItemExample: Deleting items
- **Type**: Functional components with hooks

#### 4. Environment Template: `.env.example`
```
VITE_API_URL=http://localhost:5000
```

---

### Customer Frontend New Files

#### 1. API Client: `src/lib/customerAPI.ts`
- **Purpose**: Centralized API client for public menu endpoints
- **Size**: 280 lines
- **Key Methods**:
  - Data fetching: `getMenu()`, `getAllMenuItems()`, `getCategories()`, `getFilterTags()`
  - Filtering: `filterByAllergens()`, `filterByTags()`, `filterBySpiceLevel()`, `filterByCountry()`
  - Searching: `searchItems(items, query)`
  - Sorting: `sortItems(items, sortBy)`
  - Featured: `getPopularItems()`, `getChefSpecials()`, `getVegetarianItems()`
- **Features**:
  - No authentication required (public endpoints)
  - Search across multiple fields (name_en, name_ar, descriptions)
  - Multiple sort options (name, price, popularity)
  - Country-based filtering
  - Spice level filtering
  - Dietary filtering (vegetarian, vegan, etc.)

#### 2. React Hooks: `src/hooks/useMenuAPI.ts`
- **Purpose**: Custom React hooks for menu data management
- **Size**: 166 lines (after fix)
- **Hooks**:
  - `useMenuData()` - Get hierarchical menu structure
  - `useAllMenuItems()` - Get flat list of all items
  - `useCategories()` - Get categories only
  - `useFilterTags()` - Get available filter tags
  - `useMenuFilter(items)` - Advanced filtering and search
  - `useFeaturedItems(items)` - Get featured/popular items
- **Features**:
  - All hooks include loading and error states
  - Search supports multiple languages (English & Arabic)
  - Filter hooks return customizable results
  - Try-catch error handling in all async operations

#### 3. Example Code: `src/examples/CustomerAPIIntegration.tsx`
- **Purpose**: Reference implementations for customer pages
- **Includes**:
  - HomePageExample: Full menu display from API
  - CategoryPageExample: Category-specific items
  - SearchAndFilterExample: Search + filtering demo
  - MenuItemDetailExample: Dynamic field display
  - VegetarianPageExample: Dietary-based filtering
  - SpiceLevelFilterExample: Browse by spice intensity
  - CountryMenuExample: Cuisine by country of origin
  - BilingualMenuExample: Switching between English/Arabic
- **Type**: Functional components with hooks

#### 4. Environment Template: `.env.example`
```
VITE_API_URL=http://localhost:5000
```

---

### Documentation Files (Root Directory)

#### 1. `FRONTEND_INTEGRATION_GUIDE.md`
- **Length**: ~600 lines
- **Sections**:
  - Setup (environment files, prerequisites)
  - Admin Frontend Integration (step by step)
  - Customer Frontend Integration (step by step)
  - API Reference Summary (all methods listed)
  - Troubleshooting (common issues and fixes)
  - Next Steps (complete task list)
- **Audience**: Developers implementing the integration

#### 2. `INTEGRATION_CHECKLIST.md`
- **Length**: ~400 lines
- **Sections**:
  - Pre-Integration Setup
  - Admin Frontend Checkbox List
  - Customer Frontend Checkbox List
  - Verification Commands
  - Common Issues & Quick Fixes
  - Integration Timeline (estimated hours)
  - Files Modified Summary
  - Success Criteria
- **Audience**: Project managers and developers tracking progress

#### 3. `BEFORE_AFTER_EXAMPLES.md`
- **Length**: ~500 lines
- **Content**:
  - Side-by-side code comparisons
  - Admin Frontend Examples:
    - MenuItems Page before/after
    - Categories Page before/after
    - Banner/Story Page before/after
  - Customer Frontend Examples:
    - HomePage before/after
    - Search Bar before/after
    - Filter Tags before/after
    - DishItem Component before/after
  - Field Name Mapping Table
  - Testing Checklist
- **Audience**: Developers doing the actual code updates

---

## Backend Files (Already Exist)

Located at: `c:\Users\yadhu\OneDrive\Desktop\CodeCarrot\Puli\puli-mern-backend-v2\`

### Models (10 total)
1. **MenuItem.js** - Core menu item model
   - Fields: name_en, name_ar, description_en/ar, price, spice_level (0-3), country_code
   - Features: available_from/to times, available_days array, allergens, dietary_tags
   - Indexes: category_id, section_id, visible, order

2. **Category.js** - Menu categories
   - Fields: name_en/ar, description_en/ar, group (enum), slug
   - Features: order field for sorting

3. **Classification.js** - Item classifications
   - Fields: name_en/ar, description_en/ar
   - Purpose: Grouping items by type/characteristic

4. **MenuSection.js** - Top-level menu sections
   - Fields: name_en/ar, description_en/ar, items array (reference)
   - Hierarchy: Section → Items + Categories

5. **FilterTag.js** - Tags for filtering
   - Fields: name_en/ar, badge_type (badge/allergen), type (dietary/allergen)
   - Features: Optional description fields

6. **Banner.js** - Homepage banner
   - Fields: title_en/ar, description_en/ar, image_url, link_url
   - Single item per instance

7. **Story.js** - Story/blog feature
   - Fields: title_en/ar, description_en/ar, image_url, content_en/ar
   - Single or multiple entries

8. **Settings.js** - App configuration
   - Fields: Dynamic key-value pairs
   - Stores: Restaurant hours, delivery info, contact details, etc.

9. **User.js** - Admin users
   - Fields: email, password (hashed), role, name
   - Password: BCryptJS hashed, never returned from API

10. **ActivityLog.js** - Audit trail
    - Fields: user_id, action, entity_type, entity_id, timestamp
    - Auto-created on all admin operations

### Middleware
1. **auth.js** - JWT verification
   - Protects admin routes
   - Verifies token validity and expiration

2. **logging.js** - Activity logging
   - Records all admin operations
   - Stores in ActivityLog collection

### API Endpoints (40+)

**Public Endpoints** (no authentication):
- GET `/api/public/menu` - Hierarchical menu
- GET `/api/public/menu-items` - Flat item list
- GET `/api/public/categories` - Categories only
- GET `/api/public/filter-tags` - Available filters

**Admin Endpoints** (JWT required):
- POST `/api/auth/login` - Authentication
- CRUD for: Sections, Categories, Classifications, Items, Tags
- GET/UPDATE for: Banner, Story, Settings
- GET `/api/logs` - Activity log

---

## Integration Status

### ✅ Complete
- [x] Backend created (26 files, 10 models, 40+ endpoints)
- [x] Admin API client created
- [x] Customer API client created
- [x] Admin hooks created
- [x] Customer hooks created
- [x] Environment templates created
- [x] Example code provided (18 example functions)
- [x] Documentation created (3 comprehensive guides)

### 🔄 In Progress
- [ ] Update admin frontend pages to use API
- [ ] Update customer frontend pages to use API
- [ ] Create .env files in both frontends
- [ ] Test integration with running backend

### ⏳ Pending
- [ ] Deploy backend with MongoDB
- [ ] Deploy admin frontend
- [ ] Deploy customer frontend
- [ ] Monitor production API usage
- [ ] Update database backups

---

## Key Configuration Values

### Backend (`puli-mern-backend-v2/.env`)
```
PORT=5000
MONGO_URI=mongodb+srv://[user]:[password]@[cluster].mongodb.net/[db_name]
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=8h
ADMIN_EMAIL=admin@puli.com
ADMIN_PASSWORD=Admin123456!
NODE_ENV=development
```

### Frontend (`puli-digimenu-adminV2/.env` and `puli-digital-menu_V2/.env`)
```
VITE_API_URL=http://localhost:5000
```

---

## Development Commands

### Backend
```bash
cd puli-mern-backend-v2
npm install
npm run dev          # Development with nodemon
npm start            # Production
```

### Admin Frontend
```bash
cd puli-digimenu-adminV2/puli-digimenu-adminV2
npm install
npm run dev          # Vite dev server
npm run build        # Production build
npm run lint         # TypeScript check
```

### Customer Frontend
```bash
cd puli-digital-menu_V2/puli-digital-menu_V2
npm install
npm run dev          # Vite dev server
npm run build        # Production build
```

---

## API Testing

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@puli.com","password":"Admin123456!"}'
# Returns: { "token": "jwt.token.here", "user": {...} }
```

### Get Public Menu
```bash
curl http://localhost:5000/api/public/menu
# Returns: [{ "name_en": "...", "items": [...] }, ...]
```

### Get Menu Items (with token)
```bash
curl -H "Authorization: Bearer TOKEN_HERE" \
  http://localhost:5000/api/menu-items
# Returns: [{ "_id": "...", "name_en": "...", ... }, ...]
```

---

## File Sizes Summary

| File | Size | Type |
|------|------|------|
| adminAPI.ts | 272 lines | TypeScript |
| useAdminData.ts | 174 lines | React Hook |
| AdminAPIIntegration.tsx | ~300 lines | Examples |
| customerAPI.ts | 280 lines | TypeScript |
| useMenuAPI.ts | 166 lines | React Hook |
| CustomerAPIIntegration.tsx | ~400 lines | Examples |
| FRONTEND_INTEGRATION_GUIDE.md | ~600 lines | Documentation |
| INTEGRATION_CHECKLIST.md | ~400 lines | Documentation |
| BEFORE_AFTER_EXAMPLES.md | ~500 lines | Documentation |
| **Total New Code** | **~3100 lines** | **Code + Docs** |

---

## Next Steps Priority

### Tier 1 (Critical - Do First)
1. Create `.env` files in both frontends from `.env.example`
2. Start backend: `npm run dev` in puli-mern-backend-v2
3. Update App.tsx files in both frontends to use hooks
4. Test connection between frontends and backend

### Tier 2 (Important - Do Second)
1. Update admin pages to use adminAPI and store
2. Update customer pages to remove menuData imports
3. Test create/read/update/delete operations
4. Fix any TypeScript errors

### Tier 3 (Nice to Have - Do Later)
1. Add error boundary components
2. Add loading skeletons
3. Optimize API calls (caching, pagination)
4. Add offline support
5. Implement real-time updates (WebSocket)

---

## Support References

### Documentation
- `FRONTEND_INTEGRATION_GUIDE.md` - How to integrate
- `INTEGRATION_CHECKLIST.md` - What to do step-by-step
- `BEFORE_AFTER_EXAMPLES.md` - See code examples
- `puli-mern-backend-v2/DOCUMENTATION.md` - Backend API details

### Example Code
- `src/examples/AdminAPIIntegration.tsx` - Admin examples
- `src/examples/CustomerAPIIntegration.tsx` - Customer examples

### Type Definitions
- Check actual TypeScript files for interfaces
- Admin: Look in `adminAPI.ts`
- Customer: Look in `customerAPI.ts`

---

## Troubleshooting Quick Links

**"Cannot find module"** → Check tsconfig.json paths
**"CORS error"** → Check VITE_API_URL in .env
**"401 Unauthorized"** → Login again or check token expiration
**"No data showing"** → Check MongoDB has items
**"TypeScript errors"** → See type definitions in API client files

