# PULI Digital Menu - Backend v2 Documentation

## 📋 Executive Summary

A complete, production-ready REST API backend for the PULI restaurant digital menu system. Built with:
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **JWT** - Authentication
- **Mongoose** - ODM for MongoDB

Supports both admin panel (puli-digimenu-adminV2) and customer-facing menu (puli-digital-menu_V2).

---

## 📁 Directory Structure

```
puli-mern-backend-v2/
├── models/                    # Database schemas
│   ├── MenuItem.js           # Menu items with full features
│   ├── Category.js           # Menu categories
│   ├── Classification.js     # Item sub-categories
│   ├── MenuSection.js        # Top-level sections
│   ├── FilterTag.js          # Item tags & allergens
│   ├── Banner.js             # Homepage banner
│   ├── Story.js              # Restaurant story section
│   ├── Settings.js           # Global settings
│   ├── User.js               # Admin users
│   └── ActivityLog.js        # Audit trail
├── middleware/               # Express middleware
│   ├── auth.js              # JWT authentication
│   └── logging.js           # Activity logging
├── server.js                 # Main app entry point
├── .env                      # Secret configuration
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies
├── package-lock.json        # Locked versions
├── README.md                # Quick start guide
├── SETUP_GUIDE.md          # Detailed setup
├── api-client-example.js   # Frontend integration helper
└── migrate-data.js         # Data migration tool
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB (Atlas or local)
- npm or yarn

### Installation

```bash
# 1. Navigate to backend directory
cd puli-mern-backend-v2

# 2. Install dependencies
npm install

# 3. Configure environment
# Edit .env with your MongoDB URI and settings

# 4. Start development server
npm run dev

# Or production
npm start
```

Server will run on `http://localhost:5000`

---

## 🔐 Authentication

### How It Works

1. **Login**: POST `/api/auth/login` with email/password
2. **Receive JWT Token**: Token is returned with 8-hour expiration
3. **Use Token**: Include in `Authorization: Bearer <token>` header
4. **Auto Create Admin**: First user is created from .env on startup

### Login Example

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@puli.com",
    "password": "Admin123456!"
  }'

# Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "admin@puli.com"
  }
}
```

### Using Token

```bash
curl -X GET http://localhost:5000/api/menu-items \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📊 Data Models

### MenuItem (Menu Item)

The most complex model supporting all features from both frontends.

```javascript
{
  _id: ObjectId,
  
  // Text (bilingual)
  name_en: "Pad Thai",
  name_ar: "باد ثاي",
  description_en: "Stir-fried rice noodles...",
  description_ar: "الأرز المقلي...",
  
  // Pricing & Nutrition
  price: 25,
  calories: 350,
  
  // Location in hierarchy
  category_id: ObjectId,        // Required
  classification_id: ObjectId,  // Optional
  
  // Media
  image: "https://...",
  
  // Dietary info
  allergens: ["dairy", "nuts"],
  
  // Tags
  tags: ["popular", "vegan", "japan"],
  
  // Cuisine/Spice
  country_code: "TH",              // ISO 3166-1 alpha-2
  spice_level: 2,                  // 0=mild, 1=medium, 2=hot, 3=extra hot
  
  // Availability
  available_from: "12:00",         // HH:MM format
  available_to: "22:00",
  available_days: [1, 2, 3, 4, 5], // 0=Sun ... 6=Sat
  
  // Status
  visible: true,
  order: 0,
  
  // System
  createdAt: "2026-03-17T10:30:00Z",
  updatedAt: "2026-03-17T10:30:00Z"
}
```

### Category (Menu Category)

Groups menu items and provides organization.

```javascript
{
  _id: ObjectId,
  
  // Text (bilingual)
  name_en: "Food Menu",
  name_ar: "قائمة الطعام",
  description_en: "All-day dishes...",
  description_ar: "الأطباق طوال اليوم...",
  
  // Media
  image: "https://...",
  
  // Location
  section_id: ObjectId,  // Parent MenuSection
  
  // Customer grouping
  group: "main",  // "main" | "special" | "festive"
  
  // Routing
  slug: "food-menu",  // For URLs
  
  // Status
  visible: true,
  order: 0,
  
  // System
  createdAt: "2026-03-17T10:30:00Z",
  updatedAt: "2026-03-17T10:30:00Z"
}
```

