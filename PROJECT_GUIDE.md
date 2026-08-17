# Ramanujan Public School – Teacher Duty Portal
### Full project guide

The working demo (`TeacherDutyPortal.jsx`) is already interactive — log in as Admin or Teacher with the demo buttons and try the "create substitution → switch to teacher → see it appear" flow, that's exactly what the presentation script below walks through.

This guide covers everything needed to turn it into the real deployed app: folder structure, the Supabase backend, PWA setup, deployment, and your exhibition script.

---

## 1. Folder structure

```
teacher-duty-portal/
├── public/
│   ├── manifest.json
│   ├── service-worker.js
│   └── icons/
│       ├── icon-192.png
│       ├── icon-512.png
│       ├── icon-maskable-192.png
│       └── icon-maskable-512.png
├── src/
│   ├── main.jsx                  # entry point, registers service worker
│   ├── App.jsx                   # router + role-based shell
│   ├── supabaseClient.js         # Supabase init
│   ├── lib/
│   │   └── auth.js               # Teacher ID + password → Supabase Auth
│   ├── context/
│   │   └── SessionContext.jsx    # current user, role
│   ├── components/
│   │   ├── Shell.jsx             # sidebar + bottom nav
│   │   ├── Avatar.jsx
│   │   ├── Badge.jsx
│   │   ├── Card.jsx
│   │   └── Toast.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── teacher/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Timetable.jsx
│   │   │   ├── Substitutions.jsx
│   │   │   ├── ExamDuties.jsx
│   │   │   ├── Notices.jsx
│   │   │   ├── Queries.jsx
│   │   │   └── Profile.jsx
│   │   └── admin/
│   │       ├── Dashboard.jsx
│   │       ├── Teachers.jsx
│   │       ├── Substitutions.jsx
│   │       ├── ExamDuties.jsx
│   │       ├── Notices.jsx
│   │       └── Queries.jsx
│   └── utils/
│       └── pdf.js                 # jsPDF export helpers
├── index.html
├── tailwind.config.js
├── vite.config.js
├── package.json
└── supabase_schema.sql
```

The `TeacherDutyPortal.jsx` demo you already have maps directly onto this structure — each function block in it (e.g. `TeacherDashboard`, `AdminSubstitutions`) is one of the files above; splitting it up is mechanical once you're ready.

---

## 2. Color palette (as implemented)

| Token | Hex | Use |
|---|---|---|
| Deep Royal Blue | `#1E4E8C` | Header gradient, primary buttons, active nav |
| Amber | `#F59E0B` | Header gradient midpoint |
| Soft Orange | `#F97316` | Header gradient end, accents, "NEW" badges |
| White | `#FFFFFF` | Cards, backgrounds |
| Charcoal Text | `#111827` | Primary text |
| Powder Blue / Mint / Butter / Peach / Lavender / Sky / Apricot / Aqua | `#E8F1FF #EAFBF1 #FFF6DD #FFEDE5 #F3E9FF #EAF7FF #FFF1E6 #E9FAF8` | Timetable class-block backgrounds, hashed per class so each section is visually consistent across the week |
| Free-period gray | `#F3F4F6` bg / `#6B7280` text, dashed border | Empty timetable slots |

Font: **Inter** (via Google Fonts / cdnjs) for the whole app — clean, highly legible at small sizes, good for a data-dense timetable.

---

## 3. Supabase setup instructions

