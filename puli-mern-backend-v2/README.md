# PULI Digital Menu Backend V2

A modern REST API backend for the PULI restaurant digital menu system. Built with Express.js and MongoDB, supporting both admin and customer-facing menu management.

## Features

- **Authentication**: JWT-based admin authentication
- **Menu Management**: Full CRUD operations for menu sections, categories, classifications, and items
- **Bi-lingual Support**: English and Arabic text fields across the system
- **Advanced Menu Items**: Support for spice levels, allergens, availability windows, and dietary tags
- **Activity Logging**: Comprehensive audit trail for all admin operations
- **Public API**: Customer-facing endpoints for menu browsing
- **Filter Tags**: Customizable badges and allergen indicators

## Project Structure

```
.
├── models/              # MongoDB schemas
│   ├── MenuItem.js
│   ├── Category.js
│   ├── Classification.js
│   ├── MenuSection.js
│   ├── FilterTag.js
│   ├── Banner.js
│   ├── Story.js
│   ├── Settings.js
│   ├── User.js
│   └── ActivityLog.js
├── middleware/          # Express middleware
│   ├── auth.js          # JWT authentication
│   └── logging.js       # Activity logging
├── server.js            # Main application entry point
├── .env                 # Environment variables
└── package.json
```

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB credentials

# Start development server
npm run dev

# Start production server
npm start
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/database

# Server Port
PORT=5000

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRE=8h

# Admin Credentials
ADMIN_EMAIL=admin@puli.com
ADMIN_PASSWORD=StrongPassword123!

# Node Environment
NODE_ENV=development
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Admin login

### Admin Routes (Protected)

#### Menu Sections
- `GET /api/menu-sections` - Get all sections
- `POST /api/menu-sections` - Create section
- `PUT /api/menu-sections/:id` - Update section
- `DELETE /api/menu-sections/:id` - Delete section

#### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

#### Classifications
- `GET /api/classifications` - Get all classifications
- `POST /api/classifications` - Create classification
- `PUT /api/classifications/:id` - Update classification
- `DELETE /api/classifications/:id` - Delete classification

#### Menu Items
- `GET /api/menu-items` - Get all items
- `GET /api/menu-items/:id` - Get single item
- `POST /api/menu-items` - Create item
- `PUT /api/menu-items/:id` - Update item
- `DELETE /api/menu-items/:id` - Delete item

#### Filter Tags
- `GET /api/filter-tags` - Get all tags
- `POST /api/filter-tags` - Create tag
- `PUT /api/filter-tags/:id` - Update tag
- `DELETE /api/filter-tags/:id` - Delete tag

#### Banner & Story
- `GET /api/banner` - Get banner
- `PUT /api/banner/:id` - Update banner
- `GET /api/story` - Get story
- `PUT /api/story/:id` - Update story

#### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings/:id` - Update settings

#### Audit Log
- `GET /api/audit-log` - Get activity logs

### Public Routes (No Authentication Required)

- `GET /api/public/menu` - Get complete menu hierarchy
- `GET /api/public/menu-items` - Get all menu items (flat list)
- `GET /api/public/categories` - Get all categories
- `GET /api/public/filter-tags` - Get available filter tags

## Data Models

### MenuItem
```javascript
{
  name_en: "Dish Name",
  name_ar: "اسم الطبق",
  description_en: "Description",
  description_ar: "الوصف",
  price: 25,
  category_id: ObjectId,
  classification_id: ObjectId,
  image: "url",
  calories: 300,
  allergens: ["dairy", "nuts"],
  tags: ["chef_special", "popular"],
  country_code: "JP",
  spice_level: 1,      // 0=mild, 1=medium, 2=hot, 3=extra hot
  available_from: "12:00",
  available_to: "22:00",
  available_days: [1,2,3,4,5],  // Mon-Fri
  visible: true,
  order: 0
}
```

### Category
```javascript
{
  name_en: "Food Menu",
  name_ar: "قائمة الطعام",
  description_en: "Main dishes",
  description_ar: "الأطباق الرئيسية",
  image: "url",
  section_id: ObjectId,
  group: "main",  // "main", "special", "festive"
  visible: true,
  order: 0
}
```

## Default Admin User

On first run, the system creates a default admin user with credentials from `.env`:
- Email: `admin@puli.com`
- Password: `Admin123456!` (set in `.env`)

Change these credentials immediately after first login.

## Development

```bash
# Start with hot reload
npm run dev

# Check MongoDB connection
curl http://localhost:5000/api/public/menu
```

## Production Deployment

1. Update `.env` with production MongoDB URI and strong JWT secret
2. Set `NODE_ENV=production`
3. Run `npm start`

## License

ISC