### Classification (Item Sub-Category)

Optional sub-grouping under categories (e.g., "Soups", "Mains", "Desserts").

```javascript
{
  _id: ObjectId,
  name_en: "Soups",
  name_ar: "الحساء",
  category_id: ObjectId,  // Required
  visible: true,
  order: 0,
  createdAt: "2026-03-17T10:30:00Z",
  updatedAt: "2026-03-17T10:30:00Z"
}
```

### MenuSection (Top-Level Section)

Highest level of organization (e.g., "Main Menu", "Special Menu").

```javascript
{
  _id: ObjectId,
  name_en: "Main Menu",
  name_ar: "القائمة الرئيسية",
  visible: true,
  order: 0,
  createdAt: "2026-03-17T10:30:00Z",
  updatedAt: "2026-03-17T10:30:00Z"
}
```

### FilterTag (Tags & Allergens)

Labels for categorizing items (special items, allergens, etc.).

```javascript
{
  _id: ObjectId,
  label_en: "Chef Special",
  label_ar: "طبق الشيف",
  type: "badge",  // "badge" | "allergen"
  enabled: true,
  order: 0,
  createdAt: "2026-03-17T10:30:00Z",
  updatedAt: "2026-03-17T10:30:00Z"
}
```

### Other Models

- **Banner**: Homepage hero section
- **Story**: Restaurant story/about section
- **Settings**: Global settings (restaurant name, logo, theme)
- **User**: Admin accounts
- **ActivityLog**: Audit trail of all changes

---

## 🔌 API Endpoints

### Authentication (Public - No Token Required)

```
POST /api/auth/login
Purpose: Admin login
Body:    { email, password }
Returns: { token, user }
```

### Menu Sections (Admin)

```
GET    /api/menu-sections           # List all
POST   /api/menu-sections           # Create
PUT    /api/menu-sections/:id       # Update
DELETE /api/menu-sections/:id       # Delete
```

### Categories (Admin)

```
GET    /api/categories              # List all
POST   /api/categories              # Create
PUT    /api/categories/:id          # Update
DELETE /api/categories/:id          # Delete
```

### Classifications (Admin)

```
GET    /api/classifications         # List all
POST   /api/classifications         # Create
PUT    /api/classifications/:id     # Update
DELETE /api/classifications/:id     # Delete
```

### Menu Items (Admin)

```
GET    /api/menu-items              # List all
GET    /api/menu-items/:id          # Get one
POST   /api/menu-items              # Create
PUT    /api/menu-items/:id          # Update
DELETE /api/menu-items/:id          # Delete
```

### Filter Tags (Admin)

```
GET    /api/filter-tags             # List all
POST   /api/filter-tags             # Create
PUT    /api/filter-tags/:id         # Update
DELETE /api/filter-tags/:id         # Delete
```

### Banner & Story (Admin)

```
GET    /api/banner                  # Get banner
PUT    /api/banner/:id              # Update
GET    /api/story                   # Get story
PUT    /api/story/:id               # Update
```

### Settings (Admin)

```
GET    /api/settings                # Get settings
PUT    /api/settings/:id            # Update
```

### Activity Logs (Admin)

```
GET    /api/audit-log               # Get all logs
```

### Public Menu (Customer - No Token Required)

```
GET /api/public/menu                # Full hierarchy
GET /api/public/menu-items          # Flat list
GET /api/public/categories          # Categories only
GET /api/public/filter-tags         # Filter tags
```

---

## 💾 Environment Variables

Create `.env` file:

```env
# MongoDB (new database instance)
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/puli-menu-v2

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRE=8h

# Default Admin (created on first run)
ADMIN_EMAIL=admin@puli.com
ADMIN_PASSWORD=Admin123456!
```

⚠️ **IMPORTANT CHANGES FOR PRODUCTION**:
- Change `MONGO_URI` to new database
- Change `JWT_SECRET` to strong random string
- Change `ADMIN_PASSWORD` to strong password
- Set `NODE_ENV=production`

---

## 🔄 Integration with Frontend

### Admin Frontend (puli-digimenu-adminV2)

