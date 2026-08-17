import React, { useState, useEffect, useMemo } from "react";
import {
  Home, Calendar, RefreshCw, ClipboardList, Megaphone, MessageSquare, User,
  LogOut, Users, Bell, Plus, Check, X, ChevronLeft, ChevronRight, Download,
  Sun, Sunset, Moon, AlertCircle, Send, Menu, MoreVertical, Edit3, KeyRound, Trash2
} from "lucide-react";

/* ============================= DEMO DATA ============================= */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday" };
const PERIOD_TIMES = [
  "08:00 – 08:40", "08:40 – 09:20", "09:20 – 10:00", "10:00 – 10:40",
  "10:40 – 11:00", // recess
  "11:00 – 11:40", "11:40 – 12:20", "12:20 – 13:00", "13:00 – 13:40",
];
// periods 1-4, recess, periods 5-8 (index 4 = recess)

const INITIAL_TEACHERS = [
  { id: "TCH101", password: "teacher123", name: "Ms. Manisha Gupta", subject: "Mathematics", department: "Mathematics" },
  { id: "TCH102", password: "teacher123", name: "Ms. Shadma Zulfekar", subject: "English", department: "Languages" },
  { id: "TCH103", password: "teacher123", name: "Ms. Tanushree Banarjee", subject: "Biology", department: "Science" },
  { id: "TCH104", password: "teacher123", name: "Ms. Shivanki Srivastava", subject: "Chemistry", department: "Science" },
  { id: "TCH105", password: "teacher123", name: "Ms. Manju Mishra", subject: "Hindi", department: "Languages" },
  { id: "TCH106", password: "teacher123", name: "Ms. Ritu", subject: "Physics", department: "Science" },
  { id: "TCH107", password: "teacher123", name: "Ms. Innama", subject: "Social Science", department: "Social Science" },
  { id: "TCH108", password: "teacher123", name: "Ms. Afreen", subject: "Geography", department: "Social Science" },
  { id: "TCH109", password: "teacher123", name: "Ms. Arfeen", subject: "History", department: "Social Science" },
  { id: "TCH110", password: "teacher123", name: "Ms. Ayushi", subject: "Computer Science", department: "Computer Science" },
  { id: "TCH111", password: "teacher123", name: "Ms. Kirti Singh", subject: "Economics", department: "Commerce" },
  { id: "TCH112", password: "teacher123", name: "Mr. Shivm Srivastava", subject: "Mathematics", department: "Mathematics" },
  { id: "TCH113", password: "teacher123", name: "Mr. Om Tiwari", subject: "Sanskrit", department: "Languages" },
  { id: "TCH115", password: "teacher123", name: "Mr. Aman", subject: "Physics", department: "Science" },
  { id: "TCH116", password: "teacher123", name: "Mr. Amulya Malviya", subject: "Chemistry", department: "Science" },
  { id: "TCH117", password: "teacher123", name: "Mr. Anmol", subject: "Computer Science", department: "Computer Science" },
  { id: "TCH118", password: "teacher123", name: "Mr. Pankaj Saran", subject: "Accountancy", department: "Commerce" },
  { id: "TCH119", password: "teacher123", name: "Mr. Akash Srivastava", subject: "Biology", department: "Science" },
  { id: "TCH120", password: "teacher123", name: "Mr. Omsi", subject: "English", department: "Languages" },
  { id: "TCH121", password: "teacher123", name: "Mr. Sanjay", subject: "Political Science", department: "Social Science" },
  { id: "TCH122", password: "teacher123", name: "Mr. Mayank", subject: "Hindi", department: "Languages" },
  { id: "TCH123", password: "teacher123", name: "Mr. Kartikey", subject: "Mathematics", department: "Mathematics" },
  { id: "TCH124", password: "teacher123", name: "Mr. Ankit Paul", subject: "Physical Education", department: "Sports" },
];

// Generates the next sequential Teacher ID, e.g. TCH111, based on existing teachers
function nextTeacherId(teachers) {
  const nums = teachers.map(t => parseInt(t.id.replace(/\D/g, ""), 10)).filter(n => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 100) + 1;
  return "TCH" + next;
}

// Generates a simple random starting password, e.g. Rps482x
function generatePassword() {
  const digits = Math.floor(100 + Math.random() * 900);
  const letter = "abcdefghjkmnpqrstuvwxyz"[Math.floor(Math.random() * 23)];
  return "Rps" + digits + letter;
}
const INITIAL_ADMINS = [
  { id: "ADMIN01", password: "admin123", name: "Ms. Ipsita Chaudhary", role: "Principal" },
  { id: "ADMIN02", password: "admin123", name: "Mr. Umang Mehrotra", role: "Headmaster" },
  { id: "ADMIN03", password: "admin123", name: "Mr. Ankit Paul", role: "Coordinator", teacherId: "TCH124" },
];

const PASTELS = [
  { bg: "#E8F1FF" }, { bg: "#EAFBF1" }, { bg: "#FFF6DD" }, { bg: "#FFEDE5" },
  { bg: "#F3E9FF" }, { bg: "#EAF7FF" }, { bg: "#FFF1E6" }, { bg: "#E9FAF8" },
];
const colorForClass = (cls) => {
  let hash = 0;
  for (let i = 0; i < cls.length; i++) hash = cls.charCodeAt(i) + ((hash << 5) - hash);
  return PASTELS[Math.abs(hash) % PASTELS.length].bg;
};

// Build a weekly timetable for a teacher, varied by subject + a seed so each teacher differs
function buildTimetable(subject, seed = 0) {
  const classes = ["10 A", "10 B", "9 B", "11 Science", "12 Science", "8 A", "7 B", "6 A"];
  const tt = {};
  DAYS.forEach((day, di) => {
    tt[day] = Array.from({ length: 8 }, (_, pi) => {
      // sprinkle in a couple of free periods
      if ((di + pi + seed) % 7 === 0) return null;
      const cls = classes[(di + pi + seed) % classes.length];
      return { class: cls, subject, time: pi < 4 ? PERIOD_TIMES[pi] : PERIOD_TIMES[pi + 1] };
    });
  });
  return tt;
}

function buildInitialTimetables(teachers) {
  const map = {};
  teachers.forEach((t, i) => { map[t.id] = buildTimetable(t.subject, i); });
  return map;
}

const INITIAL_TIMETABLES = buildInitialTimetables(INITIAL_TEACHERS);

// A blank week (all free periods) used for a newly added teacher
function blankTimetable() {
  const tt = {};
  DAYS.forEach(day => { tt[day] = Array.from({ length: 8 }, () => null); });
  return tt;
}

const TODAY_DAY = DAYS[new Date().getDay() === 0 ? 5 : new Date().getDay() - 1];

const INITIAL_SUBSTITUTIONS = [
  { id: "S1", date: "Today", day: TODAY_DAY, period: 3, class: "9 B", absentTeacherId: "TCH104", replacementTeacherId: "TCH101", isNew: false },
  { id: "S2", date: "Today", day: TODAY_DAY, period: 6, class: "8 A", absentTeacherId: "TCH109", replacementTeacherId: "TCH102", isNew: false },
  { id: "S3", date: "Yesterday", day: DAYS[(DAYS.indexOf(TODAY_DAY) + 5) % 6], period: 2, class: "7 B", absentTeacherId: "TCH103", replacementTeacherId: "TCH101", isNew: false },
];

