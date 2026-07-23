## PULI Digital Menu (QR Restaurant Experience)

Premium QR-based restaurant menu inspired by the UX flow of `myazu.redro.menu`, visually aligned with the PULI Pan Asian brand. Built with **React 18**, **TypeScript**, **Vite**, **Framer Motion**, and **react-i18next**.

---

### Tech Stack

- **Framework**: React 18 + TypeScript
- **Bundler**: Vite
- **Routing**: React Router
- **Animations**: Framer Motion
- **i18n**: i18next + react-i18next (EN / AR with RTL)

---

### Design System Overview

- **Color tokens** (dark/light themes) defined in `src/design/tokens.css`
  - `--color-background-primary`, `--color-background-secondary`
  - `--color-accent-primary`, `--color-accent-secondary`
  - `--color-text-primary`, `--color-text-secondary`
  - `--color-border`, `--color-surface-elevated`
- **Fonts**
  - Headings: `Playfair Display` (`--font-heading`)
  - Body: `Inter` (`--font-body`)
- **Spacing**
  - `--space-xs`, `--space-sm`, `--space-md`, `--space-lg`, `--space-xl`, `--space-2xl`
- **Radius**
  - `--radius-sm`, `--radius-md`, `--radius-lg`
- **Shadows**
  - `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- **Z-index**
  - `--z-navbar`, `--z-overlay`, `--z-modal`, `--z-dropdown`

All UI components consume these tokens via CSS variables—no hard-coded design values inside components.

---

### Core Features

- **Mobile-first QR menu**
  - Sticky top navigation, thumb-friendly targets, smooth scrolling.
  - Optimized first view for category exploration on phones.
- **Level 1 – Category Landing (`HomePage`)**
  - **Hero banner** (`HeroBanner`): cinematic image with PULI-themed gradient overlay, restaurant title/subtitle using heading font.
  - **Story section** (`StorySection`): brand story text plus ambient image block.
  - **Category grid** (`CategoryGrid` + `CategoryCard`): vertical card list for categories (Cold Starters, Hot Starters, Sushi, Robata, Desserts, Drinks, etc.) with Framer Motion hover/tap animations.
- **Level 2 – Category Detail (`CategoryPage`)**
  - Sticky navbar inherited from `Header`.
  - Category title + description.
  - **Search bar** (`SearchBar`): instant filtering by dish name/description.
  - **Advanced filters** (`FilterDrawer`):
    - Hide dishes containing: Dairy, Nuts, Gluten, Honey.
    - Show only: Chef Special, Popular, New.
    - Mobile-first slide-up drawer with Framer Motion.
  - **Dish list** (`DishItem` + `DishList`-style layout):
    - Dish name, short description, price aligned right, optional calories and highlight tags.
  - **Dish detail modal** (`DishModal`):
    - Large hero image, full description, price, calories, allergens/tags.
    - Animated open/close via Framer Motion with dimmed backdrop.

---

### Data Model

Defined in `src/data/menuData.ts`:

- **Category**
  - `id`, `slug`, `name`, `description`, `heroImage?`
- **MenuItem**
  - `id`, `name`, `description`, `price`
  - `image?`, `categoryId`
  - `tags?` (`chefSpecial` | `popular` | `new`)
  - `calories?`
  - `allergens?` (`dairy` | `nuts` | `gluten` | `honey`)

Helper functions:

- `getCategoryBySlug(slug)`
- `getItemsForCategory(categoryId)`

---

### Internationalization & RTL

- Configured in `src/i18n/config.ts`.
- Languages:
  - `en` (default)
  - `ar` (Arabic, RTL)
- `Header` includes an **EN / AR toggle**:
  - Updates i18next language.
  - Sets `<html lang="">` and `<html dir="">` (`ltr` / `rtl`).

---

### Theming (Light / Dark)

- `useTheme` hook:
  - Manages `"light"` / `"dark"` theme.
  - Persists user choice in `localStorage`.
  - Applies `data-theme` attribute on `<html>` to swap token values in `tokens.css`.
- `Header` exposes a moon/sun toggle that flips theme state.

---

### Animations

- **Page transitions**: `App` wraps routes in `AnimatePresence` + `motion.div` for subtle fade/slide transitions between landing and category pages.
- **Hero / story / cards**: entrance animations on scroll and hover micro-interactions for category cards.
- **Filter drawer & modal**: spring-based slide-up drawer and elevated modal with dimmed overlay for a cinematic, premium feel.

---

### Running the Project

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start dev server**

   ```bash
   npm run dev
   ```

3. **Build for production**

   ```bash
   npm run build
   ```

4. **Preview production build**

   ```bash
   npm run preview
   ```

---

### Deploying to a Domain (client demo / production)

The app is a **static site**. After `npm run build`, upload the contents of the **`dist/`** folder to any static host. No server or database is required.

#### Option A – Vercel (recommended, free)

1. Push your code to **GitHub** (if not already).
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
3. **Add New Project** → import your `puli-digital-menu_V2` repo.
4. Leave **Build Command** as `npm run build` and **Output Directory** as `dist`. Click **Deploy**.
5. Vercel gives you a URL like `puli-digital-menu-xxx.vercel.app`. You can add a **custom domain** in Project → Settings → Domains.

#### Option B – Netlify

1. Push your code to **GitHub**.
2. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project** (GitHub).
3. **Build command:** `npm run build`  
   **Publish directory:** `dist`
4. Deploy. Use the generated URL (e.g. `random-name.netlify.app`) or add a custom domain in **Domain settings**.

#### Option C – Manual upload (your own domain / cPanel, FTP)

1. Run `npm run build`.
2. Upload the **contents** of the `dist/` folder (not the `dist` folder itself) into your **web root** (e.g. `public_html`).  
   After upload, the root should contain:
   - `index.html` (in the root)
   - `assets/` folder (with `.js`, `.css`, logos, favicon)
   - `.htaccess` (included from `public/`, so Apache serves the SPA correctly)
3. **Wrong:** uploading the `dist` folder so the URL is `yoursite.com/dist/` — the app uses paths like `/assets/...`, so nothing will load.  
   **Right:** upload so `yoursite.com` opens `index.html` and `yoursite.com/assets/...` finds the files.
4. If your host uses **Nginx** instead of Apache, configure: `try_files $uri $uri/ /index.html;`

#### Custom domain (Vercel / Netlify)

- In the dashboard, add your domain (e.g. `menu.sayorestaurant.com`).
- Follow the instructions to add the DNS records (A/CNAME) at your domain registrar. Once DNS propagates, the site will be served on your domain.

---

### File Map (Key Paths)

- `public/assets/` – static assets copied as-is into the build (logos, favicon). Use paths like `/assets/Logo_EN.svg` in code. Do not put these in a root-level `assets/` folder or they will not be included in the deployed site.
- `src/design/tokens.css` – design tokens (colors, typography, spacing, radius, shadows, z-index, themes)
- `src/styles/global.css` – global layout styles and shared utility classes
- `src/i18n/config.ts` – i18next + react-i18next configuration (EN/AR)
- `src/data/menuData.ts` – structured menu data
- `src/hooks/useTheme.tsx` – light/dark theme hook with `localStorage`
- `src/components/*` – reusable UI components (header, hero, story, grid, list, modal, drawer)
- `src/pages/HomePage.tsx` – Level 1 category landing
- `src/pages/CategoryPage.tsx` – Level 2 category detail / dish list

This README is intentionally high-level so designers and engineers can quickly understand how the QR menu is structured and where to extend categories, dishes, and design tokens. 