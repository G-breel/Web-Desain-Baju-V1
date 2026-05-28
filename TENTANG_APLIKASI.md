# Tentang Aplikasi — Desain Baju

## Apa Ini?

**Desain Baju** adalah web app editor desain kaos dan hoodie berbasis browser. Pengguna bisa membuat desain custom langsung di web — tanpa install software apapun — lalu menyimpan, mengekspor, atau mengimpor hasilnya.

Target pengguna: siapa saja yang mau bikin desain baju sendiri, dari yang iseng sampai yang serius mau cetak.

---

## Fitur Utama

### 🎨 Editor Multi-View
Canvas editor yang mendukung 4 sudut pandang sekaligus:
- **Depan** — area utama desain
- **Belakang** — sisi punggung
- **Kiri** — lengan/sisi kiri
- **Kanan** — lengan/sisi kanan

Setiap view punya canvas independen. Desain di view Depan tidak akan muncul di view Belakang, dan seterusnya.

### 🖼️ Manipulasi Objek
- Upload gambar (JPG, PNG, SVG, WebP)
- Tambah teks dengan pilihan font, ukuran, warna, bold, italic, alignment
- Drag, resize, rotate, duplikasi, hapus objek
- Undo/Redo (Ctrl+Z / Ctrl+Y)
- Layer ordering — atur urutan tumpukan objek
- Lock/unlock objek agar tidak bergeser

### 👕 Mockup Baju
- Mockup SVG baju/hoodie tampil langsung di canvas sebagai referensi visual
- Ganti warna baju via color picker atau 10 preset warna
- Overlay area cetak (safe print area) yang bisa di-toggle on/off
- Warna baju tersinkron di semua view

### 💾 Simpan & Ekspor
- **Autosave** otomatis setiap 30 detik ke Supabase
- **Manual save** dengan Ctrl+S
- **Export PNG/JPG** — ekspor view aktif sebagai gambar
- **Export JSON** — ekspor semua view dalam format data
- **Export `.wear`** — format khusus yang menyimpan seluruh project (canvas + jenis produk + warna baju)
- **Import `.wear` / JSON** — load project yang pernah diekspor

### 📁 Manajemen Desain
- Dashboard dengan grid semua desain yang pernah dibuat
- Thumbnail preview otomatis tersimpan
- Search, sort, rename, duplikasi, hapus desain
- Halaman "My Designs" terpisah

### 👤 Akun Pengguna
- Register & login dengan email/password
- Login dengan Google (OAuth)
- Edit profil: username, avatar
- Statistik jumlah desain

---

## Cara Kerja (Alur Penggunaan)

```
1. Register / Login
        ↓
2. Pilih Produk (Kaos Oversize atau Hoodie)
        ↓
3. Masuk ke Editor
        ↓
4. Tambah desain di canvas (gambar, teks, dll)
        ↓
5. Ganti view (Depan/Belakang/Kiri/Kanan) sesuai kebutuhan
        ↓
6. Simpan (otomatis atau manual)
        ↓
7. Ekspor hasil (PNG, JPG, atau .wear)
```

---

## Cara Kerja Teknis

### Stack Teknologi
| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | Tailwind CSS v4 |
| Canvas Editor | Fabric.js v7 |
| Backend / Auth | Supabase |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage |
| Animasi | Framer Motion |
| Notifikasi | Sonner |
| Bahasa | TypeScript |

### Arsitektur Singkat

```
Browser
  └── Next.js App Router
        ├── (auth)/login & register   → halaman autentikasi
        ├── dashboard/                → daftar desain user
        ├── editor/[id]/              → canvas editor utama
        ├── my-designs/               → manajemen desain
        └── profile/                  → pengaturan akun

Supabase
  ├── Auth                            → session & OAuth
  ├── Database
  │     ├── profiles                  → data user
  │     ├── designs                   → metadata desain
  │     └── assets                    → referensi file upload
  └── Storage
        ├── assets/                   → gambar yang diupload user
        ├── thumbnails/               → preview thumbnail desain
        └── avatars/                  → foto profil user
```

### Bagaimana Canvas Bekerja

Editor menggunakan **Fabric.js** yang di-render di atas elemen `<canvas>` HTML. Setiap view (depan/belakang/kiri/kanan) punya instance canvas sendiri.

- Saat user pindah tab view, state canvas yang aktif di-serialize ke JSON dan disimpan di memory
- View baru di-render dari data JSON yang tersimpan (bukan dari nol)
- Saat save, semua 4 view di-serialize sekaligus dan dikirim ke Supabase sebagai satu record

### Autentikasi

Menggunakan Supabase Auth dengan middleware Next.js untuk proteksi route. Session disimpan di cookie (SSR-compatible). Callback OAuth ada di `/auth/callback`.

### Penyimpanan Desain

Data desain disimpan sebagai JSON di kolom `canvas_data` tabel `designs`. Strukturnya:

```json
{
  "front":  { "objects": [...], "background": "#ffffff" },
  "back":   { "objects": [...], "background": "#ffffff" },
  "left":   { "objects": [...], "background": "#ffffff" },
  "right":  { "objects": [...], "background": "#ffffff" }
}
```

Thumbnail di-generate dari canvas aktif lalu diupload ke Supabase Storage bucket `thumbnails/`.

---

## Shortcut Keyboard Editor

| Shortcut | Aksi |
|---|---|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+S` | Simpan manual |
| `Ctrl+D` | Duplikasi objek |
| `Delete` / `Backspace` | Hapus objek terpilih |
| `1` / `2` / `3` / `4` | Pindah ke view Depan/Belakang/Kiri/Kanan |

---

## Setup Lokal

```bash
# Clone & install
npm install

# Salin env dan isi variabel Supabase
cp .env.local.example .env.local

# Jalankan dev server
npm run dev
```

Buka `http://localhost:3000`.

Untuk setup Supabase lengkap (database, storage, auth), lihat [README.md](./README.md).

---

## Status Project

Phase 1–16 sudah selesai (fitur dasar lengkap). Phase 17 (sticker library, templates, AI generator, 3D preview, kolaborasi realtime) masih dalam rencana.

Lihat [PROJECT_TODO.md](./PROJECT_TODO.md) untuk checklist lengkap per phase.