const INITIAL_EXAM_DUTIES = [
  { id: "E1", teacherId: "TCH101", examName: "PA 2", date: "Tomorrow", time: "09:00 – 12:00", room: "Room 204", class: "10 A", subject: "Mathematics", dutyType: "Invigilation" },
  { id: "E2", teacherId: "TCH102", examName: "PA 2", date: "Tomorrow", time: "09:00 – 12:00", room: "Room 105", class: "9 B", subject: "Science", dutyType: "Invigilation" },
  { id: "E3", teacherId: "TCH104", examName: "Pre-Board", date: "18 Aug", time: "09:00 – 12:00", room: "Room 301", class: "12 Science", subject: "Chemistry", dutyType: "Subject Expert" },
  { id: "E4", teacherId: "TCH107", examName: "Half Yearly", date: "18 Aug", time: "13:00 – 16:00", room: "Room 108", class: "11 Science", subject: "Biology", dutyType: "Invigilation" },
];

const INITIAL_NOTICES = [
  { id: "N1", title: "Independence Day flag hoisting at 8:00 AM sharp", date: "11 Aug", priority: "Important" },
  { id: "N2", title: "Staff meeting in the conference room after last period", date: "10 Aug", priority: "Normal" },
  { id: "N3", title: "Mid-term exam datesheet released — check the noticeboard", date: "09 Aug", priority: "Urgent" },
  { id: "N4", title: "Submit unit-test marks on the portal by Friday", date: "08 Aug", priority: "Important" },
  { id: "N5", title: "Annual sports day practice begins next Monday", date: "07 Aug", priority: "Normal" },
];

const INITIAL_QUERIES = [
  { id: "Q1", teacherId: "TCH101", message: "Requesting 5 new voltmeters for the Class 12 Physics lab before the practical exams.", replies: [], resolved: false },
  { id: "Q2", teacherId: "TCH102", message: "My periods 3 and 4 on Wednesday both show Class 10A — could you check this?", replies: [{ from: "Admin", text: "Checked, fixing it in this week's timetable update." }], resolved: false },
  { id: "Q3", teacherId: "TCH105", message: "I'll be on leave for a family function on the 20th. Please arrange a substitute.", replies: [{ from: "Admin", text: "Noted, substitution has been arranged." }], resolved: true },
];

/* ============================= HELPERS ============================= */

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good Morning", Icon: Sun };
  if (h < 17) return { text: "Good Afternoon", Icon: Sunset };
  return { text: "Good Evening", Icon: Moon };
}

function initials(name) {
  return name.split(" ").filter(w => w[0] === w[0].toUpperCase() && /[A-Za-z]/.test(w[0])).slice(-2).map(w => w[0]).join("");
}

const priorityStyle = {
  Normal: { bg: "#EAF7FF", text: "#1E4E8C", label: "Normal" },
  Important: { bg: "#FFF6DD", text: "#92600A", label: "Important" },
  Urgent: { bg: "#FFEDE5", text: "#C2410C", label: "Urgent" },
};

function Avatar({ name, size = 44 }) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-white shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36, background: "linear-gradient(135deg, #1E4E8C, #F97316)" }}
    >
      {initials(name)}
    </div>
  );
}

