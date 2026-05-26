# PROJECT TODO — WEB DESAIN BAJU

**Progress:** Phase 1–10 & 12 (basic) selesai · Phase 11, 13–17 belum

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

## PHASE 6 — EDITOR CORE ✅ *(basic)*

- [x] Setup Fabric.js
- [x] Create canvas editor
- [x] Create canvas toolbar
- [x] Create left sidebar
- [x] Create right sidebar
- [x] Create topbar
- [ ] Create bottom toolbar

---

## PHASE 7 — MULTI VIEW SYSTEM ✅ *(basic)*

- [x] Front view canvas
- [x] Back view canvas
- [x] Left view canvas
- [x] Right view canvas
- [x] View switcher tabs
- [x] Separate state per view
- [x] Sync project save system

---

## PHASE 8 — CANVAS FEATURES ✅ *(basic)*

- [x] Upload image · Drag · Resize · Rotate · Delete · Duplicate
- [x] Layer ordering · Lock/Unlock · Snap guidelines
- [x] Zoom · Pan · Undo · Redo

---

## PHASE 9 — TEXT FEATURES ✅ *(basic)*

- [x] Add text · Font · Size · Color · Bold · Italic
- [x] Alignment · Letter spacing · Shadow
- [ ] Text outline

---

## PHASE 10 — IMAGE FEATURES ✅ *(basic)*

- [x] Opacity · Shadow · Flip
- [ ] Image crop
- [ ] Remove background (optional) · Filters (optional)

---

## PHASE 11 — MOCKUP SYSTEM

- [ ] Front/Back/Left/Right mockup images
- [ ] Safe print area · Responsive mockup · Shirt color change

---

## PHASE 12 — SAVE SYSTEM ✅ *(basic)*

- [x] Autosave · Manual save · Canvas JSON
- [x] Restore project · Per-view state
- [ ] Save preview thumbnail

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
