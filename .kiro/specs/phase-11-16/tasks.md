# Implementation Plan: Phase 11–16

## Overview

Implementasi bertahap dari Phase 11 (Mockup System) hingga Phase 16 (UI/UX Polish) untuk web editor desain baju 2D.

## Tasks

- [x] 1. Phase 11 — Mockup System
  - [x] 1.1 Tambah konstanta mockup dan print area di `src/lib/editor/constants.ts`
    - Tambah `SHIRT_COLOR_PRESETS` array (8+ warna preset)
    - Tambah `MOCKUP_PATHS` mapping product/view ke path file
    - Tambah `PRINT_AREAS` mapping view ke dimensi area cetak
    - _Requirements: 1.1, 2.4, 3.3_

  - [x] 1.2 Buat `src/lib/editor/mockup-helpers.ts`
    - Implementasi `getMockupSrc(productType, view): string`
    - Implementasi `getPrintArea(view): PrintAreaConfig`
    - _Requirements: 1.2, 2.4_

  - [ ]* 1.3 Tulis unit test untuk mockup-helpers
    - Test `getMockupSrc` untuk semua 8 kombinasi product/view
    - Test `getPrintArea` untuk semua 4 views
    - **Property 1: getMockupSrc returns valid path for all product/view combinations**
    - **Property 2: getPrintArea returns distinct dimensions for front/back vs left/right**
    - **Validates: Requirements 1.2, 1.4, 1.5, 2.4**

  - [x] 1.4 Tambah gambar mockup placeholder ke `public/mockups/`
    - Buat 8 file SVG/PNG placeholder untuk oversize-tshirt dan hoodie (front/back/left/right)
    - _Requirements: 1.1, 1.4, 1.5_

  - [x] 1.5 Buat komponen `src/components/editor/mockup-overlay.tsx`
    - Render `<img>` dengan `mix-blend-mode: multiply` untuk tinting warna baju
    - `pointer-events: none`, posisi absolute di atas canvas
    - Props: `productType`, `view`, `shirtColor`, `width`, `height`
    - _Requirements: 1.1, 1.2, 1.3, 3.2_

  - [x] 1.6 Buat komponen `src/components/editor/print-area-overlay.tsx`
    - Render border dashed sebagai overlay print area
    - Toggle visibility via prop `visible`
    - Dimensi dari `getPrintArea(view)`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 1.7 Integrasi mockup dan print area ke `design-editor.tsx`
    - Tambah state `showPrintArea` (default false)
    - Tambah toggle button "Print Area" di toolbar
    - Render `MockupOverlay` dan `PrintAreaOverlay` di atas canvas
    - Tambah `SHIRT_COLOR_PRESETS` swatches di PropertiesPanel
    - Simpan `shirtColor` ke `canvas_data._meta.shirtColor` saat save
    - Restore `shirtColor` dari `canvas_data._meta.shirtColor` saat load
    - _Requirements: 1.1, 1.2, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

- [x] 2. Phase 12 (lanjutan) — Save Thumbnail
  - [x] 2.1 Tambah `saveThumbnailAction` ke `src/app/actions/editor.ts`
    - Upload data URL ke Supabase Storage `thumbnails/{userId}/{designId}.jpg`
    - Update `thumbnail_url` di tabel `designs`
    - Return `{ success: true }` atau `{ error: string }`
    - _Requirements: 4.2, 4.3_

  - [x] 2.2 Integrasi thumbnail ke `handleSave` di `design-editor.tsx`
    - Generate thumbnail dari canvas menggunakan `canvas.toDataURL('image/jpeg', 0.8)`
    - Panggil `saveThumbnailAction` secara fire-and-forget setelah save canvas berhasil
    - Jika gagal, tidak tampilkan error ke user
    - _Requirements: 4.1, 4.4, 4.5_

