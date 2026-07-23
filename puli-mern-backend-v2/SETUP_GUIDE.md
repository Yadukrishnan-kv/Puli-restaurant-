# PULI Backend V2 - Complete Setup & Integration Guide

## Overview

I've created a new MERN backend (`puli-mern-backend-v2`) that supports both your admin and customer frontends. The backend is built with Express.js and MongoDB, with proper separation of concerns.

### What's Different from Old Backend

1. **Merged Data Structures**: Combines features from both admin frontend (`puli-digimenu-adminV2`) and customer frontend (`puli-digital-menu_V2`)
2. **Extended MenuItem**: Now includes:
   - Spice levels (0-3 scale)
   - Country codes for cuisine type
   - Time-based availability (available_from/available_to)
   - Day-based availability (available_days array)
   - Separate allergen fields
   
3. **Bilingual Support**: All text fields support English and Arabic (_en, _ar naming)
4. **New Database**: Uses different MongoDB instance as requested
5. **Better API Structure**: Separate endpoints for admin (protected) and public (customer)

## Project Structure

```
puli-mern-backend-v2/
├── models/
│   ├── MenuItem.js          (Menu items with all features)
│   ├── Category.js          (Menu categories)
│   ├── Classification.js    (Sub-categories)
│   ├── MenuSection.js       (Top-level sections)
│   ├── FilterTag.js         (Tags for filters)
│   ├── Banner.js            
│   ├── Story.js
│   ├── Settings.js
│   ├── User.js
│   └── ActivityLog.js       (Audit trail)
├── middleware/
│   ├── auth.js              (JWT authentication)
│   └── logging.js           (Activity logging)
├── server.js                (Main app)
├── .env                     (Configuration)
├── package.json
└── README.md
```

## Installation & Setup

### Step 1: Configure MongoDB

You need a new MongoDB database. Options:
1. **MongoDB Atlas (Cloud)** - Recommended for production
2. **Local MongoDB** - For development

#### For MongoDB Atlas:
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user with username and password
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/database`

### Step 2: Update .env File

Edit `c:\Users\yadhu\OneDrive\Desktop\CodeCarrot\Puli\puli-mern-backend-v2\.env`:

```env
# New MongoDB Database
MONGO_URI=mongodb+srv://youruser:yourpassword@your-cluster.mongodb.net/puli-menu-v2?retryWrites=true&w=majority

PORT=5000
JWT_SECRET=puli-jwt-secret-v2-change-in-production
JWT_EXPIRE=8h

# Default admin credentials (change these!)
ADMIN_EMAIL=admin@puli.com
ADMIN_PASSWORD=Admin123456!

NODE_ENV=development
```

**⚠️ IMPORTANT**: Change `MONGO_URI`, `JWT_SECRET`, and admin credentials before production!

### Step 3: Start the Backend

```bash
# Navigate to backend directory
cd c:\Users\yadhu\OneDrive\Desktop\CodeCarrot\Puli\puli-mern-backend-v2

# Install dependencies (if not done yet)
npm install

# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Expected output:
```
Server running on port 5000
MongoDB connected successfully
Default admin user created
```

## API Endpoints Reference

### Authentication (Public)
```
POST /api/auth/login
Headers: { "Content-Type": "application/json" }
Body: {
  "email": "admin@puli.com",
  "password": "Admin123456!"
}
Response: {
  "token": "jwt-token...",
  "user": { "id": "...", "email": "..." }
}
```

### Admin Routes (Protected)
All admin routes require `Authorization: Bearer <jwt-token>` header

#### Menu Sections
```
GET    /api/menu-sections
POST   /api/menu-sections
PUT    /api/menu-sections/:id
DELETE /api/menu-sections/:id
```

#### Categories
```
GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id
```

#### Classifications
```
GET    /api/classifications
POST   /api/classifications
PUT    /api/classifications/:id
DELETE /api/classifications/:id
```

#### Menu Items
```
GET    /api/menu-items
GET    /api/menu-items/:id
POST   /api/menu-items
PUT    /api/menu-items/:id
DELETE /api/menu-items/:id
```

#### Other Resources
```
GET/PUT /api/filter-tags
GET/PUT /api/banner/:id
GET/PUT /api/story/:id
GET/PUT /api/settings/:id
GET     /api/audit-log
```

### Public Routes (No Authentication)
These are for customer-facing frontend:

```
GET /api/public/menu           # Complete menu hierarchy
GET /api/public/menu-items     # Flat list of all items
GET /api/public/categories     # All categories
GET /api/public/filter-tags    # Available tags for filtering
```

## Data Models

### MenuItem Schema
```javascript
{
  name_en: String,              // "Pad Thai"
  name_ar: String,              // "باد ثاي"
  description_en: String,
  description_ar: String,
  price: Number,                // 25
  category_id: ObjectId,        // Reference to Category
  classification_id: ObjectId,  // Reference to Classification (optional)
  image: String,                // URL
  calories: Number,             // 350
  allergens: [String],          // ["dairy", "nuts"]
  tags: [String],               // ["popular", "vegan", "japan"]
  country_code: String,         // "TH" for Thailand
  spice_level: 0-3,             // 0=mild, 1=medium, 2=hot, 3=extra hot
  available_from: String,       // "12:00"
  available_to: String,         // "22:00"
  available_days: [Number],     // [1,2,3,4,5] = Mon-Fri
  visible: Boolean,             // true
  order: Number,                // 0
  createdAt: Date,
  updatedAt: Date
}
```

