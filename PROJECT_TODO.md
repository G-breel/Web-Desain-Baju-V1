# PROJECT TODO — WEB DESAIN BAJU

**Progress:** Phase 1–16 selesai (basic) · Phase 17 belum

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

## PHASE 3 — DATABASE & STORAGE ✅

- [x] Create users table *(Supabase `auth.users`)*
- [x] Create users profile table
- [x] Create designs table
- [x] Create assets table
- [x] Setup Row Level Security (RLS)
- [x] Setup user access policy
- [x] Setup Supabase Storage *(buckets: `assets`, `thumbnails`, `avatars`)*
- [x] Setup upload bucket *(buat di dashboard + policies di `005_avatars_storage_policies.sql`)*

---

## PHASE 4 — DASHBOARD ✅

- [x] Create dashboard page
- [x] Create recent design section
- [x] Create new design button
- [x] Create project cards dengan thumbnail
- [x] Create delete project feature *(dengan konfirmasi)*
- [x] Create rename project feature *(inline edit)*
- [x] Create duplicate project feature
- [x] Create search project feature
- [x] Create empty state UI

---

## PHASE 5 — PRODUCT SELECTION ✅ *(basic)*

- [x] Create product selection page
- [x] Add Oversize T-Shirt
- [x] Add Hoodie
- [x] Create mockup preview cards
- [x] Create start designing button
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

## PHASE 7 — MULTI VIEW SYSTEM ✅

- [x] Front view canvas
- [x] Back view canvas
- [x] Left view canvas
- [x] Right view canvas
- [x] View switcher tabs
- [x] Separate state per view
- [x] Sync project save system

---

## PHASE 8 — CANVAS FEATURES ✅

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

## PHASE 11 — MOCKUP SYSTEM ✅ *(basic)*

- [x] Safe print area overlay *(toggle on/off)*
- [x] Shirt color change *(color picker + 10 preset warna)*
- [x] ShirtColor tersimpan per project
- [ ] Front/Back/Left/Right mockup images *(SVG placeholder ada, perlu gambar nyata)*

---

## PHASE 12 — SAVE SYSTEM ✅

- [x] Autosave · Manual save · Canvas JSON
- [x] Restore project · Per-view state
- [x] Save preview thumbnail *(upload ke Supabase Storage `thumbnails/`)*

---

## PHASE 13 — EXPORT & IMPORT ✅

- [x] Export PNG · Export JPG *(view aktif)*
- [x] Export JSON *(semua view)*
- [x] Export `.wear` *(full project: canvas + product type + shirt color)*
- [x] Import `.wear` *(load full project)*
- [x] Import JSON *(load ke view aktif)*
- [x] Validasi file saat import

---

## PHASE 14 — MY DESIGNS PAGE ✅

- [x] Grid tampilan desain
- [x] Search real-time by judul
- [x] Sort: terbaru, terlama, nama A-Z, nama Z-A
- [x] Delete dengan konfirmasi
- [x] Duplicate
- [x] Open editor
- [x] Thumbnail preview
- [x] Empty state

---

## PHASE 15 — PROFILE PAGE ✅

- [x] Edit username *(inline)*
- [x] Upload avatar *(ke Supabase Storage `avatars/`)*
- [x] Dark mode toggle
- [x] Logout
- [x] Statistik jumlah desain

---

## PHASE 16 — UI/UX POLISH ✅

- [x] Skeleton loading *(dashboard & my designs)*
- [x] Hover animations pada kartu desain
- [x] Empty states dengan CTA
- [x] Keyboard shortcuts editor *(Ctrl+Z, Ctrl+Y, Ctrl+S, Ctrl+D, Delete)*
- [x] Tooltip shortcut pada toolbar
- [x] Rename inline di dashboard

---

## PHASE 17 — ADVANCED (NANTI)

- [ ] Sticker library · Templates · Realtime collab
- [ ] AI generator · 3D preview · Community

---

## KNOWN ISSUES / TODO LANJUTAN

- [ ] Editor canvas: mockup baju (layout baju) belum tampil — perlu gambar PNG/SVG nyata
- [ ] Editor canvas: interaksi objek perlu diverifikasi setelah perubahan struktur DOM
- [ ] Text outline di editor
- [ ] Image crop di editor
- [ ] Bottom toolbar editor
- [ ] Template system

---

## FINAL CHECKLIST

- [ ] No canvas lag · Mobile responsive · Stable export/import
- [ ] Fast loading · Clean UI · No console errors
- [ ] Production ready · Deploy to Vercel
