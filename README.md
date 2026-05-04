# CampConnect (Angular)

Frontend-only Angular application for CampConnect — camping community, campsite discovery, marketplace, events, and admin panel.

## Stack

- **Angular 19** (standalone components)
- **Tailwind CSS 3**
- **TypeScript 5.6**

## Commands

```bash
# Install dependencies
npm install

# Development server (http://localhost:4200)
npm start

# Production build
npm run build
```

## Structure

- **`/`** — Home (hero, campsites, forum, events, marketplace, map, user dashboard)
- **`/admin`** — Admin panel (dashboard, sponsors, moderation, placeholders for other sections)
- **`/home`** — Same as `/` (redirect)

Use the **"Mode Admin"** button (bottom-right on the main site) to open the admin panel.

## Project layout

- `src/app/app.component.ts` — Root with router outlet
- `src/app/app.routes.ts` — Routes (main layout + admin)
- `src/app/components/` — Main UI (navigation, footer, hero, campsites, forum, events, marketplace, map, user dashboard)
- `src/app/admin/` — Admin (sidebar, dashboard, sponsors, moderation)
- `src/styles.css` — Global styles and Tailwind

Design tokens: forest `#2C4A3C`, olive `#5D7B5F`, sage `#A8B9A3`, cream `#F5F2E8` (see `tailwind.config.js`).