Replace static data with API calls:

```javascript
// Before: Static data
import { initialData } from './store/initialData';

// After: API data
import { useEffect, useState } from 'react';

export function useMenuData() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('http://localhost:5000/api/menu-items', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);
  
  return { items, loading };
}
```

### Customer Frontend (puli-digital-menu_V2)

Replace static `menuData.ts`:

```javascript
// Before: Static data
import { items, categories } from './data/menuData';

// After: API data
export async function getMenuData() {
  const menu = await fetch('http://localhost:5000/api/public/menu')
    .then(r => r.json());
  
  return menu;
}
```

---

## 📝 Example Requests

### 1. Admin Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@puli.com",
    "password": "Admin123456!"
  }'
```

### 2. Create Menu Item

```bash
curl -X POST http://localhost:5000/api/menu-items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name_en": "Pad Thai",
    "name_ar": "باد ثاي",
    "price": 25,
    "category_id": "507f1f77bcf86cd799439011",
    "description_en": "Stir-fried rice noodles with shrimp",
    "description_ar": "أرز مقلي مع الروبيان",
    "calories": 350,
    "allergens": ["dairy"],
    "tags": ["popular"],
    "country_code": "TH",
    "spice_level": 2,
    "visible": true
  }'
```

### 3. Get Public Menu (No Auth)

```bash
curl http://localhost:5000/api/public/menu
```

---

## 🛠️ Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

### Database Management

```bash
# Backup database
mongodb-export --uri="mongodb+srv://..." --db=puli-menu-v2 --out=backup

# Restore database
mongoimport --uri="mongodb+srv://..." --db=puli-menu-v2 --file=backup
```

### Debugging

```bash
# Enable debug logs
DEBUG=* npm run dev

# Check MongoDB connection
curl http://localhost:5000/api/public/menu
```

---

## 📈 Performance & Scaling

### Current Limitations
- In-memory token validation (no blacklist on logout)
- No pagination on endpoints
- No caching layer

### Recommended Improvements
1. Add Redis for caching public menu
2. Implement pagination for large datasets
3. Add compression middleware
4. Implement rate limiting
5. Add database indexes

### Example: Add pagination

```javascript
app.get('/api/menu-items', async (req, res) => {
  const page = req.query.page || 1;
  const limit = 20;
  const skip = (page - 1) * limit;
  
  const items = await MenuItem.find()
    .skip(skip)
    .limit(limit)
    .sort({ order: 1 });
  
  res.json(items);
});
```

---

## 🐛 Troubleshooting

### MongoDB Connection Failed

**Error**: `MongooseError: The uri parameter ... must be a string`

**Solution**: Update `MONGO_URI` in `.env`

```env
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/database
```

### Authentication Invalid

**Error**: `401 Invalid token`

**Solution**: Check token format

```bash
# Correct format
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Port Already in Use

**Error**: `listen EADDRINUSE: address already in use :::5000`

**Solution**: Change port or kill process

```bash
# Change port in .env
PORT=5001

# Or kill process on port 5000
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### CORS Errors

**Error**: `Access to XMLHttpRequest blocked by CORS`

**Solution**: CORS is enabled for all origins. If restrictive needed:

```javascript
// In server.js
app.use(cors({
  origin: 'http://localhost:3000'
}));
```

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT.io - JWT Tokens](https://jwt.io/)
- [REST API Best Practices](https://restfulapi.net/)

---

## 📝 Changelog

### V2.0.0 (Current)
- ✅ New backend for both frontends
- ✅ Merged data structures from admin & customer UIs
- ✅ All extra fields supported (spice level, country codes, etc.)
- ✅ Time-based availability
- ✅ Bilingual support
- ✅ Activity logging
- ✅ JWT authentication

### V1.0.0 (Old)
- Basic CRUD operations
- Single database
- Simple structure

---

## 👨‍💼 Support & Contact

For issues or questions:

1. Check SETUP_GUIDE.md
2. Review API examples in this document
3. Check server.js for route definitions
4. Enable `DEBUG=*` for detailed logs

---

**Version**: 2.0.0  
**Last Updated**: March 17, 2026  
**Status**: ✅ Production Ready  
**License**: ISC
