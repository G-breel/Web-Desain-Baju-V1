# Design Document — Phase 11–16

## Overview

Dokumen ini mendeskripsikan desain teknis untuk melanjutkan pengembangan web editor desain baju dari Phase 11 hingga Phase 16. Implementasi menggunakan Next.js App Router, Fabric.js, Supabase, dan TypeScript.

---

## Architecture

```
src/
├── app/
│   ├── actions/
│   │   ├── designs.ts          (tambah: renameDesignAction)
│   │   ├── editor.ts           (tambah: saveThumbnailAction, saveCanvasWithThumbnailAction)
│   │   └── profile.ts          (baru: updateProfileAction, uploadAvatarAction)
│   ├── dashboard/page.tsx      (tambah: rename inline)
│   ├── designs/page.tsx        (upgrade: grid, search, sort, delete confirm, duplicate)
│   └── profile/page.tsx        (upgrade: edit form, avatar upload, stats)
├── components/
│   ├── editor/
│   │   ├── design-editor.tsx   (tambah: mockup overlay, print area, export/import, thumbnail)
│   │   ├── mockup-overlay.tsx  (baru)
│   │   ├── print-area-overlay.tsx (baru)
│   │   └── export-import-panel.tsx (baru)
│   ├── dashboard/
│   │   ├── design-card.tsx     (baru: card dengan rename inline)
│   │   └── designs-grid.tsx    (baru: grid dengan search/sort)
│   └── ui/
│       └── skeleton.tsx        (baru)
├── lib/
│   ├── editor/
│   │   ├── constants.ts        (tambah: MOCKUP_PATHS, PRINT_AREAS, SHIRT_COLOR_PRESETS)
│   │   ├── mockup-helpers.ts   (baru: getMockupSrc, getPrintArea)
│   │   └── export-helpers.ts   (baru: exportCanvas, buildWearFile, parseWearFile)
│   └── utils/
│       └── validation.ts       (baru: validateUsername, validateTitle)
└── public/
    └── mockups/
        ├── oversize-tshirt-front.png
        ├── oversize-tshirt-back.png
        ├── oversize-tshirt-left.png
        ├── oversize-tshirt-right.png
        ├── hoodie-front.png
        ├── hoodie-back.png
        ├── hoodie-left.png
        └── hoodie-right.png
```

---

## Components and Interfaces

### Phase 11 — Mockup System

#### `MockupOverlay`
```tsx
interface MockupOverlayProps {
  productType: ProductType;
  view: DesignView;
  shirtColor: string;
  width: number;
  height: number;
}
```
Komponen ini merender `<img>` dengan `mix-blend-mode: multiply` untuk tinting warna baju, dan `pointer-events: none` agar tidak mengganggu canvas.

#### `PrintAreaOverlay`
```tsx
interface PrintAreaOverlayProps {
  view: DesignView;
  visible: boolean;
  canvasWidth: number;
  canvasHeight: number;
}
```
Merender border dashed yang menunjukkan area cetak aman per view.

#### `getMockupSrc(productType, view): string`
Mengembalikan path gambar mockup dari `public/mockups/`.

#### `getPrintArea(view): { top: number; left: number; width: number; height: number }`
Mengembalikan dimensi print area per view.

#### `SHIRT_COLOR_PRESETS`
Array 8+ warna preset: putih, hitam, abu, navy, merah, biru muda, hijau army, krem.

---

### Phase 12 (lanjutan) — Thumbnail

#### `saveThumbnailAction(designId, dataUrl, userId)`
Server action yang mengupload thumbnail ke Supabase Storage `thumbnails/{userId}/{designId}.jpg` dan update `thumbnail_url` di tabel `designs`.

#### Integrasi di `design-editor.tsx`
Saat `handleSave` dipanggil, generate thumbnail dari canvas front view menggunakan `canvas.toDataURL('image/jpeg', 0.8)` lalu panggil `saveThumbnailAction` secara fire-and-forget (tidak block save utama).

---

### Phase 13 — Export & Import

#### `exportCanvas(canvas, format, title, view)`
- `format: 'png' | 'jpg'` → download file via anchor element
- Menggunakan `canvas.toDataURL()`

#### `buildWearFile(viewData, productType, shirtColor, title): string`
Serializes seluruh project ke JSON string dengan struktur:
```json
{
  "version": "1.0",
  "format": "wear",
  "title": "...",
  "productType": "...",
  "shirtColor": "...",
  "views": { "front": {...}, "back": {...}, "left": {...}, "right": {...} }
}
```

#### `parseWearFile(jsonString): WearFileData`
Memvalidasi dan mem-parse string JSON ke `WearFileData`. Throws `Error` dengan pesan deskriptif jika tidak valid.

#### `WearFileData` interface
```ts
interface WearFileData {
  version: string;
  format: "wear";
  title: string;
  productType: ProductType;
  shirtColor: string;
  views: Record<DesignView, unknown>;
}
```

#### `ExportImportPanel`
Komponen panel di editor yang menampilkan tombol export (PNG, JPG, JSON, .wear) dan tombol import (.wear, .json).

---

### Phase 14 — My Designs Page

#### `DesignCard`
```tsx
interface DesignCardProps {
  design: DesignProject;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, title: string) => void;
}
```
Card dengan thumbnail preview, judul, product type, tanggal, dan action buttons. Delete menampilkan konfirmasi dialog.

#### `filterDesigns(designs, query): DesignProject[]`
Filter berdasarkan judul (case-insensitive).

