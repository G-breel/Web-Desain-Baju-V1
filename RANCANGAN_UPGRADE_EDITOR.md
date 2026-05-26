# Prompt Upgrade Editor Desain Baju / Hoodie

> Dokumen ini berisi prompt utama dan rincian pengerjaan per phase untuk upgrade editor desain baju/hoodie.

---

## Prompt Utama

```
Kamu adalah senior frontend developer yang ahli dalam membangun design editor tool berbasis web.

Tugasmu adalah meng-upgrade editor desain baju/hoodie yang sudah ada menjadi lebih stabil, intuitif, dan siap pakai secara profesional.

Editor ini mendukung 4 view: Depan, Belakang, Kiri, dan Kanan. Pengguna bisa menambahkan teks, gambar, dan elemen desain lainnya ke setiap view, lalu menyimpan dan mengekspor hasilnya.

Lakukan upgrade secara bertahap mengikuti 4 phase berikut. Setiap phase harus diselesaikan dan diverifikasi sebelum melanjutkan ke phase berikutnya.

Untuk setiap perubahan:
- Jelaskan apa yang kamu ubah dan kenapa.
- Tunjukkan kode sebelum dan sesudah jika relevan.
- Pastikan tidak ada fitur yang rusak setelah perubahan.
- Gunakan bahasa kode yang konsisten dengan codebase yang sudah ada.
```

---

## Phase 1 — Perbaikan Alur Multi-View Editor

**Tujuan:** Membuat perpindahan antar view (depan, belakang, kiri, kanan) berjalan mulus tanpa kehilangan atau tertukarnya data desain.

### Yang Harus Dilakukan

**1.1 — State Management Per View**
- Pisahkan state canvas untuk masing-masing view (`front`, `back`, `left`, `right`) secara independen.
- Saat pengguna pindah tab, simpan state canvas view yang sedang aktif sebelum merender view baru.
- Saat kembali ke view yang pernah dibuka, restore state canvas dari data yang tersimpan — bukan dari ulang dari awal.
- Pastikan objek (gambar, teks, shape) tidak berpindah antar view saat tab diganti.

**1.2 — Sinkronisasi Data Antar View**
- Warna baju/hoodie harus sinkron di semua view (ubah di satu view → berubah di semua view).
- Data desain per view tersimpan dalam struktur seperti berikut:
  ```json
  {
    "front": { "objects": [...], "background": "#ffffff" },
    "back": { "objects": [...], "background": "#ffffff" },
    "left": { "objects": [...], "background": "#ffffff" },
    "right": { "objects": [...], "background": "#ffffff" }
  }
  ```
- Saat load halaman, semua view diinisialisasi dari data tersimpan (bukan kosong).

**1.3 — Transisi Tab yang Bersih**
- Saat tab view diganti, tampilkan loading indicator singkat (skeleton atau spinner) sambil canvas di-render ulang.
- Hindari flash kosong atau glitch saat berpindah view.
- Aktifkan tab yang dipilih secara visual dengan highlight yang jelas.

**Checklist Verifikasi Phase 1:**
- [ ] Desain di view Depan tidak muncul di view Belakang.
- [ ] Pindah tab dan kembali — desain tetap ada dan tidak berubah posisi.
- [ ] Warna baju berubah di semua view saat dipilih dari color picker.
- [ ] Tidak ada error di console saat pindah antar view.

---

## Phase 2 — Perbaikan Render Mockup dan Overlay Print Area

**Tujuan:** Mockup baju dan overlay area cetak tampil presisi, responsif terhadap zoom, dan tidak bergeser.

### Yang Harus Dilakukan

**2.1 — Posisi Mockup yang Konsisten**
- Mockup baju harus selalu berada di tengah canvas secara horizontal dan vertikal.
- Saat zoom berubah, mockup dan area cetak harus ikut scale secara proporsional — bukan bergeser atau overflow.
- Gunakan CSS transform-origin yang konsisten agar scaling tidak menggeser posisi mockup.

**2.2 — Overlay Area Cetak yang Presisi**
- Overlay area cetak ditampilkan sebagai border dashed atau tinted overlay di atas mockup.
- Ukuran area cetak harus akurat terhadap ukuran cetak nyata (misalnya: 30x40cm untuk area depan hoodie).
- Area cetak tidak boleh berubah ukuran saat pengguna zoom — hanya posisinya yang ikut zoom.
- Tampilkan label dimensi area cetak (contoh: "30 × 40 cm") di sudut overlay.

