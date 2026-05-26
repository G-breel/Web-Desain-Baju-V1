# PROJECT TODO — WEB DESAIN BAJU

**Progress:** Phase 1–2 selesai · Phase 3–5 selesai (basic) · Phase 6–17 belum

Konsep: Editor desain baju 2D · Multi view (Front/Back/Left/Right) · User only · Gratis · Export/Import · Responsive · Dark mode

---

## PHASE 1 — SETUP PROJECT ✅

- [x] Setup Next.js App Router
- [x] Install Tailwind CSS
- [x] Setup Supabase (client, server, middleware)
- [x] Setup environment variables (`.env.local.example`)
- [x] Setup folder structure
- [x] Setup reusable components
- [x] Setup dark mode
- [x] Setup responsive layout
- [x] Setup navbar global
- [x] Setup loading states
- [x] Setup toast notification

---

## PHASE 2 — AUTHENTICATION ✅

- [x] Register page
- [x] Login page
- [x] Logout system
- [x] Protected routes
- [x] Session management
- [x] User profile fetch
- [x] Google auth (optional)

---

## PHASE 3 — DATABASE & STORAGE ✅ *(basic)*

- [x] Create users table *(Supabase `auth.users`)*
- [x] Create users profile table (`supabase/migrations/001_initial_schema.sql` + `002_profile_trigger.sql`)
- [x] Create designs table
- [x] Create assets table
- [x] Setup Row Level Security (RLS)
- [x] Setup user access policy
- [x] Setup Supabase Storage *(policy siap: `004_storage_policies.sql`)*
- [ ] Setup upload bucket *(buat bucket `assets` & `thumbnails` di dashboard)*

---

## PHASE 4 — DASHBOARD ✅ *(basic)*

- [x] Create dashboard page
- [x] Create recent design section
- [x] Create new design button
- [x] Create project cards
- [x] Create delete project feature
- [ ] Create rename project feature
- [x] Create duplicate project feature
- [x] Create search project feature
- [x] Create empty state UI

---

## PHASE 5 — PRODUCT SELECTION ✅ *(basic)*

- [x] Create product selection page
- [x] Add Oversize T-Shirt
- [x] Add Hoodie
- [x] Create mockup preview cards *(UI basic)*
- [x] Create start designing button *(create project → redirect editor)*
- [ ] Setup template system *(lanjut di Milestone 2)*

---

## PHASE 6 — EDITOR CORE

- [ ] Setup Fabric.js
- [ ] Create canvas editor
- [ ] Create canvas toolbar
- [ ] Create left sidebar
- [ ] Create right sidebar
- [ ] Create topbar
- [ ] Create bottom toolbar

---

## PHASE 7 — MULTI VIEW SYSTEM

- [ ] Front view canvas
- [ ] Back view canvas
- [ ] Left view canvas
- [ ] Right view canvas
- [ ] View switcher tabs
- [ ] Separate state per view
- [ ] Sync project save system

---

## PHASE 8 — CANVAS FEATURES

- [ ] Upload image · Drag · Resize · Rotate · Delete · Duplicate
- [ ] Layer ordering · Lock/Unlock · Snap guidelines
- [ ] Zoom · Pan · Undo · Redo

---

## PHASE 9 — TEXT FEATURES

- [ ] Add text · Font · Size · Color · Bold · Italic
- [ ] Alignment · Letter spacing · Shadow · Outline

---

## PHASE 10 — IMAGE FEATURES

- [ ] Opacity · Shadow · Flip · Crop
- [ ] Remove background (optional) · Filters (optional)

---

## PHASE 11 — MOCKUP SYSTEM

- [ ] Front/Back/Left/Right mockup images
- [ ] Safe print area · Responsive mockup · Shirt color change

---

## PHASE 12 — SAVE SYSTEM

- [ ] Autosave · Manual save · Canvas JSON · Thumbnail
- [ ] Restore project · Per-view state

---

## PHASE 13 — EXPORT & IMPORT

- [ ] Export PNG/JPG/JSON · Import JSON · `.wear` format
- [ ] Rebuild canvas · Validate files

---

## PHASE 14 — MY DESIGNS PAGE

- [ ] Grid · Search · Sort · Delete · Duplicate · Open

---

## PHASE 15 — PROFILE PAGE

- [ ] Edit profile · Avatar · Username · Dark toggle · Logout

---

## PHASE 16 — UI/UX POLISH

- [ ] Animations · Skeletons · Hover · Empty states
- [ ] Mobile editor · Keyboard shortcuts

---

## PHASE 17 — ADVANCED (NANTI)

- [ ] Sticker library · Templates · Realtime collab
- [ ] AI generator · 3D preview · Community

---

## FINAL CHECKLIST

- [ ] No canvas lag · Mobile responsive · Stable export/import
- [ ] Fast loading · Clean UI · No console errors
- [ ] Production ready · Deploy to Vercel
