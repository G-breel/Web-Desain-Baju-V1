# Requirements Document — Phase 11–16

## Introduction

Dokumen ini mencakup requirements untuk melanjutkan pengembangan web editor desain baju 2D dari Phase 11 hingga Phase 16. Fitur-fitur ini meliputi sistem mockup baju, export/import desain, halaman My Designs, halaman Profile, dan polish UI/UX.

## Glossary

- **Editor**: Halaman editor desain baju berbasis Fabric.js
- **Canvas**: Area gambar Fabric.js tempat user mendesain
- **DesignView**: Salah satu dari empat sudut pandang baju: front, back, left, right
- **ProductType**: Jenis produk baju: `oversize-tshirt` atau `hoodie`
- **Mockup**: Gambar baju transparan (PNG) yang ditampilkan di atas canvas sebagai referensi visual
- **PrintArea**: Area aman untuk mencetak desain, ditampilkan sebagai overlay di atas canvas
- **ShirtColor**: Warna latar belakang baju yang dipilih user
- **DesignProject**: Entitas desain yang tersimpan di database Supabase
- **Thumbnail**: Gambar preview kecil dari canvas yang disimpan ke Supabase Storage
- **WearFile**: Format file `.wear` berbasis JSON untuk export/import desain lengkap
- **User**: Pengguna yang sudah login

---

## PHASE 11 — MOCKUP SYSTEM

### Requirement 1: Tampilan Mockup Baju

**User Story:** Sebagai user, saya ingin melihat gambar mockup baju di atas canvas saya, sehingga saya bisa memvisualisasikan desain pada baju yang sebenarnya.

#### Acceptance Criteria

1. WHEN user membuka editor, THE Editor SHALL menampilkan gambar mockup baju yang sesuai dengan `product_type` dan `activeView` di atas canvas sebagai overlay
2. WHEN user mengganti `activeView`, THE Editor SHALL memperbarui gambar mockup sesuai view yang aktif
3. THE Mockup SHALL ditampilkan sebagai overlay di atas canvas dengan pointer-events none sehingga tidak mengganggu interaksi canvas
4. WHERE `product_type` adalah `oversize-tshirt`, THE Editor SHALL menampilkan mockup oversize t-shirt
5. WHERE `product_type` adalah `hoodie`, THE Editor SHALL menampilkan mockup hoodie

### Requirement 2: Safe Print Area

**User Story:** Sebagai user, saya ingin melihat area aman untuk mencetak desain, sehingga saya tahu batas desain yang akan tercetak.

#### Acceptance Criteria

1. THE Editor SHALL menampilkan overlay print area berupa border dashed di atas canvas yang menunjukkan batas area cetak
2. WHEN user mengaktifkan toggle "Tampilkan Print Area", THE Editor SHALL menampilkan overlay print area
3. WHEN user menonaktifkan toggle "Tampilkan Print Area", THE Editor SHALL menyembunyikan overlay print area
4. THE PrintArea SHALL memiliki dimensi yang berbeda per `DesignView` (front/back lebih besar dari left/right)

### Requirement 3: Shirt Color Change

**User Story:** Sebagai user, saya ingin mengganti warna baju, sehingga saya bisa melihat desain pada warna baju yang berbeda.

#### Acceptance Criteria

1. THE Editor SHALL menyediakan color picker untuk memilih warna baju di properties panel
2. WHEN user memilih warna baru, THE Editor SHALL memperbarui `backgroundColor` canvas dan warna tint mockup secara bersamaan
3. THE Editor SHALL menyediakan minimal 8 preset warna baju yang umum (putih, hitam, abu, navy, merah, dll)
4. THE Editor SHALL menyimpan `shirtColor` sebagai bagian dari data project yang tersimpan

---

## PHASE 12 (lanjutan) — SAVE THUMBNAIL

### Requirement 4: Save Preview Thumbnail