### Category Schema
```javascript
{
  name_en: String,
  name_ar: String,
  description_en: String,
  description_ar: String,
  image: String,
  section_id: ObjectId,         // Parent MenuSection
  group: String,                // "main" | "special" | "festive"
  slug: String,                 // "food-menu" (unique)
  visible: Boolean,
  order: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Integration with Frontends

### Admin Frontend (puli-digimenu-adminV2)

Update your API calls to use: `http://localhost:5000/api`

Example fetch in your React component:
```javascript
// Auth
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token } = await response.json();
localStorage.setItem('token', token);

// Get menu items (protected)
const menuResponse = await fetch('http://localhost:5000/api/menu-items', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Update item
const updateResponse = await fetch('http://localhost:5000/api/menu-items/:id', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(updatedItem)
});
```

### Customer Frontend (puli-digital-menu_V2)

Replace your static `menuData.ts` with API calls:

```javascript
// Get full menu hierarchy
const menu = await fetch('http://localhost:5000/api/public/menu').then(r => r.json());

// Get flat list for filtering
const allItems = await fetch('http://localhost:5000/api/public/menu-items').then(r => r.json());

// Get categories
const categories = await fetch('http://localhost:5000/api/public/categories').then(r => r.json());
```

## Mapping Admin Frontend Fields to Backend

Your admin frontend uses these field names. Here's the mapping to backend:

```
Admin Frontend          →    Backend
=====================================
section_id             →    section_id
name_en                →    name_en
name_ar                →    name_ar
description_en         →    description_en
description_ar         →    description_ar
image                  →    image
visible                →    visible
order                  →    order
group                  →    group
slug                   →    slug

MenuItem fields:
category_id            →    category_id
classification_id      →    classification_id
price                  →    price
calories               →    calories
allergens              →    allergens
tags                   →    tags
chef_special           →    (use tags: ["chef_special"])
popular                →    (use tags: ["popular"])
recommended            →    (use tags: ["recommended"])
available_from         →    available_from
available_to           →    available_to
available_days         →    available_days
```

## Data Migration (if needed)

If you want to migrate data from old backend:

1. Export from old backend MongoDB
2. Transform field names to match new schema
3. Import to new backend MongoDB

Example transformation script (Node.js):
```javascript
const oldItem = {
  name: "Pad Thai",
  nameAr: "باد ثاي",
  price: 25
};

const newItem = {
  name_en: oldItem.name,
  name_ar: oldItem.nameAr,
  price: oldItem.price
};
```

## Troubleshooting

### MongoDB Connection Error
```
Error: The `uri` parameter to `openUri()` must be a string, got "undefined"
```
✓ Solution: Update `MONGO_URI` in `.env`

### Authentication Errors
```
Error: Invalid token
```
✓ Solution: Make sure token format is correct in Authorization header
✓ Format: `Authorization: Bearer <token>`

### Port Already in Use
```
listen EADDRINUSE: address already in use :::5000
```
✓ Solution: Change PORT in `.env` or kill process using port 5000

### CORS Errors
✓ CORS is enabled for all origins. If you need to restrict, edit server.js:
```javascript
app.use(cors({
  origin: 'http://localhost:3000'
}));
```

## Default Credentials

- Email: `admin@puli.com`
- Password: `Admin123456!`

**Change these immediately after first login!**

Create new admin user:
```javascript
// POST /api/auth/register (if implemented)
```

## File Upload Support

The backend supports 50MB file uploads for images:
```javascript
// Large payload support in server.js
app.use(express.json({ limit: '50mb' }));
```

## Activity Logging

All admin actions are logged with:
- User email
- Module (menu-items, categories, etc.)
- Action (create, update, delete)
- Entity ID
- Metadata

Query logs:
```
GET /api/audit-log
```

## Performance Optimization

For the `/api/public/menu` endpoint with large datasets:
- Consider adding pagination: `?limit=20&page=1`
- Can be added to server.js if needed
- Currently returns all visible items

## Next Steps

1. ✅ Set up MongoDB connection
2. ✅ Update .env file
3. ✅ Start backend server
4. ✅ Update frontend API endpoints
5. ✅ Test login and CRUD operations
6. ✅ Deploy to production server

## Support

For backend issues:
1. Check server logs for error messages
2. Verify MongoDB connection
3. Test endpoints with Postman/curl
4. Check JWT token validity

## Additional Resources

- Express.js docs: https://expressjs.com/
- MongoDB docs: https://docs.mongodb.com/
- Mongoose docs: https://mongoosejs.com/
- JWT: https://jwt.io/

---

**Version**: 2.0.0
**Last Updated**: March 17, 2026
**Backend Path**: `c:\Users\yadhu\OneDrive\Desktop\CodeCarrot\Puli\puli-mern-backend-v2`
