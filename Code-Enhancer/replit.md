# GharDhoondo

A Pakistan real estate mobile app where users can browse, search, post, and manage property listings for buying and renting.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo + React Native (Expo Router)
- State: React Context + AsyncStorage (frontend-only persistence)
- API: Express 5 (api-server artifact)
- Build: esbuild (CJS bundle for API)

## Where things live

- `artifacts/mobile/` — Expo React Native app
- `artifacts/mobile/app/` — Expo Router screens
- `artifacts/mobile/context/AuthContext.tsx` — auth state (users, login, register, logout)
- `artifacts/mobile/context/PropertiesContext.tsx` — properties & transactions state
- `artifacts/mobile/components/PropertyCard.tsx` — property listing card
- `artifacts/mobile/components/FilterModal.tsx` — advanced filter modal
- `artifacts/mobile/constants/colors.ts` — emerald green design tokens

## Architecture decisions

- Frontend-only persistence via AsyncStorage — no backend needed for MVP
- Admin credentials hardcoded: tehzeeb.x51214@gmail.com / 141161
- Sample properties seeded at app start so the listing is never empty
- Property images stored as local URIs from expo-image-picker
- Transactions recorded locally and viewable only by admin

## Product

GharDhoondo is a real estate mobile app for Pakistan with:
1. **Home screen** — property listings with Buy/Rent filter toggle and global search
2. **Search screen** — advanced filters (city, property type, price range, listing type)
3. **Post Property** — image upload + full property form
4. **Profile** — edit profile (name, phone, role), My Listings, Notifications, Privacy, Help
5. **Admin Dashboard** — users directory + buyer/seller transaction records
6. **Property Detail** — image gallery, specs, owner contact, mark as sold/rented

## User preferences

- App theme: Emerald green (#059669) real estate brand
- Cities: Karachi, Lahore, Multan, Chakwal, Islamabad, Rawalpindi
- Property types: House, Apartment, Plot, Commercial, Farmhouse

## Gotchas

- Admin login auto-fills credentials via the "Admin" toggle on the login screen
- Transactions only appear in admin panel after a user taps "Contact Owner" and confirms a sale/rental
- Sample properties are always merged back on load (never fully deleted)