1. Create a project at [supabase.com](https://supabase.com) (free tier is enough for ~80 teachers).
2. Go to **SQL Editor** → paste the contents of `supabase_schema.sql` → Run. This creates all 8 tables, row-level-security policies, realtime publications, and seeds the 10 demo teachers, notices, and exam duties.
3. Go to **Project Settings → API** → copy your `Project URL` and `anon public` key.
4. In your Vite project, create `.env`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=xxxxx
   ```
5. `src/supabaseClient.js`:
   ```js
   import { createClient } from '@supabase/supabase-js'
   export const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY
   )
   ```

### Auth setup (Teacher ID + password login)

Supabase Auth is email-based, so map each Teacher ID to a synthetic email:

```js
// src/lib/auth.js
export async function loginWithId(teacherId, password) {
  const email = `${teacherId.toLowerCase()}@ramanujan-portal.local`
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}
```

When creating each teacher/admin account (one-time, via Supabase Dashboard → Authentication → Add User, or a small admin script), use that same synthetic email pattern, then update `teachers.auth_user_id` / `admins.auth_user_id` to match so the RLS policies in the schema resolve correctly.

### Admin "Add Teacher" flow (in production)

The demo's Add Teacher form generates an ID and password client-side for instant testing. In the real app, creating a login has to happen server-side, because it needs the Supabase **service role key** — which must never be shipped to the browser. Use a Supabase Edge Function:

```js
// supabase/functions/create-teacher/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const { name, subject, department } = await req.json()
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // 1. generate ID + password (same logic as the demo's nextTeacherId/generatePassword)
  const { data: existing } = await admin.from('teachers').select('id')
  const nextNum = Math.max(100, ...existing.map(t => parseInt(t.id.replace(/\D/g, '')))) + 1
  const id = `TCH${nextNum}`
  const password = crypto.randomUUID().slice(0, 8)

  // 2. create the Auth user
  const { data: user, error } = await admin.auth.admin.createUser({
    email: `${id.toLowerCase()}@ramanujan-portal.local`,
    password,
    email_confirm: true,
  })
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })

  // 3. insert the teacher row, linked to the new auth user
  await admin.from('teachers').insert({ id, name, subject, department, auth_user_id: user.user.id })

  return new Response(JSON.stringify({ id, password, name }))
})
```

Call this from the Admin → Teachers "Add Teacher" form using the *anon* client (`supabase.functions.invoke('create-teacher', { body: {...} })`) — the service role key stays server-side inside the function. Show the returned `{ id, password }` to the admin once, exactly like the demo does, so they can hand it to the new teacher.

### Live-update behavior

Subscribe to realtime changes so a teacher's dashboard updates without a manual refresh:

```js
useEffect(() => {
  const channel = supabase
    .channel('substitutions-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'substitutions' },
      (payload) => { /* prepend to state, flag isNew */ })
    .subscribe()
  return () => supabase.removeChannel(channel)
}, [])
```

---

## 4. PWA setup

`manifest.json` and `service-worker.js` are provided as separate files — drop them into `public/`. Register the worker in `src/main.jsx`:

```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
  })
}
```

Link the manifest in `index.html`:
```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#1E4E8C" />
```

You'll need actual PNG icons at `/public/icons/` (192×192, 512×512, plus maskable versions) — export them from your school logo or the "RPS" monogram used in the login screen. Any icon generator (e.g. realfavicongenerator.net) will produce the maskable variants from one source image.

Once deployed over HTTPS (Vercel/Netlify do this automatically), Chrome/Edge on Android will show an automatic "Install app" prompt; on iPhone, users install via Safari's Share → "Add to Home Screen".

---

## 5. Navigation flow

```
Login
 ├─ Teacher ID + password
 │
 ├── Teacher session ──────────────────────────
 │   Dashboard → Timetable → Substitutions →
 │   Exam Duties → Notices → Queries → Profile
 │   (bottom nav on mobile, sidebar on desktop)
 │
 └── Admin session ────────────────────────────
     Dashboard → Teachers → Substitutions →
     Exam Duties → Notices → Queries
     (each with a create/manage form + list)