**2.3 — Mockup Per View**
- Setiap view menggunakan gambar mockup yang sesuai (depan, belakang, kiri, kanan).
- Mockup diganti otomatis saat tab view berubah.
- Jika file mockup tidak tersedia, tampilkan placeholder dengan label view yang jelas (misalnya: "Mockup Kiri Belum Tersedia").

**2.4 — Responsivitas Canvas**
- Canvas dan mockup harus tetap tampil baik di berbagai ukuran layar (minimal 1024px lebar).
- Tambahkan min-width pada container canvas agar tidak collapse di layar kecil.

**Checklist Verifikasi Phase 2:**
- [ ] Mockup selalu berada di tengah canvas meski zoom diubah.
- [ ] Overlay area cetak tidak bergeser saat zoom masuk/keluar.
- [ ] Setiap tab view menampilkan mockup yang tepat.
- [ ] Label dimensi area cetak tampil dan terbaca dengan jelas.

---

## Phase 3 — Stabilisasi Fitur Edit Objek dan Autosave

**Tujuan:** Semua fitur manipulasi objek (upload gambar, teks, crop, duplikasi, undo/redo) berjalan stabil dan data tersimpan otomatis.

### Yang Harus Dilakukan

**3.1 — Upload Gambar**
- Validasi file sebelum dimasukkan ke canvas: hanya izinkan JPG, PNG, SVG, WebP.
- Batasi ukuran file maksimal (misalnya: 10MB) dan tampilkan pesan error yang jelas jika melebihi batas.
- Setelah upload, gambar langsung muncul di tengah area cetak — bukan di pojok kiri atas canvas.
- Saat gambar diletakkan di luar area cetak, tampilkan peringatan visual (border merah atau notifikasi).

**3.2 — Fitur Teks**
- Pastikan teks bisa diedit langsung dengan double-click di canvas (inline editing).
- Font, ukuran, warna, bold, italic, dan alignment dapat diubah dari toolbar.
- Teks yang ditambahkan harus muncul di dalam area cetak secara default.
- Karakter khusus dan emoji tidak menyebabkan crash atau karakter rusak.

**3.3 — Crop Gambar**
- Fitur crop menggunakan overlay crop box yang bisa di-drag dan di-resize.
- Setelah crop dikonfirmasi, gambar asli tidak hilang dari sistem (simpan versi asli untuk un-crop).
- Tombol "Reset Crop" mengembalikan gambar ke ukuran asli.

**3.4 — Duplikasi Objek**
- Shortcut `Ctrl+D` menduplikasi objek yang dipilih.
- Objek duplikat muncul sedikit versetzt (offset +10px X, +10px Y) dari objek asli agar terlihat jelas.
- Duplikasi hanya berlaku untuk view yang sedang aktif — tidak menyebar ke view lain.

**3.5 — Undo / Redo**
- Undo (`Ctrl+Z`) dan Redo (`Ctrl+Y`) bekerja untuk semua aksi: tambah, hapus, pindah, resize, dan edit teks.
- History undo disimpan per view secara terpisah.
- Batas history: 50 langkah per view untuk menjaga performa.

**3.6 — Autosave**
- Desain disimpan otomatis ke localStorage setiap 30 detik.
- Autosave juga dipicu saat pengguna pindah tab view.
- Jika ada perubahan yang belum tersimpan, tampilkan indikator "Belum Tersimpan" di header.
- Setelah autosave berhasil, ubah indikator menjadi "Tersimpan" dengan timestamp terakhir simpan.

**Checklist Verifikasi Phase 3:**
- [ ] Upload gambar format tidak valid menampilkan pesan error, bukan crash.
- [ ] Teks bisa diedit langsung di canvas dengan double-click.
- [ ] Crop bisa dibatalkan dan gambar kembali ke ukuran asli.
- [ ] Duplikasi objek bekerja dan hasilnya berada di view yang aktif saja.
- [ ] Undo/redo bekerja untuk semua aksi tanpa error.
- [ ] Indikator save berubah antara "Belum Tersimpan" dan "Tersimpan ✓".

---

## Phase 4 — Polish UI/UX dan Shortcut Tambahan