function Badge({ children, bg, text }) {
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: bg, color: text }}>
      {children}
    </span>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`} style={{ boxShadow: "0 1px 3px rgba(17,24,39,0.06), 0 1px 2px rgba(17,24,39,0.04)" }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[15px] font-semibold text-[#111827]">{children}</h2>
      {action}
    </div>
  );
}

// Bump this whenever the demo's seed data (teacher/admin lists, subjects, etc.) changes in
// code — any locally-saved data from an older version is then discarded instead of silently
// shadowing the new defaults, so updates like a renamed teacher list actually show up.
const SEED_VERSION = 3;

// Reconciles any previously-saved data (which may be in an older shape) with the
// current schema, so the app never crashes on stale data from an earlier version.
function normalizeDb(raw) {
  const teachers = Array.isArray(raw?.teachers) && raw.teachers.length ? raw.teachers : INITIAL_TEACHERS;
  const savedTimetables = raw?.timetables && typeof raw.timetables === "object" ? raw.timetables : {};
  const timetables = {};
  teachers.forEach((t, i) => {
    timetables[t.id] = savedTimetables[t.id] || INITIAL_TIMETABLES[t.id] || buildTimetable(t.subject, i);
  });
  return {
    teachers,
    admins: Array.isArray(raw?.admins) && raw.admins.length ? raw.admins : INITIAL_ADMINS,
    substitutions: Array.isArray(raw?.substitutions) ? raw.substitutions : INITIAL_SUBSTITUTIONS,
    examDuties: Array.isArray(raw?.examDuties) ? raw.examDuties : INITIAL_EXAM_DUTIES,
    notices: Array.isArray(raw?.notices) ? raw.notices : INITIAL_NOTICES,
    queries: Array.isArray(raw?.queries) ? raw.queries : INITIAL_QUERIES,
    timetables,
  };
}

/* ============================= APP ============================= */

export default function App() {
  const [db, setDb] = useState({
    teachers: INITIAL_TEACHERS,
    admins: INITIAL_ADMINS,
    substitutions: INITIAL_SUBSTITUTIONS,
    examDuties: INITIAL_EXAM_DUTIES,
    notices: INITIAL_NOTICES,
    queries: INITIAL_QUERIES,
    timetables: INITIAL_TIMETABLES,
  });
  const [dbLoaded, setDbLoaded] = useState(false);

  // Load any previously saved portal data (e.g. teachers an admin added) when the app opens.
  // NOTE: this is a placeholder using localStorage for the "mock data" phase of the project —
  // swap this block for real Supabase reads once you connect the backend (see PROJECT_GUIDE.md).
  // Data saved under an older SEED_VERSION is discarded rather than merged, so code updates
  // to the demo data (like a renamed teacher list) always take effect.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("portal-db");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.seedVersion === SEED_VERSION) {
          setDb(normalizeDb(parsed.data));
        }
      }
    } catch (e) {
      // nothing saved yet, or storage unavailable — start with the demo defaults
    } finally {
      setDbLoaded(true);
    }
  }, []);

  // Save whenever the data changes, so new teachers/substitutions/etc. survive a reload
  useEffect(() => {
    if (!dbLoaded) return;
    try {
      window.localStorage.setItem("portal-db", JSON.stringify({ seedVersion: SEED_VERSION, data: db }));
    } catch (e) {
      // storage unavailable (e.g. private browsing) — data just won't persist
    }
  }, [db, dbLoaded]);

  const [session, setSession] = useState(null); // { role: 'admin'|'teacher', id }
  const [tab, setTab] = useState("dashboard");
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const login = (id, password) => {
    const admin = db.admins.find(a => a.id === id && a.password === password);
    if (admin) {
      setSession({ role: "admin", id });
      setTab("dashboard");
      return true;
    }
    const t = db.teachers.find(t => t.id === id && t.password === password);
    if (t) {
      setSession({ role: "teacher", id });
      setTab("dashboard");
      return true;
    }
    return false;
  };

  const logout = () => { setSession(null); setTab("dashboard"); };

  if (!session) return <LoginScreen onLogin={login} />;

  if (session.role === "admin") {
    const admin = db.admins.find(a => a.id === session.id);
    return (
      <Shell role="admin" tab={tab} setTab={setTab} onLogout={logout} title={admin?.name}>
        {tab === "dashboard" && <AdminDashboard db={db} admin={admin} />}
        {tab === "teachers" && <AdminTeachers db={db} setDb={setDb} showToast={showToast} />}
        {tab === "substitutions" && <AdminSubstitutions db={db} setDb={setDb} showToast={showToast} />}
        {tab === "examduties" && <AdminExamDuties db={db} setDb={setDb} showToast={showToast} />}
        {tab === "notices" && <AdminNotices db={db} setDb={setDb} showToast={showToast} />}
        {tab === "queries" && <AdminQueries db={db} setDb={setDb} showToast={showToast} />}
        {toast && <Toast message={toast} />}
      </Shell>
    );
  }

  const teacher = db.teachers.find(t => t.id === session.id);
  return (
    <Shell role="teacher" tab={tab} setTab={setTab} onLogout={logout} title={teacher.name}>
      {tab === "dashboard" && <TeacherDashboard db={db} teacher={teacher} showToast={showToast} />}
      {tab === "timetable" && <TeacherTimetable db={db} teacher={teacher} />}
      {tab === "substitutions" && <TeacherSubstitutions db={db} teacher={teacher} />}
      {tab === "examduties" && <TeacherExamDuties db={db} teacher={teacher} />}
      {tab === "notices" && <TeacherNotices db={db} />}
      {tab === "queries" && <TeacherQueries db={db} setDb={setDb} teacher={teacher} showToast={showToast} />}
      {tab === "profile" && <TeacherProfile teacher={teacher} />}
      {toast && <Toast message={toast} />}
    </Shell>
  );
}

function Toast({ message }) {
  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 bg-[#111827] text-white text-sm px-4 py-2.5 rounded-full shadow-lg z-50 flex items-center gap-2 animate-[fadeIn_0.2s]">
      <Check size={15} className="text-[#4ADE80]" /> {message}
    </div>
  );
}

/* ============================= LOGIN ============================= */

function LoginScreen({ onLogin }) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!onLogin(id.trim().toUpperCase(), password)) {
      setError("Incorrect Teacher ID or password. Please try again.");
    }
  };

  const fillDemo = (i, p) => { setId(i); setPassword(p); setError(""); };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(160deg, #1E4E8C 0%, #F59E0B 65%, #F97316 100%)", fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white/95 mx-auto mb-3 flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold" style={{ color: "#1E4E8C" }}>RPS</span>
          </div>
          <h1 className="text-white font-bold text-xl leading-tight">Ramanujan Public School</h1>
          <p className="text-white/85 text-sm mt-1">Teacher Duty Portal</p>
        </div>

        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Teacher ID</label>
              <input
                value={id}
                onChange={e => { setId(e.target.value); setError(""); }}
                placeholder="e.g. TCH101"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1E4E8C]/30 focus:border-[#1E4E8C]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1E4E8C]/30 focus:border-[#1E4E8C]"
              />
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-sm text-[#C2410C] bg-[#FFEDE5] rounded-lg px-3 py-2">
                <AlertCircle size={15} /> {error}
              </div>
            )}
            <button type="submit" className="w-full py-2.5 rounded-xl text-white font-semibold text-sm shadow-md transition-transform active:scale-[0.98]" style={{ background: "linear-gradient(90deg, #1E4E8C, #F97316)" }}>
              Log In
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2 font-medium">Demo accounts</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => fillDemo("ADMIN01", "admin123")} className="text-xs py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-[#1E4E8C] hover:text-[#1E4E8C] transition-colors">Principal</button>
              <button onClick={() => fillDemo("ADMIN02", "admin123")} className="text-xs py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-[#1E4E8C] hover:text-[#1E4E8C] transition-colors">Headmaster</button>
              <button onClick={() => fillDemo("ADMIN03", "admin123")} className="text-xs py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-[#1E4E8C] hover:text-[#1E4E8C] transition-colors">Coordinator</button>
              <button onClick={() => fillDemo("TCH101", "teacher123")} className="text-xs py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-[#1E4E8C] hover:text-[#1E4E8C] transition-colors">Teacher demo</button>
            </div>
          </div>
        </Card>
        <p className="text-center text-white/70 text-xs mt-4">Installable as an app · Works on Android & iPhone</p>
        <p className="text-center text-white/50 text-[11px] mt-2">Developed by ANGEL</p>
      </div>
    </div>
  );
}

/* ============================= SHELL (NAV) ============================= */

const TEACHER_NAV = [
  { key: "dashboard", label: "Home", icon: Home },
  { key: "timetable", label: "Timetable", icon: Calendar },
  { key: "substitutions", label: "Substitutions", icon: RefreshCw },
  { key: "examduties", label: "Exam Duty", icon: ClipboardList },
  { key: "notices", label: "Notices", icon: Megaphone },
  { key: "queries", label: "Queries", icon: MessageSquare },
  { key: "profile", label: "Profile", icon: User },
];
const ADMIN_NAV = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "teachers", label: "Teachers", icon: Users },
  { key: "substitutions", label: "Substitutions", icon: RefreshCw },
  { key: "examduties", label: "Exam Duties", icon: ClipboardList },
  { key: "notices", label: "Notices", icon: Megaphone },
  { key: "queries", label: "Queries", icon: MessageSquare },
];

function Shell({ role, tab, setTab, onLogout, title, children }) {
  const nav = role === "admin" ? ADMIN_NAV : TEACHER_NAV;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const bottomNav = role === "teacher" ? nav.filter(n => n.key !== "profile") : nav.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F7F8FA]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="md:flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:flex-col w-60 shrink-0 min-h-screen bg-white border-r border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #1E4E8C, #F97316)" }}>RPS</div>
              <div>
                <p className="text-[13px] font-bold text-[#111827] leading-tight">Ramanujan Public</p>
                <p className="text-[11px] text-gray-400">School Portal</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {nav.map(n => (
              <button
                key={n.key}
                onClick={() => setTab(n.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab === n.key ? "text-white" : "text-gray-500 hover:bg-gray-50"}`}
                style={tab === n.key ? { background: "linear-gradient(90deg, #1E4E8C, #1E4E8Ccc)" } : {}}
              >
                <n.icon size={17} /> {n.label}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-gray-100">
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
              <LogOut size={17} /> Log Out
            </button>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex-1 min-h-screen flex flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-30 text-white" style={{ background: "linear-gradient(90deg, #1E4E8C 0%, #F59E0B 70%, #F97316 100%)" }}>
            <div className="flex items-center justify-between px-4 md:px-6 py-3.5">
              <div className="md:hidden flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center text-xs font-bold">RPS</div>
                <span className="font-semibold text-sm">{role === "admin" ? "Admin Portal" : "Teacher Portal"}</span>
              </div>
              <span className="hidden md:block font-semibold text-sm">{title}</span>
              <div className="flex items-center gap-3">
                <button className="relative w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <Bell size={15} />
                </button>
                <button onClick={onLogout} className="md:hidden w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 md:px-6 py-5 pb-24 md:pb-8 max-w-5xl w-full mx-auto">
            {children}
            <p className="text-center text-gray-300 text-[11px] mt-8">Developed by ANGEL</p>
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-40" style={{ boxShadow: "0 -2px 10px rgba(17,24,39,0.06)" }}>
        {bottomNav.map(n => (
          <button key={n.key} onClick={() => setTab(n.key)} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5">
            <n.icon size={19} color={tab === n.key ? "#1E4E8C" : "#9CA3AF"} />
            <span className="text-[10px] font-medium" style={{ color: tab === n.key ? "#1E4E8C" : "#9CA3AF" }}>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ============================= TEACHER: DASHBOARD ============================= */

function TeacherDashboard({ db, teacher, showToast }) {
  const g = greeting();
  const myTimetable = db.timetables[teacher.id] || blankTimetable();
  const todaySlots = myTimetable[TODAY_DAY] || [];
  const teaching = todaySlots.filter(Boolean).length;
  const free = todaySlots.length - teaching;
  const todaysSubs = db.substitutions.filter(s => s.day === TODAY_DAY && (s.absentTeacherId === teacher.id || s.replacementTeacherId === teacher.id));
  const myNewSubs = db.substitutions.filter(s => s.replacementTeacherId === teacher.id && s.isNew);
  const tomorrowDuty = db.examDuties.find(e => e.teacherId === teacher.id && e.date === "Tomorrow");
  const latestNotices = db.notices.slice(0, 3);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Avatar name={teacher.name} size={52} />
        <div>
          <p className="text-sm text-gray-400 flex items-center gap-1"><g.Icon size={14} /> {g.text}</p>
          <h1 className="text-lg font-bold text-[#111827]">{teacher.name.split(" ").slice(-1)[0] === teacher.name ? teacher.name : `Ms. ${teacher.name.split(" ").pop()}`.replace("Ms. ", teacher.name.startsWith("Mr") ? "Mr. " : "Ms. ")}</h1>
          <p className="text-xs text-gray-400">{teacher.id} · {teacher.subject}</p>
        </div>
      </div>

      {myNewSubs.length > 0 && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-medium" style={{ background: "#FFEDE5", color: "#C2410C" }}>
          <RefreshCw size={16} /> You have {myNewSubs.length} new substitution{myNewSubs.length > 1 ? "s" : ""} today.
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-[#1E4E8C]">{teaching}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Teaching periods</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">{free}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Free periods</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-[#F97316]">{todaysSubs.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Substitutions today</p>
        </Card>
      </div>

      <div>
        <SectionTitle>Today's timetable · {DAY_FULL[TODAY_DAY]}</SectionTitle>
        <div className="grid grid-cols-4 gap-2">
          {todaySlots.map((slot, i) => (
            <div key={i} className="rounded-xl p-2.5 text-center border-2 border-dashed" style={slot ? { background: colorForClass(slot.class), borderColor: "transparent", borderStyle: "solid" } : { background: "#F3F4F6", borderColor: "#E5E7EB" }}>
              <p className="text-[10px] text-gray-400 mb-0.5">P{i + 1}</p>
              {slot ? (
                <>
                  <p className="text-xs font-semibold text-[#111827]">{slot.class}</p>
                  <p className="text-[10px] text-gray-500">{slot.subject}</p>
                </>
              ) : <p className="text-[10px] text-gray-400">Free</p>}
            </div>
          ))}
        </div>
      </div>

      {todaysSubs.length > 0 && (
        <div>
          <SectionTitle>Today's substitutions</SectionTitle>
          <div className="space-y-2">
            {todaysSubs.map(s => <SubstitutionCard key={s.id} sub={s} teacher={teacher} teachers={db.teachers} />)}
          </div>
        </div>
      )}

      {tomorrowDuty && (
        <div>
          <SectionTitle>Tomorrow's exam duty</SectionTitle>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#111827]">{tomorrowDuty.class} · {tomorrowDuty.subject}</p>
                <p className="text-xs text-gray-400 mt-1">{tomorrowDuty.room} · {tomorrowDuty.time}</p>
              </div>
              <Badge bg="#EAF7FF" text="#1E4E8C">{tomorrowDuty.dutyType}</Badge>
            </div>
          </Card>
        </div>
      )}

      <div>
        <SectionTitle>Latest notices</SectionTitle>
        <div className="space-y-2">
          {latestNotices.map(n => <NoticeCard key={n.id} notice={n} compact />)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => showToast("Dashboard refreshed")} className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:border-[#1E4E8C]">
          <RefreshCw size={15} /> Refresh
        </button>
        <button onClick={() => showToast("Timetable PDF ready to download")} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white" style={{ background: "linear-gradient(90deg, #1E4E8C, #F97316)" }}>
          <Download size={15} /> Download timetable
        </button>
      </div>
    </div>
  );
}

function SubstitutionCard({ sub, teacher, teachers }) {
  const absent = teachers.find(t => t.id === sub.absentTeacherId);
  const replacement = teachers.find(t => t.id === sub.replacementTeacherId);
  const isMine = replacement?.id === teacher?.id;
  return (
    <Card className="p-3.5 relative" style={{ background: "#FFF1E6" }}>
      {sub.isNew && <span className="absolute top-2.5 right-2.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: "#F97316" }}>NEW</span>}
      <div className="flex items-start justify-between pr-10">
        <div>
          <p className="text-sm font-semibold text-[#111827]">{sub.class} · Period {sub.period}</p>
          <p className="text-xs text-gray-500 mt-0.5">{sub.day} · {sub.date}</p>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-600">
        {absent?.name} <span className="text-gray-400">is absent</span> → {isMine ? <span className="font-semibold text-[#C2410C]">you</span> : replacement?.name} <span className="text-gray-400">covering</span>
      </div>
    </Card>
  );
}

function NoticeCard({ notice, compact, onDelete }) {
  const p = priorityStyle[notice.priority];
  return (
    <Card className="p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#111827] leading-snug">{notice.title}</p>
          {!compact && <p className="text-xs text-gray-400 mt-1">{notice.date}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge bg={p.bg} text={p.text}>{p.label}</Badge>
          {onDelete && (
            <button onClick={onDelete} className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete notice">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      {compact && <p className="text-[11px] text-gray-400 mt-1.5">{notice.date}</p>}
    </Card>
  );
}

/* ============================= TEACHER: TIMETABLE ============================= */

function TeacherTimetable({ db, teacher }) {
  const [dayIdx, setDayIdx] = useState(DAYS.indexOf(TODAY_DAY));
  const day = DAYS[dayIdx];
  const myTimetable = db.timetables[teacher.id] || blankTimetable();
  const slots = myTimetable[day] || [];

  return (
    <div>
      <SectionTitle>Weekly Timetable</SectionTitle>

      {/* Mobile: swipe one day */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setDayIdx(i => Math.max(0, i - 1))} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center disabled:opacity-30" disabled={dayIdx === 0}>
            <ChevronLeft size={16} />
          </button>
          <p className="font-semibold text-sm text-[#111827]">{DAY_FULL[day]}</p>
          <button onClick={() => setDayIdx(i => Math.min(5, i + 1))} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center disabled:opacity-30" disabled={dayIdx === 5}>
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="space-y-2">
          {slots.map((slot, i) => {
            const isCurrent = day === TODAY_DAY && i === new Date().getHours() - 8;
            return (
              <Card key={i} className="p-3.5" style={{ background: slot ? colorForClass(slot.class) : "#F3F4F6", ...(isCurrent ? { border: "2px solid #1E4E8C" } : {}) }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500">Period {i + 1} · {i < 4 ? PERIOD_TIMES[i] : PERIOD_TIMES[i + 1]}</p>
                    {slot ? (
                      <p className="text-sm font-semibold text-[#111827] mt-0.5">{slot.class} · {slot.subject}</p>
                    ) : <p className="text-sm text-[#6B7280] mt-0.5 italic">Free period</p>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Desktop: full grid */}
      <div className="hidden md:block overflow-x-auto">
        <Card className="p-4">
          <table className="w-full border-separate" style={{ borderSpacing: "6px" }}>
            <thead>
              <tr>
                <th className="text-left text-[11px] text-gray-400 font-medium w-20">Day</th>
                {Array.from({ length: 8 }).map((_, i) => (
                  <th key={i} className="text-[11px] text-gray-400 font-medium">
                    P{i + 1}<br /><span className="font-normal">{i < 4 ? PERIOD_TIMES[i] : PERIOD_TIMES[i + 1]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map(d => (
                <tr key={d}>
                  <td className="text-xs font-semibold text-[#111827]">{d}</td>
                  {(myTimetable[d] || []).map((slot, i) => {
                    const isCurrent = d === TODAY_DAY && i === new Date().getHours() - 8;
                    return (
                      <td key={i} className="rounded-lg p-2 text-center align-middle" style={{ background: slot ? colorForClass(slot.class) : "#F3F4F6", ...(isCurrent ? { border: "2px solid #1E4E8C" } : { border: slot ? "none" : "1px dashed #E5E7EB" }) }}>
                        {slot ? (
                          <>
                            <p className="text-[11px] font-semibold text-[#111827]">{slot.class}</p>
                            <p className="text-[10px] text-gray-600">{slot.subject}</p>
                          </>
                        ) : <p className="text-[10px] text-[#6B7280]">Free</p>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

/* ============================= TEACHER: SUBSTITUTIONS ============================= */

function TeacherSubstitutions({ db, teacher }) {
  const mine = db.substitutions.filter(s => s.absentTeacherId === teacher.id || s.replacementTeacherId === teacher.id);
  return (
    <div>
      <SectionTitle>Substitutions</SectionTitle>
      {mine.length === 0 ? <EmptyState text="No substitutions involve you right now." /> : (
        <div className="space-y-2">{mine.map(s => <SubstitutionCard key={s.id} sub={s} teacher={teacher} teachers={db.teachers} />)}</div>
      )}
    </div>
  );
}

/* ============================= TEACHER: EXAM DUTIES ============================= */

function TeacherExamDuties({ db, teacher }) {
  const mine = db.examDuties.filter(e => e.teacherId === teacher.id);
  return (
    <div>
      <SectionTitle>Exam Duties</SectionTitle>
      {mine.length === 0 ? <EmptyState text="No exam duties assigned yet." /> : (
        <div className="space-y-2">
          {mine.map(e => (
            <Card key={e.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#111827]">{e.class} · {e.subject}</p>
                  {e.examName && <p className="text-xs font-medium text-[#1E4E8C] mt-0.5">{e.examName}</p>}
                  <p className="text-xs text-gray-400 mt-1">{e.date} · {e.time} · {e.room}</p>
                </div>
                <Badge bg="#EAF7FF" text="#1E4E8C">{e.dutyType}</Badge>
              </div>
              <button className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#1E4E8C]">
                <Download size={13} /> Download duty slip (PDF)
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================= TEACHER: NOTICES ============================= */

function TeacherNotices({ db }) {
  return (
    <div>
      <SectionTitle>Notices</SectionTitle>
      <div className="space-y-2">{db.notices.map(n => <NoticeCard key={n.id} notice={n} />)}</div>
    </div>
  );
}

/* ============================= TEACHER: QUERIES ============================= */

function TeacherQueries({ db, setDb, teacher, showToast }) {
  const mine = db.queries.filter(q => q.teacherId === teacher.id);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  const submit = () => {
    if (!message.trim()) return;
    const q = { id: "Q" + Date.now(), teacherId: teacher.id, message, replies: [], resolved: false };
    setDb(prev => ({ ...prev, queries: [q, ...prev.queries] }));
    setMessage(""); setShowForm(false);
    showToast("Query sent to admin");
  };

  return (
    <div>
      <SectionTitle action={
        <button onClick={() => setShowForm(s => !s)} className="flex items-center gap-1 text-xs font-semibold text-white px-3 py-1.5 rounded-lg" style={{ background: "#1E4E8C" }}>
          <Plus size={14} /> New Query
        </button>
      }>My Queries</SectionTitle>

      {showForm && (
        <Card className="p-4 mb-3 space-y-2.5">
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your query..." rows={3} autoFocus className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1E4E8C] resize-none" />
          <button onClick={submit} className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-lg" style={{ background: "linear-gradient(90deg, #1E4E8C, #F97316)" }}>
            <Send size={14} /> Send to Admin
          </button>
        </Card>
      )}

      {mine.length === 0 ? <EmptyState text="You haven't sent any queries yet." /> : (
        <div className="space-y-2">
          {mine.map(q => (
            <Card key={q.id} className="p-4">
              <div className="flex items-start justify-between">
                <p className="text-sm text-gray-500 leading-snug pr-3">{q.message}</p>
                <Badge bg={q.resolved ? "#EAFBF1" : "#FFF6DD"} text={q.resolved ? "#15803D" : "#92600A"}>{q.resolved ? "Resolved" : "Pending"}</Badge>
              </div>
              {q.replies.map((r, i) => (
                <div key={i} className="mt-2.5 ml-3 pl-3 border-l-2" style={{ borderColor: "#F59E0B" }}>
                  <p className="text-xs font-semibold text-[#1E4E8C]">{r.from}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{r.text}</p>
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================= TEACHER: PROFILE ============================= */

function TeacherProfile({ teacher }) {
  return (
    <div>
      <SectionTitle>Profile</SectionTitle>
      <Card className="p-6 flex flex-col items-center text-center">
        <Avatar name={teacher.name} size={72} />
        <h2 className="text-lg font-bold text-[#111827] mt-3">{teacher.name}</h2>
        <p className="text-sm text-gray-400">{teacher.id}</p>
        <div className="w-full mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 gap-4 text-left">
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Subject</p>
            <p className="text-sm font-medium text-[#111827] mt-0.5">{teacher.subject}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Department</p>
            <p className="text-sm font-medium text-[#111827] mt-0.5">{teacher.department}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ============================= SHARED ============================= */

function EmptyState({ text }) {
  return (
    <div className="py-10 text-center text-sm text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
      {text}
    </div>
  );
}

/* ============================= ADMIN: DASHBOARD ============================= */

function AdminDashboard({ db, admin }) {
  const stats = [
    { label: "Teachers", value: db.teachers.length, icon: Users, color: "#1E4E8C" },
    { label: "Substitutions today", value: db.substitutions.filter(s => s.day === TODAY_DAY).length, icon: RefreshCw, color: "#F97316" },
    { label: "Exam duties", value: db.examDuties.length, icon: ClipboardList, color: "#15803D" },
    { label: "Open queries", value: db.queries.filter(q => !q.resolved).length, icon: MessageSquare, color: "#C2410C" },
  ];
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-gray-400">{greeting().text}</p>
        <h1 className="text-lg font-bold text-[#111827]">{admin?.name}</h1>
        <p className="text-xs text-gray-400">{admin?.role}</p>
        {admin?.teacherId && (
          <p className="text-[11px] text-[#1E4E8C] mt-1">Also teaches — log in as {admin.teacherId} to see your own timetable and duties.</p>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <Card key={s.label} className="p-4">
            <s.icon size={17} color={s.color} />
            <p className="text-2xl font-bold text-[#111827] mt-2">{s.value}</p>
            <p className="text-[11px] text-gray-400">{s.label}</p>
          </Card>
        ))}
      </div>
      <div>
        <SectionTitle>Recent notices</SectionTitle>
        <div className="space-y-2">{db.notices.slice(0, 3).map(n => <NoticeCard key={n.id} notice={n} />)}</div>
      </div>
      <div>
        <SectionTitle>Recent queries</SectionTitle>
        <div className="space-y-2">
          {db.queries.slice(0, 3).map(q => {
            const t = db.teachers.find(t => t.id === q.teacherId);
            return (
              <Card key={q.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#111827]">{t?.name}</p>
                  <p className="text-xs text-gray-400 line-clamp-1">{q.message}</p>
                </div>
                <Badge bg={q.resolved ? "#EAFBF1" : "#FFF6DD"} text={q.resolved ? "#15803D" : "#92600A"}>{q.resolved ? "Resolved" : "Pending"}</Badge>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================= ADMIN: TEACHERS ============================= */

function AdminTeachers({ db, setDb, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", subject: "", department: "" });
  const [created, setCreated] = useState(null); // { id, password, name } — shown once after creating

  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", subject: "", department: "" });
  const [resetResult, setResetResult] = useState(null); // { id, name, password }
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [timetableTeacherId, setTimetableTeacherId] = useState(null);

  const openForm = () => {
    setCreated(null);
    setForm({ name: "", subject: "", department: "" });
    setShowForm(true);
  };

  const submit = () => {
    if (!form.name.trim() || !form.subject.trim() || !form.department.trim()) return;
    const id = nextTeacherId(db.teachers);
    const password = generatePassword();
    const newTeacher = { id, password, name: form.name.trim(), subject: form.subject.trim(), department: form.department.trim() };
    setDb(prev => ({
      ...prev,
      teachers: [...prev.teachers, newTeacher],
      timetables: { ...prev.timetables, [id]: blankTimetable() },
    }));
    setCreated(newTeacher);
    showToast(`${newTeacher.name} added`);
  };

  const startEdit = (t) => {
    setMenuOpenId(null);
    setEditingId(t.id);
    setEditForm({ name: t.name, subject: t.subject, department: t.department });
  };

  const saveEdit = () => {
    if (!editForm.name.trim() || !editForm.subject.trim() || !editForm.department.trim()) return;
    setDb(prev => ({
      ...prev,
      teachers: prev.teachers.map(t => t.id === editingId ? { ...t, name: editForm.name.trim(), subject: editForm.subject.trim(), department: editForm.department.trim() } : t),
    }));
    showToast("Teacher details updated");
    setEditingId(null);
  };

  const resetPassword = (t) => {
    setMenuOpenId(null);
    const password = generatePassword();
    setDb(prev => ({ ...prev, teachers: prev.teachers.map(x => x.id === t.id ? { ...x, password } : x) }));
    setResetResult({ id: t.id, name: t.name, password });
  };

  const removeTeacher = (id) => {
    setDb(prev => ({
      ...prev,
      teachers: prev.teachers.filter(t => t.id !== id),
    }));
    setConfirmRemoveId(null);
    showToast("Teacher removed");
  };

  if (timetableTeacherId) {
    const teacher = db.teachers.find(t => t.id === timetableTeacherId);
    return <AdminTimetableEditor db={db} setDb={setDb} teacher={teacher} onBack={() => setTimetableTeacherId(null)} showToast={showToast} />;
  }

  return (
    <div>
      <SectionTitle action={
        <button onClick={openForm} className="flex items-center gap-1 text-xs font-semibold text-white px-3 py-1.5 rounded-lg" style={{ background: "#1E4E8C" }}>
          <Plus size={14} /> Add Teacher
        </button>
      }>Teachers ({db.teachers.length})</SectionTitle>

      {showForm && (
        <Card className="p-4 mb-3 space-y-3">
          {!created ? (
            <>
              <TextInput label="Full name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Mrs. Meera Pillai" />
              <div className="grid grid-cols-2 gap-3">
                <TextInput label="Subject" value={form.subject} onChange={v => setForm(f => ({ ...f, subject: v }))} placeholder="e.g. Economics" />
                <TextInput label="Department" value={form.department} onChange={v => setForm(f => ({ ...f, department: v }))} placeholder="e.g. Social Science" />
              </div>
              <div className="flex gap-2">
                <button onClick={submit} className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: "linear-gradient(90deg, #1E4E8C, #F97316)" }}>Create Teacher Account</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-500">Cancel</button>
              </div>
              <p className="text-[11px] text-gray-400">A Teacher ID and starting password are generated automatically once you create the account.</p>
            </>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#15803D] mb-3">
                <Check size={16} /> Teacher account created
              </div>
              <div className="rounded-xl p-4 space-y-2" style={{ background: "#EAFBF1" }}>
                <Row label="Name" value={created.name} />
                <Row label="Teacher ID" value={created.id} mono />
                <Row label="Starting password" value={created.password} mono />
              </div>
              <p className="text-xs text-gray-500 mt-3">Share these credentials with {created.name.split(" ").pop()} — they can log in right away with this Teacher ID and password. It's a good idea to have them change the password after their first login.</p>
              <div className="flex gap-2 mt-3">
                <button onClick={openForm} className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: "linear-gradient(90deg, #1E4E8C, #F97316)" }}>Add Another</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-500">Done</button>
              </div>
            </div>
          )}
        </Card>
      )}

      {resetResult && (
        <Card className="p-4 mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#15803D] mb-3">
            <Check size={16} /> Password reset for {resetResult.name}
          </div>
          <div className="rounded-xl p-4 space-y-2" style={{ background: "#EAFBF1" }}>
            <Row label="Teacher ID" value={resetResult.id} mono />
            <Row label="New password" value={resetResult.password} mono />
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={() => setResetResult(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-500">Done</button>
          </div>
        </Card>
      )}

      <Card className="divide-y divide-gray-100 overflow-visible">
        {db.teachers.map(t => (
          <div key={t.id}>
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <Avatar name={t.name} size={38} />
                <div>
                  <p className="text-sm font-medium text-[#111827]">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.id} · {t.subject}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge bg="#EAF7FF" text="#1E4E8C">{t.department}</Badge>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpenId(id => id === t.id ? null : t.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"
                    aria-label="Teacher options"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuOpenId === t.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                      <div className="absolute right-0 top-8 z-20 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 overflow-hidden">
                        <MenuItem icon={Edit3} label="Edit details" onClick={() => startEdit(t)} />
                        <MenuItem icon={Calendar} label="Edit timetable" onClick={() => { setMenuOpenId(null); setTimetableTeacherId(t.id); }} />
                        <MenuItem icon={KeyRound} label="Reset password" onClick={() => resetPassword(t)} />
                        <MenuItem icon={Trash2} label="Remove teacher" danger onClick={() => { setMenuOpenId(null); setConfirmRemoveId(t.id); }} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {editingId === t.id && (
              <div className="px-3.5 pb-4">
                <Card className="p-4 space-y-3" style={{ background: "#F7F8FA" }}>
                  <TextInput label="Full name" value={editForm.name} onChange={v => setEditForm(f => ({ ...f, name: v }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <TextInput label="Subject" value={editForm.subject} onChange={v => setEditForm(f => ({ ...f, subject: v }))} />
                    <TextInput label="Department" value={editForm.department} onChange={v => setEditForm(f => ({ ...f, department: v }))} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex-1 py-2 rounded-xl text-white font-semibold text-sm" style={{ background: "linear-gradient(90deg, #1E4E8C, #F97316)" }}>Save Changes</button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-500">Cancel</button>
                  </div>
                </Card>
              </div>
            )}

            {confirmRemoveId === t.id && (
              <div className="px-3.5 pb-4">
                <div className="rounded-xl p-3.5 flex items-center justify-between" style={{ background: "#FFEDE5" }}>
                  <p className="text-sm text-[#C2410C]">Remove {t.name} from the portal? They'll no longer be able to log in.</p>
                  <div className="flex gap-2 shrink-0 ml-3">
                    <button onClick={() => removeTeacher(t.id)} className="px-3 py-1.5 rounded-lg bg-[#C2410C] text-white text-xs font-semibold">Remove</button>
                    <button onClick={() => setConfirmRemoveId(null)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 bg-white">Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left hover:bg-gray-50"
      style={{ color: danger ? "#C2410C" : "#374151" }}
    >
      <Icon size={15} /> {label}
    </button>
  );
}

/* ============================= ADMIN: EDIT TIMETABLE ============================= */

function AdminTimetableEditor({ db, setDb, teacher, onBack, showToast }) {
  const timetable = db.timetables[teacher.id] || blankTimetable();
  const [dayIdx, setDayIdx] = useState(0);
  const [selected, setSelected] = useState(null); // period index (0-7) within the selected day
  const [cellForm, setCellForm] = useState({ class: "", subject: teacher.subject });
  const day = DAYS[dayIdx];
  const slots = timetable[day] || [];

  const selectCell = (i) => {
    const slot = slots[i];
    setSelected(i);
    setCellForm(slot ? { class: slot.class, subject: slot.subject } : { class: "", subject: teacher.subject });
  };

  const saveCell = () => {
    if (!cellForm.class.trim()) return;
    const time = selected < 4 ? PERIOD_TIMES[selected] : PERIOD_TIMES[selected + 1];
    const newSlot = { class: cellForm.class.trim(), subject: cellForm.subject.trim() || teacher.subject, time };
    setDb(prev => ({
      ...prev,
      timetables: {
        ...prev.timetables,
        [teacher.id]: { ...prev.timetables[teacher.id], [day]: slots.map((s, i) => i === selected ? newSlot : s) },
      },
    }));
    showToast(`${day} · Period ${selected + 1} updated`);
    setSelected(null);
  };

  const clearCell = () => {
    setDb(prev => ({
      ...prev,
      timetables: {
        ...prev.timetables,
        [teacher.id]: { ...prev.timetables[teacher.id], [day]: slots.map((s, i) => i === selected ? null : s) },
      },
    }));
    showToast(`${day} · Period ${selected + 1} marked free`);
    setSelected(null);
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mb-3">
        <ChevronLeft size={16} /> Back to Teachers
      </button>
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={teacher.name} size={40} />
        <div>
          <h1 className="text-base font-bold text-[#111827]">{teacher.name}'s Timetable</h1>
          <p className="text-xs text-gray-400">{teacher.id} · {teacher.subject}</p>
        </div>
      </div>

      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        {DAYS.map((d, i) => (
          <button
            key={d}
            onClick={() => { setDayIdx(i); setSelected(null); }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0"
            style={i === dayIdx ? { background: "#1E4E8C", color: "white" } : { background: "white", color: "#6B7280", border: "1px solid #E5E7EB" }}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {slots.map((slot, i) => (
          <button
            key={i}
            onClick={() => selectCell(i)}
            className="rounded-xl p-3 text-left border-2 transition-colors"
            style={{
              background: slot ? colorForClass(slot.class) : "#F3F4F6",
              borderColor: selected === i ? "#1E4E8C" : "transparent",
            }}
          >
            <p className="text-[10px] text-gray-500 mb-0.5">Period {i + 1}</p>
            {slot ? (
              <>
                <p className="text-xs font-semibold text-[#111827]">{slot.class}</p>
                <p className="text-[10px] text-gray-600">{slot.subject}</p>
              </>
            ) : <p className="text-[10px] text-[#6B7280]">Free — tap to assign</p>}
          </button>
        ))}
      </div>

      {selected !== null && (
        <Card className="p-4 space-y-3">
          <SectionTitle>Edit {day} · Period {selected + 1}</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Class / Section" value={cellForm.class} onChange={v => setCellForm(f => ({ ...f, class: v }))} placeholder="e.g. 9 B" />
            <TextInput label="Subject" value={cellForm.subject} onChange={v => setCellForm(f => ({ ...f, subject: v }))} placeholder={teacher.subject} />
          </div>
          <div className="flex gap-2">
            <button onClick={saveCell} className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: "linear-gradient(90deg, #1E4E8C, #F97316)" }}>Save Period</button>
            <button onClick={clearCell} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-500">Mark Free</button>
            <button onClick={() => setSelected(null)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-500">Close</button>
          </div>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-semibold text-[#111827] ${mono ? "font-mono tracking-wide" : ""}`}>{value}</span>
    </div>
  );
}

/* ============================= ADMIN: SUBSTITUTIONS ============================= */

function AdminSubstitutions({ db, setDb, showToast }) {
  const [form, setForm] = useState({ absentTeacherId: "", replacementTeacherId: "", class: "", period: "1", day: TODAY_DAY });

  const submit = () => {
    if (!form.absentTeacherId || !form.replacementTeacherId || !form.class) return;
    const s = { id: "S" + Date.now(), date: "Today", day: form.day, period: parseInt(form.period), class: form.class, absentTeacherId: form.absentTeacherId, replacementTeacherId: form.replacementTeacherId, isNew: true };
    setDb(prev => ({ ...prev, substitutions: [s, ...prev.substitutions] }));
    setForm({ absentTeacherId: "", replacementTeacherId: "", class: "", period: "1", day: TODAY_DAY });
    showToast(`Substitution created — visible on ${db.teachers.find(t => t.id === form.replacementTeacherId)?.name.split(" ").pop()}'s dashboard`);
  };

  return (
    <div className="space-y-5">
      <div>
        <SectionTitle>Create Substitution</SectionTitle>
        <Card className="p-4 grid grid-cols-2 gap-3">
          <Select label="Absent teacher" value={form.absentTeacherId} onChange={v => setForm(f => ({ ...f, absentTeacherId: v }))} options={db.teachers.map(t => [t.id, t.name])} />
          <Select label="Replacement teacher" value={form.replacementTeacherId} onChange={v => setForm(f => ({ ...f, replacementTeacherId: v }))} options={db.teachers.map(t => [t.id, t.name])} />
          <div>
            <label className="text-xs font-semibold text-gray-500">Class / Section</label>
            <input value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))} placeholder="e.g. 9 B" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1E4E8C]" />
          </div>
          <Select label="Period" value={form.period} onChange={v => setForm(f => ({ ...f, period: v }))} options={Array.from({ length: 8 }, (_, i) => [String(i + 1), `Period ${i + 1}`])} />
          <Select label="Day" value={form.day} onChange={v => setForm(f => ({ ...f, day: v }))} options={DAYS.map(d => [d, DAY_FULL[d]])} />
          <div className="col-span-2">
            <button onClick={submit} className="w-full mt-1 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: "linear-gradient(90deg, #1E4E8C, #F97316)" }}>Save Substitution</button>
          </div>
        </Card>
      </div>
      <div>
        <SectionTitle>Substitution history</SectionTitle>
        <div className="space-y-2">
          {db.substitutions.map(s => {
            const absent = db.teachers.find(t => t.id === s.absentTeacherId);
            const rep = db.teachers.find(t => t.id === s.replacementTeacherId);
            return (
              <Card key={s.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#111827]">{s.class} · P{s.period} · {s.day}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{absent?.name} → {rep?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {s.isNew && <Badge bg="#FFF1E6" text="#C2410C">New</Badge>}
                  <button
                    onClick={() => { setDb(prev => ({ ...prev, substitutions: prev.substitutions.filter(x => x.id !== s.id) })); showToast("Substitution deleted"); }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete substitution"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1E4E8C] bg-white">
        <option value="">Select…</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

/* ============================= ADMIN: EXAM DUTIES ============================= */

const EXAM_NAMES = ["PA 1", "PA 2", "PA 3", "Half Yearly", "Annual", "Pre-Board"];

function AdminExamDuties({ db, setDb, showToast }) {
  const [form, setForm] = useState({ teacherId: "", examName: "", date: "", time: "", room: "", class: "", subject: "", dutyType: "Invigilation" });

  // Pre-Board only applies to Class 10 and 12
  const isSeniorClass = /^\s*(10|12)\b/.test(form.class);
  const examNameOptions = EXAM_NAMES.filter(n => n !== "Pre-Board" || isSeniorClass).map(n => [n, n]);

  const submit = () => {
    if (!form.teacherId || !form.examName || !form.date || !form.class) return;
    const e = { id: "E" + Date.now(), ...form };
    setDb(prev => ({ ...prev, examDuties: [e, ...prev.examDuties] }));
    setForm({ teacherId: "", examName: "", date: "", time: "", room: "", class: "", subject: "", dutyType: "Invigilation" });
    showToast("Exam duty assigned");
  };

  const removeDuty = (id) => {
    setDb(prev => ({ ...prev, examDuties: prev.examDuties.filter(x => x.id !== id) }));
    showToast("Exam duty deleted");
  };

  return (
    <div className="space-y-5">
      <div>
        <SectionTitle>Assign Exam Duty</SectionTitle>
        <Card className="p-4 grid grid-cols-2 gap-3">
          <Select label="Teacher" value={form.teacherId} onChange={v => setForm(f => ({ ...f, teacherId: v }))} options={db.teachers.map(t => [t.id, t.name])} />
          <TextInput label="Class" value={form.class} onChange={v => setForm(f => ({ ...f, class: v }))} placeholder="e.g. 10 A" />
          <div>
            <Select label="Exam" value={form.examName} onChange={v => setForm(f => ({ ...f, examName: v }))} options={examNameOptions} />
            {!isSeniorClass && <p className="text-[10px] text-gray-400 mt-1">Pre-Board appears once Class is set to 10 or 12.</p>}
          </div>
          <TextInput label="Date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} placeholder="e.g. 18 Aug" />
          <TextInput label="Time" value={form.time} onChange={v => setForm(f => ({ ...f, time: v }))} placeholder="e.g. 09:00 – 12:00" />
          <TextInput label="Room" value={form.room} onChange={v => setForm(f => ({ ...f, room: v }))} placeholder="e.g. Room 204" />
          <TextInput label="Subject" value={form.subject} onChange={v => setForm(f => ({ ...f, subject: v }))} placeholder="e.g. Mathematics" />
          <Select label="Duty type" value={form.dutyType} onChange={v => setForm(f => ({ ...f, dutyType: v }))} options={[["Invigilation", "Invigilation"], ["Subject Expert", "Subject Expert"], ["Relief Duty", "Relief Duty"]]} />
          <div className="col-span-2">
            <button onClick={submit} className="w-full mt-1 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: "linear-gradient(90deg, #1E4E8C, #F97316)" }}>Save Exam Duty</button>
          </div>
        </Card>
      </div>
      <div>
        <SectionTitle>All exam duties</SectionTitle>
        <div className="space-y-2">
          {db.examDuties.map(e => {
            const t = db.teachers.find(t => t.id === e.teacherId);
            return (
              <Card key={e.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#111827]">{t?.name} · {e.class}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {e.examName && <span className="font-medium text-[#1E4E8C]">{e.examName}</span>}
                    {e.examName && " · "}{e.date} · {e.room} · {e.dutyType}
                  </p>
                </div>
                <button
                  onClick={() => removeDuty(e.id)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 shrink-0"
                  aria-label="Delete exam duty"
                >
                  <Trash2 size={14} />
                </button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1E4E8C]" />
    </div>
  );
}

/* ============================= ADMIN: NOTICES ============================= */

function AdminNotices({ db, setDb, showToast }) {
  const [form, setForm] = useState({ title: "", priority: "Normal" });

  const submit = () => {
    if (!form.title.trim()) return;
    const n = { id: "N" + Date.now(), title: form.title, date: "Today", priority: form.priority };
    setDb(prev => ({ ...prev, notices: [n, ...prev.notices] }));
    setForm({ title: "", priority: "Normal" });
    showToast("Notice published to all teachers");
  };

  return (
    <div className="space-y-5">
      <div>
        <SectionTitle>Create Notice</SectionTitle>
        <Card className="p-4 space-y-3">
          <TextInput label="Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Notice text" />
          <Select label="Priority" value={form.priority} onChange={v => setForm(f => ({ ...f, priority: v }))} options={[["Normal", "Normal"], ["Important", "Important"], ["Urgent", "Urgent"]]} />
          <button onClick={submit} className="w-full py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: "linear-gradient(90deg, #1E4E8C, #F97316)" }}>Publish Notice</button>
        </Card>
      </div>
      <div>
        <SectionTitle>All notices</SectionTitle>
        <div className="space-y-2">
          {db.notices.map(n => (
            <NoticeCard
              key={n.id}
              notice={n}
              onDelete={() => { setDb(prev => ({ ...prev, notices: prev.notices.filter(x => x.id !== n.id) })); showToast("Notice deleted"); }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================= ADMIN: QUERIES ============================= */

function AdminQueries({ db, setDb, showToast }) {
  const [replyDrafts, setReplyDrafts] = useState({});

  const sendReply = (qid) => {
    const text = replyDrafts[qid];
    if (!text?.trim()) return;
    setDb(prev => ({
      ...prev,
      queries: prev.queries.map(q => q.id === qid ? { ...q, replies: [...q.replies, { from: "Admin", text }] } : q)
    }));
    setReplyDrafts(d => ({ ...d, [qid]: "" }));
    showToast("Reply sent");
  };

  const toggleResolved = (qid) => {
    setDb(prev => ({ ...prev, queries: prev.queries.map(q => q.id === qid ? { ...q, resolved: !q.resolved } : q) }));
  };

  return (
    <div>
      <SectionTitle>Teacher Queries</SectionTitle>
      <div className="space-y-3">
        {db.queries.map(q => {
          const t = db.teachers.find(t => t.id === q.teacherId);
          return (
            <Card key={q.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar name={t?.name || "?"} size={32} />
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">{t?.name}</p>
                    <p className="text-[11px] text-gray-400">{t?.id} · {t?.subject}</p>
                  </div>
                </div>
                <button onClick={() => toggleResolved(q.id)}>
                  <Badge bg={q.resolved ? "#EAFBF1" : "#FFF6DD"} text={q.resolved ? "#15803D" : "#92600A"}>{q.resolved ? "Resolved" : "Mark resolved"}</Badge>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2.5">{q.message}</p>
              {q.replies.map((r, i) => (
                <div key={i} className="mt-2.5 ml-3 pl-3 border-l-2" style={{ borderColor: "#F59E0B" }}>
                  <p className="text-xs font-semibold text-[#1E4E8C]">{r.from}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{r.text}</p>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <input
                  value={replyDrafts[q.id] || ""}
                  onChange={e => setReplyDrafts(d => ({ ...d, [q.id]: e.target.value }))}
                  placeholder="Type a reply…"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#1E4E8C]"
                />
                <button onClick={() => sendReply(q.id)} className="px-3 rounded-lg text-white" style={{ background: "#1E4E8C" }}>
                  <Send size={14} />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
