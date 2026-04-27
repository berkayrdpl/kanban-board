# Kanban Board

**Live demo:** https://kanban-board-yjx2.vercel.app
**Demo hesap:** kayıt sayfasından kendiniz açabilirsiniz, e-posta doğrulaması kapalı.

Trello tarzı, basit ve hızlı görev yönetim aracı. Next.js 15 (App Router) + Supabase (Postgres + Auth) + dnd-kit + shadcn/ui ile yazıldı.

## Mimari Kararlar

| Konu | Karar | Neden |
|---|---|---|
| Stack | Next.js 15 + Supabase | Vercel'de tek tıkla deploy, auth + DB tek serviste |
| DnD | `@dnd-kit/core` + `@dnd-kit/sortable` | Aktif geliştirilen, mobil dokunmatik desteği güçlü, küçük bundle, accessibility (ARIA) hazır |
| Sıralama | `position` (DOUBLE PRECISION) + midpoint insert | Her hareket sadece **bir UPDATE** ile çözülür; tüm sütunu yeniden numaralamayız |
| Auth | Supabase email + şifre | Hızlı kurulum, değerlendirme için friction yok |
| UI | shadcn/ui + Tailwind | Kontrol bizde (copy-paste komponent), hızlı ve modern görünüm |
| Persistence | Server Components + RLS | Kanonik veri DB'de, RLS ile her kullanıcı sadece kendi board'larını görür |

### Sıralama mantığı (en kritik kısım)

`columns` ve `cards` tablolarında `position` alanı `double precision`. İki kart arasına bırakırken yeni position iki komşunun ortalamasıdır. Başa bırakınca `first - 1024`, sona bırakınca `last + 1024`. Bu sayede sürükle-bırak yalnızca **taşınan kartın satırını** UPDATE eder, kardeşlerin pozisyonu sabit kalır. Float precision drift'i için `supabase/migrations/0001_init.sql` içinde `rebalance_cards()` ve `rebalance_columns()` helper fonksiyonları var.

## Kurulum

### 1. Bağımlılıkları yükle

```bash
npm install
```

### 2. Supabase projesi oluştur

1. https://supabase.com/dashboard → **New Project**
2. Proje hazır olunca **Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Authentication → Providers → Email** → "Confirm email" istersen kapat (development için hız)
4. **Authentication → URL Configuration**:
   - `Site URL`: `http://localhost:3000` (dev), production'da Vercel URL'i
   - `Redirect URLs`: `http://localhost:3000/auth/callback`, `https://YOUR-VERCEL-URL/auth/callback`

### 3. Schema'yı çalıştır

`supabase/migrations/0001_init.sql` dosyasının içeriğini kopyala, Supabase **SQL Editor**'a yapıştır, **Run**. Tablolar + RLS politikaları + auto-create profile trigger kurulur.

### 4. Env vars

`.env.local.example`'ı kopyala:

```bash
cp .env.local.example .env.local
```

`.env.local`'i düzenleyip değerleri gir:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Dev sunucusunu başlat

```bash
npm run dev
```

http://localhost:3000 → otomatik `/login`'e yönlenir. `/signup`'tan kayıt ol, giriş yaptıktan sonra `/boards`'da kullanıcı bilgilerini görmen lazım.

## Vercel Deploy

```bash
# 1. Repo'yu GitHub'a push et
git init && git add . && git commit -m "init"
gh repo create kanban-board --public --source=. --push   # gh CLI varsa
# veya GitHub'a manuel ekle

# 2. https://vercel.com → Import Project → seç
# 3. Environment variables ekle (Vercel UI'da):
#    NEXT_PUBLIC_SUPABASE_URL
#    NEXT_PUBLIC_SUPABASE_ANON_KEY
#    NEXT_PUBLIC_SITE_URL = https://your-project.vercel.app
# 4. Deploy
# 5. Supabase → Authentication → URL Configuration'a Vercel URL'ini de ekle
```

## Klasör Yapısı

```
kanban-board/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  # /login'e redirect
│   ├── globals.css
│   ├── login/
│   │   ├── page.tsx              # email + şifre form
│   │   └── actions.ts            # server action
│   ├── signup/
│   │   ├── page.tsx
│   │   └── actions.ts
│   ├── auth/
│   │   ├── callback/route.ts     # email confirm + OAuth callback
│   │   └── signout/route.ts
│   └── boards/
│       └── page.tsx              # protected liste (Faz 2'de büyüyecek)
├── components/
│   └── ui/                       # shadcn primitives
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # browser client
│   │   ├── server.ts             # server/RSC/action client
│   │   └── middleware.ts         # session refresh + protected routes
│   └── utils.ts                  # cn() helper
├── middleware.ts                 # Next.js middleware
├── supabase/
│   └── migrations/0001_init.sql  # schema + RLS + triggers
├── types/
│   └── database.ts
└── ...config dosyaları
```

## Yol Haritası (geriye kalan fazlar)

- [x] **Faz 0** — Scaffold + ilk Vercel deploy
- [x] **Faz 1** — Supabase schema, RLS, email/şifre auth, korumalı `/boards`
- [ ] **Faz 2** — Board & Column CRUD (liste, detay, oluştur, yeniden adlandır, sil)
- [ ] **Faz 3** — Card CRUD (modal ile başlık + açıklama düzenleme)
- [ ] **Faz 4** — dnd-kit ile drag-and-drop (kalbi: aynı sütun reorder + sütunlar arası taşıma + position update + optimistic UI)
- [ ] **Faz 5** — Mobil (TouchSensor + long-press), responsive, loading/empty/error states
- [ ] **Faz 6** — Final test + Vercel'e prod deploy

## Lisans

MIT
