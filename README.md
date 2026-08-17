# Ramanujan Public School – Teacher Duty Portal

A mobile-responsive PWA for school teachers and admin: timetables, substitutions, exam duties, notices, and queries.

Full design spec, Supabase auth flow, PDF export code, and the exhibition presentation script are in **[`PROJECT_GUIDE.md`](./PROJECT_GUIDE.md)**. This README just covers getting the project running.

## Quickstart (local)

```bash
npm install
npm run dev
```

Open the printed `http://localhost:5173` URL. Log in with:
- **Admin:** `ADMIN01` / `admin123`
- **Teacher:** `TCH101` / `teacher123`

The app currently runs on local mock data (persisted to your browser's `localStorage`, so it survives a page reload). See "Connecting Supabase" below for wiring up the real shared backend.

## Project status

- ✅ All screens (login, teacher dashboard/timetable/substitutions/exam duties/notices/queries/profile, admin dashboard/teachers/substitutions/exam duties/notices/queries)
- ✅ Admin can add teachers (auto-generates Teacher ID + password), edit their details, edit their timetable, reset their password, remove them
- ✅ PWA manifest + service worker (installable, offline app-shell caching)
- ⏳ Not yet connected: Supabase (currently mock data in `localStorage`) — schema and setup steps are ready in `supabase/schema.sql` and `PROJECT_GUIDE.md`
- ⏳ Not yet generated: real app icons — `public/icons/*.png` are solid-color placeholders; swap them for your school logo before shipping

## Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. SQL Editor → paste `supabase/schema.sql` → Run.
3. `cp .env.example .env` and fill in your Project URL + anon key from Project Settings → API.
4. `src/supabaseClient.js` is already set up to read those env vars — import `supabase` from it wherever `App.jsx` currently manages `db` state, and replace the `localStorage` load/save effects with real queries + a realtime subscription.

Full code samples (including the Teacher-ID-to-Supabase-Auth mapping and the Edge Function for admin-created teacher accounts) are in `PROJECT_GUIDE.md`.

## Deploying to Render (via GitHub)

```bash
npm run build   # sanity-check the build locally first
```

1. Push this project to a GitHub repo.
2. [render.com](https://render.com) → **New** → **Static Site** → connect your GitHub repo.
3. Render reads the included `render.yaml`, which sets:
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
   - A rewrite rule (`/*` → `/index.html`) so client-side routing/refreshes work correctly
4. If you've connected Supabase, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under the site's **Environment** tab (the `render.yaml` declares them as required but unset, so Render will prompt you for values).
5. Deploy — Render gives you a public `https://your-app.onrender.com` URL over HTTPS, which is required for the PWA install prompt to appear. Every push to your connected branch auto-redeploys.

(A `vercel.json` is also included if you ever want to deploy there instead — same build, either platform works.)

## Project structure

```
teacher-duty-portal/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── service-worker.js      # offline app-shell caching
│   └── icons/                 # placeholder icons — replace with your school logo
├── src/
│   ├── main.jsx                # entry point, registers the service worker
│   ├── App.jsx                 # the whole app (all roles/screens) — see note below
│   ├── supabaseClient.js       # Supabase client scaffold, wired to .env
│   └── index.css               # Tailwind entry point
├── supabase/
│   └── schema.sql              # tables, RLS policies, realtime config, demo seed data
├── index.html
├── tailwind.config.js
├── vite.config.js
├── vercel.json
├── render.yaml
├── .env.example
└── PROJECT_GUIDE.md            # full design spec, workflows, deployment, presentation script
```

**Why is everything in one `App.jsx`?** It kept the interactive preview buildable and testable turn-by-turn while we iterated on it in chat. `PROJECT_GUIDE.md` includes the intended split into `src/pages/teacher/*.jsx` and `src/pages/admin/*.jsx` if you'd like to break it up — it's a mechanical refactor (each named function block in `App.jsx`, e.g. `TeacherDashboard`, `AdminSubstitutions`, becomes its own file with a couple of imports) once you're ready to run and test each piece.