**User Story:** Sebagai user, saya ingin project saya memiliki thumbnail preview, sehingga saya bisa mengenali desain dengan mudah di dashboard.

#### Acceptance Criteria

1. WHEN user menyimpan desain (manual save atau autosave), THE Editor SHALL menghasilkan thumbnail dari canvas front view sebagai data URL
2. THE Editor SHALL mengupload thumbnail ke Supabase Storage bucket `thumbnails` dengan path `{user_id}/{design_id}.jpg`
3. THE Editor SHALL memperbarui kolom `thumbnail_url` di tabel `designs` dengan URL publik thumbnail
4. IF upload thumbnail gagal, THEN THE Editor SHALL tetap menyimpan canvas data tanpa menampilkan error ke user
5. THE Thumbnail SHALL berukuran maksimal 400×480 piksel dengan kualitas JPEG 0.8

---

## PHASE 13 — EXPORT & IMPORT

### Requirement 5: Export Desain

**User Story:** Sebagai user, saya ingin mengexport desain saya ke berbagai format, sehingga saya bisa menggunakan atau membagikan hasil desain.

#### Acceptance Criteria

1. WHEN user mengklik tombol Export PNG, THE Editor SHALL mengexport canvas view yang aktif sebagai file PNG dengan nama `{title}-{view}.png`
2. WHEN user mengklik tombol Export JPG, THE Editor SHALL mengexport canvas view yang aktif sebagai file JPG dengan kualitas 0.9 dan nama `{title}-{view}.jpg`
3. WHEN user mengklik tombol Export JSON, THE Editor SHALL mengexport seluruh canvas data semua view sebagai file JSON dengan nama `{title}.json`
4. WHEN user mengklik tombol Export .wear, THE Editor SHALL mengexport seluruh data project (canvas data, product type, shirt color, title) sebagai file `.wear` berbasis JSON dengan nama `{title}.wear`
5. THE Export SHALL tidak menyertakan gambar mockup overlay dalam hasil export

### Requirement 6: Import Desain

**User Story:** Sebagai user, saya ingin mengimport desain dari file, sehingga saya bisa melanjutkan desain yang sudah dibuat sebelumnya.

#### Acceptance Criteria

1. WHEN user mengupload file `.wear`, THE Editor SHALL memvalidasi struktur file dan memuat canvas data semua view
2. WHEN user mengupload file `.json`, THE Editor SHALL memvalidasi struktur file dan memuat canvas data ke view yang aktif
3. IF file yang diupload tidak valid atau rusak, THEN THE Editor SHALL menampilkan pesan error yang deskriptif
4. WHEN import berhasil, THE Editor SHALL memperbarui canvas dan menyimpan data ke database secara otomatis

---

## PHASE 14 — MY DESIGNS PAGE

### Requirement 7: Halaman My Designs

**User Story:** Sebagai user, saya ingin melihat semua desain saya dalam satu halaman, sehingga saya bisa mengelola koleksi desain dengan mudah.

#### Acceptance Criteria

1. THE My_Designs_Page SHALL menampilkan semua desain milik user yang sedang login dalam tampilan grid
2. THE My_Designs_Page SHALL menampilkan thumbnail, judul, product type, dan tanggal update untuk setiap desain
3. WHEN user mengetik di search bar, THE My_Designs_Page SHALL memfilter desain berdasarkan judul secara real-time
4. THE My_Designs_Page SHALL menyediakan opsi sort berdasarkan: terbaru, terlama, nama A-Z, nama Z-A
5. WHEN user mengklik tombol Delete pada desain, THE My_Designs_Page SHALL menampilkan konfirmasi sebelum menghapus
6. WHEN user mengkonfirmasi hapus, THE My_Designs_Page SHALL menghapus desain dari database dan memperbarui tampilan
7. WHEN user mengklik tombol Duplicate pada desain, THE My_Designs_Page SHALL membuat salinan desain dengan judul `{judul} (Copy)`
8. WHEN user mengklik kartu desain, THE My_Designs_Page SHALL mengarahkan user ke halaman editor desain tersebut
9. IF user belum memiliki desain, THEN THE My_Designs_Page SHALL menampilkan empty state dengan tombol buat desain baru

