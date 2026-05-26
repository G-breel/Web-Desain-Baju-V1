# Desain Baju

Editor desain kaos 2D multi-view — Next.js, Tailwind, Supabase, Fabric.js.

## Setup

```bash
npm install
cp .env.local.example .env.local
# Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Supabase Auth

Di **Authentication → URL Configuration**, tambahkan redirect URL:

- `http://localhost:3000/auth/callback`
- URL production Vercel (nanti)

Untuk Google OAuth: aktifkan provider di **Authentication → Providers → Google**.

Jalankan migration profil otomatis: `supabase/migrations/002_profile_trigger.sql`

## Supabase Database & Storage

Jalankan migrasi SQL (di Supabase SQL Editor):

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_profile_trigger.sql`
- `supabase/migrations/003_updated_at_triggers.sql`

Storage (untuk upload asset & thumbnail):

- Buat bucket: `assets`, `thumbnails`
- Jalankan policy: `supabase/migrations/004_storage_policies.sql`

## Struktur folder

```
src/
  app/              # App Router pages
  components/
    layout/         # Navbar, footer, theme
    providers/      # Theme + toast
    ui/             # Button, card, loading
  lib/
    supabase/       # Client, server, middleware
    auth/           # Session & profile helpers
  types/
supabase/migrations/
```

## Progress

Lihat [PROJECT_TODO.md](./PROJECT_TODO.md) untuk checklist lengkap.
