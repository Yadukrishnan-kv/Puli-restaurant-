# PULI Digital Menu Admin (CMS)

A premium admin panel for managing the restaurant digital menu at [pulimenuv2.netlify.app](https://pulimenuv2.netlify.app/). Control every piece of content dynamically without editing code.

## Tech stack

- **React 18** + **TypeScript** + **Vite**
- **Framer Motion** – UI animations
- **react-hook-form** + **zod** – forms and validation
- **@dnd-kit** – drag-and-drop ordering
- **browser-image-compression** – image upload compression
- **Zustand** – state + localStorage persistence

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview   # preview production build
```

## Features

| Section | Description |
|--------|-------------|
| **Dashboard** | Summary stats (categories, dishes, featured), quick actions |
| **Banner** | Homepage hero: title, subtitle, background image, enable/disable |
| **Story** | Restaurant story: title, description, background image |
| **Categories** | CRUD + drag-and-drop order; name EN/AR, description, image, visibility |
| **Menu Items** | Full CRUD, duplicate, visibility toggle; names/descriptions EN & AR, price, category, image, tags, calories, allergens; Chef Special / Popular / Recommended; scheduling (from/to time, days) |
| **Featured Dishes** | Toggle Chef Special, Popular, Recommended per dish |
| **Filters & Tags** | Badge and allergen filters (labels EN/AR, enable/disable) |
| **Media Library** | Upload images (auto-compressed), preview, delete, grid view |
| **Menu Scheduling** | View items with time/day restrictions; edit in Menu Items |
| **Translations** | Overview of EN/AR content; edit in Categories, Menu Items, Story |
| **Settings** | Restaurant name, logo, favicon, theme; export/import JSON |

## Data persistence

Data is stored in **localStorage** (key: `puli-menu-admin`). Use **Settings → Export JSON** to backup or feed the frontend. Use **Import JSON** to restore.

## Frontend integration

Export the JSON from Settings and use it in your frontend (e.g. fetch from a static file or inject at build time). The structure matches the types in `src/types/index.ts` (categories, menuItems, banner, story, filters, settings).

## Project structure

```
src/
├── components/
│   ├── layout/     # Sidebar, Header, MainLayout
│   ├── ui/         # Card, Button, Modal
│   └── forms/      # ImageUpload
├── context/        # ToastContext
├── lib/            # utils, imageCompression
├── pages/          # One page per section
├── store/          # Zustand store + initial data
└── types/          # TypeScript models
```

## Responsive

Optimized for **desktop** and **tablet**. Mobile is optional.