---

## PHASE 15 — PROFILE PAGE

### Requirement 8: Halaman Profile

**User Story:** Sebagai user, saya ingin mengelola profil saya, sehingga saya bisa mengatur informasi akun dan preferensi.

#### Acceptance Criteria

1. THE Profile_Page SHALL menampilkan informasi user: avatar, username, dan email
2. WHEN user mengklik tombol Edit Profile, THE Profile_Page SHALL menampilkan form edit dengan field username
3. WHEN user menyimpan perubahan username, THE Profile_Page SHALL memperbarui data di tabel `profiles` dan menampilkan pesan sukses
4. IF username yang dimasukkan kosong atau kurang dari 3 karakter, THEN THE Profile_Page SHALL menampilkan pesan validasi error
5. WHEN user mengklik tombol Upload Avatar, THE Profile_Page SHALL membuka file picker untuk memilih gambar
6. WHEN user memilih gambar avatar, THE Profile_Page SHALL mengupload ke Supabase Storage bucket `avatars` dan memperbarui `avatar_url` di tabel `profiles`
7. THE Profile_Page SHALL menampilkan tombol Logout yang mengarahkan user ke halaman login setelah logout
8. THE Profile_Page SHALL menampilkan statistik sederhana: jumlah total desain milik user

---

## PHASE 16 — UI/UX POLISH

### Requirement 9: Animasi dan Transisi

**User Story:** Sebagai user, saya ingin antarmuka yang responsif dan halus, sehingga pengalaman menggunakan aplikasi terasa menyenangkan.

#### Acceptance Criteria

1. THE App SHALL menampilkan skeleton loading pada kartu desain di dashboard dan my designs page saat data sedang dimuat
2. WHEN user hover pada kartu desain, THE App SHALL menampilkan animasi scale dan shadow yang halus
3. WHEN halaman berpindah, THE App SHALL menampilkan transisi fade yang halus
4. THE App SHALL menampilkan empty state yang informatif dengan ilustrasi dan call-to-action pada setiap halaman yang bisa kosong

### Requirement 10: Keyboard Shortcuts Editor

**User Story:** Sebagai user, saya ingin menggunakan keyboard shortcuts di editor, sehingga saya bisa bekerja lebih cepat.

#### Acceptance Criteria

1. THE Editor SHALL mendukung shortcut `Ctrl+Z` / `Cmd+Z` untuk Undo
2. THE Editor SHALL mendukung shortcut `Ctrl+Y` / `Ctrl+Shift+Z` / `Cmd+Shift+Z` untuk Redo
3. THE Editor SHALL mendukung shortcut `Ctrl+S` / `Cmd+S` untuk Save
4. THE Editor SHALL mendukung shortcut `Ctrl+D` / `Cmd+D` untuk Duplicate objek yang dipilih
5. THE Editor SHALL mendukung shortcut `Delete` / `Backspace` untuk menghapus objek yang dipilih (kecuali saat focus di input)
6. THE Editor SHALL menampilkan tooltip shortcut pada tombol toolbar

### Requirement 11: Rename Project di Dashboard

**User Story:** Sebagai user, saya ingin mengganti nama project dari dashboard, sehingga saya bisa mengorganisir desain dengan nama yang tepat.

#### Acceptance Criteria

1. WHEN user mengklik tombol Rename pada kartu project di dashboard, THE Dashboard SHALL menampilkan input inline untuk mengganti nama
2. WHEN user menekan Enter atau mengklik di luar input, THE Dashboard SHALL menyimpan nama baru ke database
3. IF nama baru kosong, THEN THE Dashboard SHALL membatalkan perubahan dan mempertahankan nama lama