```

## 6. Admin workflow (substitution example)

1. Admin → Substitutions → fills Absent Teacher, Replacement Teacher, Class, Period, Day.
2. Save → row inserted into `substitutions` table.
3. Realtime pushes the insert to any subscribed teacher client.
4. Replacement teacher's Dashboard/Substitutions page shows a pale-orange card with a **NEW** badge until they view it.

## 7. Teacher workflow (query example)

1. Teacher → Queries → "New Query" → Subject + Message → Send.
2. Row inserted into `queries` (RLS restricts them to their own).
3. Admin sees it under Admin → Queries, replies inline (writes to `query_replies`), can mark Resolved.
4. Teacher sees the reply threaded under their original query.

---

## 8. PDF export templates

Use `jspdf` + `jspdf-autotable` client-side (no server needed):

```js
// src/utils/pdf.js
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportTimetablePDF(teacher, timetable) {
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' })
  doc.setFontSize(14)
  doc.text(`${teacher.name} — Weekly Timetable`, 14, 15)
  autoTable(doc, {
    startY: 20,
    head: [['Day', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8']],
    body: Object.entries(timetable).map(([day, slots]) => [
      day, ...slots.map(s => s ? `${s.class}\n${s.subject}` : 'Free')
    ]),
  })
  doc.save(`${teacher.id}_timetable.pdf`)
}
```

Use the same pattern for exam duty slips (single-record layout) and the substitution list (table layout) — both are A4 portrait, header with school name + gradient bar, table body, generated on the client so it works even before you wire up a server.

---

## 9. Deployment steps

**Supabase** — already live once you run the schema (step 3 above); no separate deploy step.

**Vercel (recommended):**
1. Push the project to a GitHub repo.
2. [vercel.com](https://vercel.com) → New Project → import the repo.
3. Framework preset: **Vite**. Build command `npm run build`, output dir `dist`.
4. Add environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel → Settings → Environment Variables.
5. Deploy → you get a public `https://your-app.vercel.app` URL, served over HTTPS (required for PWA install).

**Netlify (alternative):**
1. `netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   ```
2. Same environment variables in Netlify → Site settings → Environment variables.
3. Drag-and-drop `dist/` or connect the GitHub repo for auto-deploys.

---

## 10. Presentation script (5 minutes, two students)

**Setup:** Two phones/laptops, both on the deployed URL, both with the app installed to the home screen.

| Time | Student 1 (Admin) | Student 2 (Teacher) |
|---|---|---|
| 0:00–0:30 | *"Good [morning/afternoon] everyone. This is the Ramanujan Public School Teacher Duty Portal — a live system for managing substitutions, exam duties and notices for our 80 teachers."* Opens the installed app. | Stands by, phone ready. |
| 0:30–1:15 | *"I'll log in as admin."* Logs in with `ADMIN01`. Shows the dashboard stats. *"Here I can see today's substitutions, open queries, and manage everything from one place."* | *"While they do that, I'll log in as a teacher — Mrs. Sharma, Physics."* Logs in with `TCH101` on their own device. |
| 1:15–2:15 | *"Right now, Mr. Gupta — our Chemistry teacher — is absent. I'll create a substitution for his 9B Chemistry period."* Goes to Substitutions → fills the form (absent teacher, Mrs. Sharma as replacement, class, period) → Saves. *"That substitution is now saved to our live database."* | *"On my end, I haven't refreshed yet — my dashboard still shows my normal timetable."* Holds up phone showing the unchanged dashboard. |
| 2:15–3:00 | *"Let's see it reach her device."* | Taps **Refresh** on the dashboard. *"And there it is — a new substitution card, with a NEW badge, showing I'm covering 9B for Chemistry."* Shows the phone to the audience. |
| 3:00–3:45 | *"The same live-update pattern powers exam duty assignments and school notices — an admin publishes once, and it's instantly available to every teacher's device."* Switches to Notices, publishes a sample notice. | *"And on the teacher side, I can also send queries straight to the admin — say, a request for lab equipment — without needing to track someone down in the staff room."* Demonstrates a query. |
| 3:45–4:30 | *"It's built as an installable app — works offline for viewing your timetable, and updates live over the internet using Supabase as the backend."* | *"It's fully responsive too — swipeable day-by-day timetable on mobile, full weekly grid on a desktop or the office computer."* Shows mobile vs desktop view. |
| 4:30–5:00 | **Both:** *"That's the Ramanujan Public School Teacher Duty Portal — thank you!"* | |

---

## 11. Project summary (for the exhibition writeup)

**Problem solved:** School staff coordination — substitutions, exam duty rosters, and notices — is normally handled through scattered paper notices, phone calls, and staff-room noticeboards, which are slow, easy to miss, and hard to track. This portal centralizes it into one live, mobile-friendly system.

**Features:** Role-based login for admin and teachers; personal weekly timetables; live substitution creation and delivery; exam duty assignment with room/time details; a school notice board with priority levels; a direct teacher-to-admin query channel with threaded replies; PDF export for timetables and duty slips; installable as a home-screen app on Android and iPhone.

**Benefits for teachers:** One place to check their schedule, substitutions, and duties instead of checking multiple noticeboards; instant notification when a substitution affects them; a direct, trackable channel to raise issues with administration.

**Benefits for administration:** A single dashboard to manage all 80 teachers' schedules and duties; substitutions and notices reach every teacher device at once instead of relying on staff-room announcements; a searchable history of substitutions and resolved queries.

**Future scope:** WhatsApp notifications for urgent substitutions; a leave application and approval workflow; biometric attendance integration; AI-assisted substitution suggestions that account for teacher load and recent substitution history to keep coverage fair.