- [x] 3. Phase 13 — Export & Import
  - [x] 3.1 Buat `src/lib/editor/export-helpers.ts`
    - Implementasi `buildWearFile(viewData, productType, shirtColor, title): string`
    - Implementasi `parseWearFile(jsonString): WearFileData`
    - Implementasi `downloadFile(dataUrl, filename)` helper
    - _Requirements: 5.4, 6.1, 6.3_

  - [ ]* 3.2 Tulis property test untuk export-helpers
    - **Property 3: WearFile serialization round-trip**
    - **Property 4: parseWearFile rejects invalid inputs**
    - **Validates: Requirements 5.4, 6.1, 6.3**

  - [x] 3.3 Buat komponen `src/components/editor/export-import-panel.tsx`
    - Tombol Export PNG, Export JPG, Export JSON, Export .wear
    - Tombol Import (.wear, .json) dengan file input tersembunyi
    - Handler untuk setiap aksi export/import
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4_

  - [x] 3.4 Integrasi ExportImportPanel ke `design-editor.tsx`
    - Tambah tombol "Export/Import" di topbar yang membuka panel
    - Pass canvas ref, viewData, productType, shirtColor, title ke panel
    - Handle import: load data ke canvas dan trigger save
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4_

  - [x] 3.5 Checkpoint — Pastikan semua test pass
    - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Phase 14 — My Designs Page
  - [x] 4.1 Buat `src/lib/utils/validation.ts`
    - Implementasi `validateUsername(username): { valid: boolean; error?: string }`
    - Implementasi `validateTitle(title): boolean`
    - _Requirements: 8.4, 11.3_

  - [ ]* 4.2 Tulis property test untuk validation utils
    - **Property 7: validateUsername rejects invalid inputs**
    - **Validates: Requirements 8.4, 11.3**

  - [x] 4.3 Buat `src/components/ui/skeleton.tsx`
    - Komponen `Skeleton` dengan animasi pulse
    - Komponen `DesignCardSkeleton` untuk loading state
    - _Requirements: 9.1_

  - [x] 4.4 Upgrade `src/app/designs/page.tsx` menjadi halaman lengkap
    - Fetch data di server, pass ke client component
    - Tambah search bar (filter by title, real-time)
    - Tambah sort dropdown (terbaru, terlama, nama A-Z, nama Z-A)
    - Tampilkan thumbnail jika ada
    - Delete dengan konfirmasi dialog
    - Duplicate dengan judul "(Copy)"
    - Empty state dengan ilustrasi dan CTA
    - Skeleton loading
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

  - [ ]* 4.5 Tulis unit test untuk filterDesigns dan sortDesigns
    - **Property 5: filterDesigns returns only matching designs**
    - **Property 6: sortDesigns preserves all elements and produces correct order**
    - **Validates: Requirements 7.3, 7.4**

- [x] 5. Phase 15 — Profile Page
  - [x] 5.1 Buat `src/app/actions/profile.ts`
    - Implementasi `updateProfileAction(formData)` — update username di tabel `profiles`
    - Implementasi `uploadAvatarAction(formData)` — upload ke Supabase Storage `avatars/`
    - Validasi menggunakan `validateUsername`
    - _Requirements: 8.3, 8.4, 8.6_

  - [x] 5.2 Upgrade `src/app/profile/page.tsx`
    - Tambah form edit username (inline toggle edit/save)
    - Tambah upload avatar dengan preview
    - Tambah statistik: jumlah total desain user
    - Pertahankan: logout button, theme toggle, display name, email
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [x] 6. Phase 16 — UI/UX Polish & Dashboard Rename
  - [x] 6.1 Upgrade `src/app/dashboard/page.tsx` — tambah rename inline
    - Tambah state `renamingId` dan `renameValue`
    - Klik tombol Rename → tampilkan input inline menggantikan judul
    - Enter atau blur → panggil `renameDesignAction`, reset state
    - Jika nama kosong → batalkan, pertahankan nama lama
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 6.2 Tambah hover animations dan transisi ke design cards
    - Tambah `transition-transform hover:scale-[1.02]` dan shadow pada kartu
    - Tambah `transition-colors` pada tombol-tombol
    - _Requirements: 9.2_

  - [x] 6.3 Tambah tooltip shortcut pada toolbar editor
    - Update `title` attribute pada semua tombol toolbar di `design-editor.tsx` dengan shortcut info
    - Contoh: "Undo (Ctrl+Z)", "Save (Ctrl+S)", dll.
    - _Requirements: 10.6_

  - [x] 6.4 Final checkpoint — Pastikan semua test pass
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks bertanda `*` adalah opsional (test) dan bisa dilewati untuk MVP lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceability
- Mockup images awal menggunakan SVG placeholder — bisa diganti dengan gambar nyata nanti
- `shirtColor` disimpan di `canvas_data._meta` untuk menghindari migrasi database
- Property tests menggunakan **fast-check** library