#### `sortDesigns(designs, sort): DesignProject[]`
Sort berdasarkan: `'newest' | 'oldest' | 'name-asc' | 'name-desc'`.

#### Upgrade `designs/page.tsx`
- Client component dengan state untuk search, sort, dan delete confirmation
- Fetch data di server, pass ke client component
- Skeleton loading saat data belum ada

---

### Phase 15 — Profile Page

#### `updateProfileAction(formData)`
Server action untuk update `username` di tabel `profiles`. Validasi: username minimal 3 karakter, maksimal 30 karakter, hanya alphanumeric dan underscore.

#### `uploadAvatarAction(formData)`
Server action untuk upload avatar ke Supabase Storage `avatars/{userId}` dan update `avatar_url`.

#### `validateUsername(username): { valid: boolean; error?: string }`
Validasi username: minimal 3 karakter, maksimal 30, hanya `[a-zA-Z0-9_]`.

#### Upgrade `profile/page.tsx`
- Tambah form edit username (inline toggle)
- Tambah upload avatar
- Tambah statistik jumlah desain
- Sudah ada: logout, theme toggle

---

### Phase 16 — UI/UX Polish

#### `Skeleton`
Komponen skeleton loading dengan animasi pulse untuk card placeholder.

#### `DesignCardSkeleton`
Skeleton versi DesignCard untuk loading state.

#### Rename inline di Dashboard
`DesignCard` di dashboard sudah punya `renameDesignAction`. Tambah state `isRenaming` dan input inline yang muncul saat klik tombol rename.

---

## Data Models

### `WearFileData`
```ts
interface WearFileData {
  version: string;       // "1.0"
  format: "wear";
  title: string;
  productType: ProductType;
  shirtColor: string;    // hex color
  views: Record<DesignView, unknown>; // Fabric.js canvas JSON per view
}
```

### Update `DesignProject`
`shirtColor` perlu disimpan. Opsi: tambah kolom `shirt_color` di tabel `designs`, atau simpan sebagai bagian dari `canvas_data` dengan key `_meta`.

Pilihan: simpan di `canvas_data._meta.shirtColor` untuk menghindari migrasi database baru.

### `PrintAreaConfig`
```ts
interface PrintAreaConfig {
  top: number;
  left: number;
  width: number;
  height: number;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: getMockupSrc returns valid path for all product/view combinations

*For any* valid `ProductType` and `DesignView`, `getMockupSrc(productType, view)` should return a non-empty string path that starts with `/mockups/` and contains both the product type and view name.

**Validates: Requirements 1.2, 1.4, 1.5**

---

### Property 2: getPrintArea returns distinct dimensions for front/back vs left/right

*For any* two views where one is `front` or `back` and the other is `left` or `right`, `getPrintArea(view)` should return different width values — front/back area lebih lebar dari left/right.

**Validates: Requirements 2.4**

---

### Property 3: WearFile serialization round-trip

*For any* valid `WearFileData` object, `parseWearFile(buildWearFile(data))` should produce an object equivalent to the original data (same title, productType, shirtColor, and views).

**Validates: Requirements 5.4, 6.1**

---

### Property 4: parseWearFile rejects invalid inputs

*For any* string that is not valid JSON or does not have `format: "wear"`, `parseWearFile(input)` should throw an `Error` with a non-empty message.

**Validates: Requirements 6.3**

---

### Property 5: filterDesigns returns only matching designs

*For any* array of designs and any non-empty query string, every design returned by `filterDesigns(designs, query)` should have a title that contains the query (case-insensitive), and no matching design should be excluded.

**Validates: Requirements 7.3**

---

### Property 6: sortDesigns preserves all elements and produces correct order

*For any* array of designs and any valid sort option, `sortDesigns(designs, sort)` should return an array with the same length and same elements, ordered correctly per the sort option.

**Validates: Requirements 7.4**

---

### Property 7: validateUsername rejects invalid inputs

*For any* string with length < 3 or > 30 or containing characters outside `[a-zA-Z0-9_]`, `validateUsername(input)` should return `{ valid: false }` with a non-empty error message.

**Validates: Requirements 8.4, 11.3**

---

## Error Handling

- **Thumbnail upload gagal**: Fire-and-forget, tidak block save utama, tidak tampilkan error ke user
- **Export canvas**: Wrap dalam try-catch, tampilkan toast error jika gagal
- **Import file invalid**: `parseWearFile` throw Error, ditangkap di handler dan tampilkan toast error
- **Profile update gagal**: Return `{ error: string }` dari server action, tampilkan di form
- **Avatar upload gagal**: Toast error, tidak update `avatar_url`

---

## Testing Strategy

### Unit Tests
- `getMockupSrc`: test semua 8 kombinasi product/view
- `getPrintArea`: test semua 4 views
- `buildWearFile` / `parseWearFile`: test round-trip dan invalid inputs
- `filterDesigns` / `sortDesigns`: test dengan berbagai input
- `validateUsername`: test boundary values (2 char, 3 char, 30 char, 31 char, special chars)

### Property-Based Tests
Menggunakan **fast-check** (TypeScript property-based testing library).

Setiap property test dikonfigurasi dengan minimum 100 iterasi.

- **Property 3**: Generate random `WearFileData` objects, test round-trip
- **Property 4**: Generate random invalid strings, test error throwing
- **Property 5**: Generate random design arrays dan query strings, test filter correctness
- **Property 6**: Generate random design arrays, test sort correctness
- **Property 7**: Generate random strings, test validation correctness

Tag format: `// Feature: phase-11-16, Property N: description`