**Tujuan:** Membuat editor terasa profesional, nyaman dipakai, dan efisien dengan shortcut keyboard yang konsisten.

### Yang Harus Dilakukan

**4.1 — Preview Multi-View yang Lebih Jelas**
- Tambahkan thumbnail preview kecil untuk setiap view di panel samping atau di bawah tab navigator.
- Thumbnail diperbarui secara real-time saat desain berubah (atau setidaknya saat pengguna pindah tab).
- Klik thumbnail langsung berpindah ke view tersebut.

**4.2 — Preset Warna Baju**
- Sediakan panel preset warna baju berisi minimal 12 warna umum (hitam, putih, abu, navy, merah, dll).
- Tampilkan warna dalam bentuk swatch bulat atau kotak dengan tooltip nama warna saat hover.
- Pengguna tetap bisa memilih warna custom via color picker.
- Warna yang sedang aktif ditandai dengan border atau checkmark.

**4.3 — Indikator Status Save yang Informatif**
- Tampilkan status di header: `Tersimpan ✓ — 14:32` atau `Menyimpan...` atau `Belum Tersimpan`.
- Tambahkan tombol "Simpan Manual" untuk pengguna yang ingin menyimpan segera.
- Saat pertama kali membuka editor dengan data tersimpan, tampilkan notifikasi singkat: "Desain terakhir berhasil dimuat."

**4.4 — Shortcut Keyboard Lengkap**
Implementasikan dan dokumentasikan shortcut berikut:

| Shortcut | Aksi |
|---|---|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+D` | Duplikasi objek |
| `Delete` / `Backspace` | Hapus objek terpilih |
| `Ctrl+S` | Simpan manual |
| `Ctrl+A` | Pilih semua objek di view aktif |
| `Escape` | Batalkan seleksi / tutup modal |
| `Arrow Keys` | Pindah objek terpilih (1px per klik) |
| `Shift+Arrow Keys` | Pindah objek terpilih (10px per klik) |
| `[` / `]` | Layer objek ke bawah / ke atas |
| `1`, `2`, `3`, `4` | Pindah ke view Depan / Belakang / Kiri / Kanan |

Tampilkan shortcut list ini di dalam panel "Bantuan" atau modal yang bisa dibuka dengan tombol `?`.

**4.5 — Feedback Visual yang Lebih Baik**
- Saat objek di-drag keluar area cetak, tampilkan border merah pada area cetak sebagai warning.
- Saat objek dipilih, tampilkan handle resize di 8 titik sudut dan sisi.
- Saat tidak ada objek yang dipilih, sembunyikan toolbar objek untuk menjaga ruang layar.
- Tambahkan tooltip pada setiap tombol toolbar yang muncul saat hover selama 500ms.

**4.6 — Panel Layers**
- Tambahkan panel layers sederhana yang menampilkan daftar objek di view aktif.
- Pengguna bisa klik nama layer untuk memilih objek tersebut di canvas.
- Pengguna bisa drag-and-drop layer untuk mengubah urutan tumpukan objek.
- Nama layer default: "Gambar 1", "Teks 1", dsb. — bisa diubah dengan double-click.

**Checklist Verifikasi Phase 4:**
- [ ] Thumbnail preview tiap view tampil dan update saat desain berubah.
- [ ] Preset warna baju bisa diklik dan langsung mengubah warna mockup.
- [ ] Status save selalu akurat dan mudah dibaca.
- [ ] Semua shortcut keyboard berjalan sesuai tabel di atas.
- [ ] Warning border muncul saat objek keluar area cetak.
- [ ] Panel layers menampilkan dan mengontrol urutan objek dengan benar.

---

## Catatan Umum untuk Semua Phase

- Jangan break fitur yang sudah berjalan. Selalu test regresi setelah setiap perubahan.
- Gunakan TypeScript atau JSDoc untuk typing yang jelas jika codebase mendukung.
- Tangani semua edge case: canvas kosong, tidak ada objek terpilih, file corrupt, localStorage penuh.
- Semua pesan error harus dalam Bahasa Indonesia yang mudah dipahami oleh pengguna non-teknis.
- Performa: canvas dengan 20+ objek harus tetap smooth (target: 60fps saat drag).
- Aksesibilitas dasar: semua tombol punya label yang terbaca oleh screen reader.