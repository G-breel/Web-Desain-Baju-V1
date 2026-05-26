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
  types/
supabase/migrations/
```

## Progress

Lihat [PROJECT_TODO.md](./PROJECT_TODO.md) untuk checklist lengkap.
