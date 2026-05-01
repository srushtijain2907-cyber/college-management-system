import React, { useEffect, useState, useRef } from "react";
import Chart from "chart.js/auto";
import "./dashboard.css";

/* ══════════════════════════════════════════════════════════════
   API LAYER  —  all MongoDB calls live here
   ══════════════════════════════════════════════════════════════ */
const BASE = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("cms_token");
const hdrs = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});
async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: hdrs(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

const authAPI = {
  login:    (email, password)             => api("POST", "/auth/login",    { email, password }),
  register: (name, email, password, role) => api("POST", "/auth/register", { name, email, password, role }),
};
const studentAPI = {
  getAll: ()          => api("GET",    "/students"),
  create: (d)         => api("POST",   "/students",      d),
  update: (id, d)     => api("PUT",    `/students/${id}`, d),
  delete: (id)        => api("DELETE", `/students/${id}`),
};
const facultyAPI = {
  getAll: ()          => api("GET",    "/faculty"),
  create: (d)         => api("POST",   "/faculty",       d),
  update: (id, d)     => api("PUT",    `/faculty/${id}`,  d),
  delete: (id)        => api("DELETE", `/faculty/${id}`),
};
const marksAPI = {
  getAll:       ()              => api("GET",  "/marks"),
  getByStudent: (sid)           => api("GET",  `/marks/${sid}`),
  save:         (studentId, subjects) => api("POST", "/marks", { studentId, subjects }),
};
const feeAPI = {
  getAll:     ()                  => api("GET", "/fees"),
  addPayment: (studentId, amount) => api("PUT", `/fees/${studentId}/pay`, { amount }),
};
const noticeAPI = {
  getAll:     ()     => api("GET",    "/notices"),
  create:     (d)    => api("POST",   "/notices",            d),
  markRead:   (id)   => api("PUT",    `/notices/${id}/read`),
  markAllRead: ()    => api("PUT",    "/notices/read-all/mark"),
  delete:     (id)   => api("DELETE", `/notices/${id}`),
};
const attendanceAPI = {
  getAll: (date, type)           => api("GET",  `/attendance?date=${date}&type=${type}`),
  save:   (date, type, records)  => api("POST", "/attendance", { date, type, records }),
};

/* ══════════════════════════════════════════════════════════════
   STYLE HELPERS
   ══════════════════════════════════════════════════════════════ */
const G  = (bg, c = "#fff") => ({ background: bg, color: c, border: "none", borderRadius: 10, padding: "8px 18px", fontSize: ".82rem", fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans,sans-serif", transition: "all .2s" });
const dBtn = { background: "rgba(239,68,68,.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,.2)", borderRadius: 8, padding: "5px 12px", fontSize: ".78rem", cursor: "pointer", fontWeight: 500 };
const sBtn = G("linear-gradient(135deg,#2563eb,#7c3aed)");
const xBtn = { background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.5)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "9px 18px", fontSize: ".82rem", cursor: "pointer" };
const I    = (w = "160px") => ({ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "9px 14px", color: "#fff", fontSize: ".85rem", outline: "none", fontFamily: "DM Sans,sans-serif", width: w });
const lbl  = { fontSize: ".72rem", color: "rgba(255,255,255,.4)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".5px" };

const ADMIN_NAV   = ["home","analytics","students","faculty","marks","library","hostel","attendance","courses","timetable","fees","salary","notices","admission","feedback"];
const FACULTY_NAV = ["home","marks","attendance","timetable","notices"];
const STUDENT_NAV = ["home","marks","timetable","fees","library","notices","feedback"];

const courseBadge = c => ({ "B.Tech": "badge-blue", MCA: "badge-violet", MBA: "badge-amber", "M.Tech": "badge-green", BCA: "badge-blue" }[c] || "badge-blue");
const catColor    = c => ({ Exam: "#ef4444", Event: "#7c3aed", Fee: "#f59e0b", Holiday: "#10b981", General: "#2563eb" }[c] || "#2563eb");
const feeAmt      = { "B.Tech": 120000, "M.Tech": 100000, MCA: 80000, MBA: 90000, BCA: 60000 };

const Av = (name, bg = "linear-gradient(135deg,#2563eb,#7c3aed)") => (
  <div style={{ width: 32, height: 32, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".75rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
    {name.charAt(0)}
  </div>
);
const Badge = ({ children, cls }) => <span className={`badge-pill ${cls || "badge-blue"}`}>{children}</span>;
const SCard = ({ icon, num, label, color, change }) => (
  <div className="stat-card" style={{ "--stat-color": color, "--stat-bg": color + "22" }}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-info"><h3>{num}</h3><p>{label}</p>{change && <span className="stat-change up">{change}</span>}</div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function Dashboard({ session, onLogout, darkMode, toggleDark }) {
  const role    = session?.role || "Student";
  const allowed = role === "Admin" ? ADMIN_NAV : role === "Faculty" ? FACULTY_NAV : STUDENT_NAV;

  const [sec, setSec]           = useState("home");
  const [attTab, setAttTab]     = useState("student");
  const [time, setTime]         = useState(new Date());
  const [search, setSearch]     = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [confirm, setConfirm]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState(null);

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── DATA STATE ── */
  const [students, setStudents]     = useState([]);
  const [faculty,  setFaculty]      = useState([]);
  const [marks,    setMarks]        = useState({});   // { studentId: { subject: score } }
  const [feeRec,   setFeeRec]       = useState([]);   // [{ _id, studentId:{_id,name,course}, paid, total }]
  const [notices,  setNotices]      = useState([]);
  const [stuAtt,   setStuAtt]       = useState({});
  const [facAtt,   setFacAtt]       = useState({});
  const [attDate,  setAttDate]      = useState(new Date().toISOString().split("T")[0]);
  const [attSaved, setAttSaved]     = useState(false);
  const [attHistory, setAttHistory] = useState([]);
  const [payInp,   setPayInp]       = useState({});
  const [salRec,   setSalRec]       = useState([]);
  const today = new Date().toISOString().split("T")[0];

  /* ── LOAD ALL DATA FROM MONGODB ON MOUNT ── */
  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [stuData, facData, marksData, feeData, noticeData] = await Promise.all([
        studentAPI.getAll(),
        facultyAPI.getAll(),
        marksAPI.getAll(),
        feeAPI.getAll(),
        noticeAPI.getAll(),
      ]);

      setStudents(stuData);
      setFaculty(facData);
      setSalRec(facData.map(f => ({ fid: f._id, paid: false, month: "April", year: 2026 })));

      // Convert marks array → { studentId: { subject: score } }
      const marksMap = {};
      marksData.forEach(m => {
        const sid = m.studentId?._id || m.studentId;
        marksMap[sid] = m.subjects instanceof Map
          ? Object.fromEntries(m.subjects)
          : m.subjects;
      });
      setMarks(marksMap);

      setFeeRec(feeData);
      setNotices(noticeData);
    } catch (err) {
      showToast("Failed to load data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  /* ── GRADE HELPERS ── */
  const grade      = m => m >= 90 ? "A+" : m >= 80 ? "A" : m >= 70 ? "B" : m >= 60 ? "C" : m >= 50 ? "D" : "F";
  const gradeColor = m => m >= 80 ? "#34d399" : m >= 60 ? "#fcd34d" : "#fca5a5";

  /* ── FEE HELPERS ── */
  const getFeeForStudent = (studentId) => feeRec.find(r => {
    const sid = r.studentId?._id || r.studentId;
    return String(sid) === String(studentId);
  }) || { paid: 0, total: 80000 };

  const feeStatus = (paid, total) =>
    paid >= total  ? { l: "Paid",    c: "#34d399", b: "rgba(16,185,129,.15)" } :
    paid > 0       ? { l: "Partial", c: "#fcd34d", b: "rgba(245,158,11,.15)" } :
                     { l: "Unpaid",  c: "#fca5a5", b: "rgba(239,68,68,.15)"  };

  const addPayment = async (studentId, amt) => {
    try {
      const updated = await feeAPI.addPayment(studentId, Number(amt));
      setFeeRec(p => p.map(r => {
        const sid = r.studentId?._id || r.studentId;
        return String(sid) === String(studentId) ? { ...r, paid: updated.paid } : r;
      }));
      setPayInp(p => ({ ...p, [studentId]: "" }));
      showToast("Payment recorded ✅");
    } catch (err) { showToast(err.message, "error"); }
  };

  /* ── UNREAD NOTICES ── */
  const unread = notices.filter(n => !n.read).length;
  const [showBell, setShowBell] = useState(false);

  /* ── ADD / DELETE STUDENT ── */
  const [showAddS, setShowAddS] = useState(false);
  const [newS, setNewS] = useState({ name: "", course: "", year: "", status: "Active", phone: "", email: "" });
  const [profileStu, setProfileStu] = useState(null);

  const addStudent = async () => {
    if (!newS.name || !newS.course || !newS.year) return;
    try {
      const created = await studentAPI.create(newS);
      setStudents(p => [created, ...p]);
      // Reload fees to get new fee record
      const feeData = await feeAPI.getAll();
      setFeeRec(feeData);
      setNewS({ name: "", course: "", year: "", status: "Active", phone: "", email: "" });
      setShowAddS(false);
      showToast(`${created.name} added ✅`);
    } catch (err) { showToast(err.message, "error"); }
  };

  const delStudent = async (id) => {
    try {
      await studentAPI.delete(id);
      setStudents(p => p.filter(x => x._id !== id));
      setFeeRec(p => p.filter(r => {
        const sid = r.studentId?._id || r.studentId;
        return String(sid) !== String(id);
      }));
      showToast("Student deleted");
    } catch (err) { showToast(err.message, "error"); }
  };

  /* ── ADD / DELETE FACULTY ── */
  const [showAddF, setShowAddF] = useState(false);
  const [newF, setNewF] = useState({ name: "", dept: "", exp: "", salary: "" });

  const addFaculty = async () => {
    if (!newF.name || !newF.dept) return;
    try {
      const created = await facultyAPI.create({ ...newF, salary: Number(newF.salary) || 70000 });
      setFaculty(p => [created, ...p]);
      setSalRec(p => [...p, { fid: created._id, paid: false, month: "April", year: 2026 }]);
      setNewF({ name: "", dept: "", exp: "", salary: "" });
      setShowAddF(false);
      showToast(`${created.name} added ✅`);
    } catch (err) { showToast(err.message, "error"); }
  };

  const delFaculty = async (id) => {
    try {
      await facultyAPI.delete(id);
      setFaculty(p => p.filter(x => x._id !== id));
      setSalRec(p => p.filter(r => String(r.fid) !== String(id)));
      showToast("Faculty deleted");
    } catch (err) { showToast(err.message, "error"); }
  };

  /* ── NOTICES ── */
  const [newNotice, setNewNotice]         = useState({ title: "", date: today, category: "General", content: "" });
  const [showAddNotice, setShowAddNotice] = useState(false);

  const addNotice = async () => {
    if (!newNotice.title) return;
    try {
      const created = await noticeAPI.create({ ...newNotice, read: false });
      setNotices(p => [created, ...p]);
      setNewNotice({ title: "", date: today, category: "General", content: "" });
      setShowAddNotice(false);
      showToast("Notice posted ✅");
    } catch (err) { showToast(err.message, "error"); }
  };

  const markNoticeRead = async (id) => {
    try {
      await noticeAPI.markRead(id);
      setNotices(p => p.map(n => n._id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await noticeAPI.markAllRead();
      setNotices(p => p.map(n => ({ ...n, read: true })));
    } catch (err) { showToast(err.message, "error"); }
  };

  const delNotice = async (id) => {
    try {
      await noticeAPI.delete(id);
      setNotices(p => p.filter(n => n._id !== id));
      showToast("Notice deleted");
    } catch (err) { showToast(err.message, "error"); }
  };

  /* ── ATTENDANCE ── */
  const saveAttendance = async () => {
    try {
      const records = (attTab === "student" ? students : faculty).map(p => ({
        personId: p._id,
        status: (attTab === "student" ? stuAtt : facAtt)[p._id] || "A",
      }));
      await attendanceAPI.save(attDate, attTab, records);
      setAttSaved(true);
      const present = records.filter(r => r.status === "P").length;
      setAttHistory(prev => [{ date: attDate, present, absent: records.length - present }, ...prev.slice(0, 5)]);
      setTimeout(() => setAttSaved(false), 3000);
      showToast("Attendance saved ✅");
    } catch (err) { showToast(err.message, "error"); }
  };

  /* ── COURSES (local only) ── */
  const [courses, setCourses] = useState([
    { id: 1, name: "B.Tech Computer Science", dur: "4 Years", seats: 60, fee: "₹1,20,000/yr", status: "Active", desc: "Core engineering with software and hardware focus." },
    { id: 2, name: "MCA",                     dur: "2 Years", seats: 40, fee: "₹80,000/yr",   status: "Active", desc: "Advanced software development and applications." },
    { id: 3, name: "MBA",                     dur: "2 Years", seats: 50, fee: "₹90,000/yr",   status: "Active", desc: "Business administration with Finance & Marketing." },
    { id: 4, name: "M.Tech Electronics",      dur: "2 Years", seats: 30, fee: "₹1,00,000/yr", status: "Active", desc: "Advanced electronics and communication systems." },
    { id: 5, name: "BCA",                     dur: "3 Years", seats: 45, fee: "₹60,000/yr",   status: "Active", desc: "Bachelor of Computer Applications." },
    { id: 6, name: "B.Tech Mechanical",       dur: "4 Years", seats: 60, fee: "₹1,10,000/yr", status: "Active", desc: "Mechanical design and manufacturing." },
  ]);
  const [expCourse, setExpCourse] = useState(null);

  /* ── LIBRARY (local only) ── */
  const [books, setBooks] = useState([
    { id: 1, title: "Data Structures & Algorithms", author: "Cormen",      dept: "CSE",  total: 5, issued: 3, issuedTo: null },
    { id: 2, title: "Engineering Mathematics",       author: "B.S. Grewal", dept: "ALL",  total: 8, issued: 2, issuedTo: null },
    { id: 3, title: "Database Management Systems",   author: "Korth",       dept: "CSE",  total: 4, issued: 4, issuedTo: null },
    { id: 4, title: "Principles of Marketing",       author: "Kotler",      dept: "MBA",  total: 6, issued: 1, issuedTo: null },
    { id: 5, title: "Digital Electronics",           author: "Tocci",       dept: "ECE",  total: 5, issued: 2, issuedTo: null },
    { id: 6, title: "Thermodynamics",                author: "Cengel",      dept: "MECH", total: 4, issued: 0, issuedTo: null },
    { id: 7, title: "Fluid Mechanics",               author: "R.K. Bansal",  dept: "CIVIL",total: 3, issued: 1, issuedTo: null },
    { id: 8, title: "Python Programming",            author: "Mark Lutz",   dept: "CSE",  total: 6, issued: 5, issuedTo: null },
  ]);
  const [issueForm, setIssueForm] = useState({ bookId: "", studentId: "" });
  const issueBook = () => {
    const b = books.find(x => x.id === Number(issueForm.bookId));
    if (!b || b.issued >= b.total) { alert("Book not available!"); return; }
    setBooks(p => p.map(x => x.id === b.id ? { ...x, issued: x.issued + 1, issuedTo: issueForm.studentId } : x));
    setIssueForm({ bookId: "", studentId: "" });
  };
  const returnBook = (id) => setBooks(p => p.map(x => x.id === id && x.issued > 0 ? { ...x, issued: x.issued - 1, issuedTo: null } : x));

  /* ── HOSTEL (local only) ── */
  const [rooms] = useState([
    { id: 1, num: "A-101", type: "Double", cap: 2, occ: 2, fee: 8000,  students: ["Rahul Sharma", "Amit Verma"] },
    { id: 2, num: "A-102", type: "Double", cap: 2, occ: 1, fee: 8000,  students: ["Karan Singh"] },
    { id: 3, num: "B-201", type: "Single", cap: 1, occ: 1, fee: 12000, students: ["Rohan Joshi"] },
    { id: 4, num: "B-202", type: "Single", cap: 1, occ: 0, fee: 12000, students: [] },
    { id: 5, num: "C-301", type: "Triple", cap: 3, occ: 3, fee: 6000,  students: ["Vikas Yadav", "Pooja Desai", "Anjali Gupta"] },
    { id: 6, num: "C-302", type: "Triple", cap: 3, occ: 1, fee: 6000,  students: ["Sneha Patil"] },
  ]);

  /* ── ADMISSIONS (local only) ── */
  const [admissions, setAdmissions] = useState([
    { id: 1, name: "Aarav Sharma", course: "B.Tech", score: 92, status: "Approved", date: "2026-04-10" },
    { id: 2, name: "Diya Patel",   course: "MCA",    score: 88, status: "Approved", date: "2026-04-11" },
    { id: 3, name: "Yash Gupta",   course: "MBA",    score: 79, status: "Pending",  date: "2026-04-18" },
    { id: 4, name: "Riya Singh",   course: "BCA",    score: 74, status: "Pending",  date: "2026-04-19" },
    { id: 5, name: "Arjun Mehta",  course: "M.Tech", score: 85, status: "Approved", date: "2026-04-12" },
  ]);
  const [admForm, setAdmForm]         = useState({ name: "", course: "B.Tech", score: "", phone: "", email: "" });
  const [showAdmForm, setShowAdmForm] = useState(false);

  /* ── FEEDBACK (local only) ── */
  const [feedbacks, setFeedbacks] = useState([
    { id: 1, name: "Rahul Sharma", type: "Academic", msg: "Library hours should be extended.",  status: "Pending",  date: "2026-04-20" },
    { id: 2, name: "Priya Mehta",  type: "Facility", msg: "More computers needed in lab.",       status: "Resolved", date: "2026-04-18" },
    { id: 3, name: "Amit Verma",   type: "Academic", msg: "Extra doubt sessions would help.",    status: "Pending",  date: "2026-04-15" },
  ]);
  const [fbForm, setFbForm] = useState({ name: session?.name || "", type: "Academic", msg: "" });

  /* ── ACTIVITY LOG ── */
  const [activity] = useState([
    { msg: "Attendance marked for today", time: "2 min ago",  icon: "📋" },
    { msg: "Priya Mehta fee updated",     time: "1 hr ago",   icon: "💰" },
    { msg: "New notice: Exam Schedule",   time: "3 hrs ago",  icon: "📢" },
    { msg: "Rohan Joshi marks updated",   time: "1 day ago",  icon: "📝" },
    { msg: "New student Neha enrolled",   time: "2 days ago", icon: "🎓" },
  ]);

  /* ── CHARTS ── */
  const pieR = useRef(), doR = useRef(), attR = useRef(), grR = useRef();
  const piI  = useRef(), doI = useRef(), atI  = useRef(), grI = useRef();
  useEffect(() => {
    if (sec !== "analytics") return;
    const d = r => { if (r.current) { r.current.destroy(); r.current = null; } };
    setTimeout(() => {
      d(piI); d(doI); d(atI); d(grI);
      if (pieR.current) piI.current = new Chart(pieR.current, { type: "pie",      data: { labels: ["Students","Faculty"], datasets: [{ data: [students.length, faculty.length], backgroundColor: ["#2563eb","#7c3aed"], borderWidth: 2 }] }, options: { plugins: { legend: { labels: { color: "rgba(255,255,255,.6)" } } } } });
      if (doR.current)  doI.current = new Chart(doR.current,  { type: "doughnut", data: { labels: ["B.Tech","M.Tech","BCA","MCA","MBA"], datasets: [{ data: [5,3,4,2,3], backgroundColor: ["#2563eb","#f59e0b","#7c3aed","#10b981","#06b6d4"], borderWidth: 2 }] }, options: { plugins: { legend: { labels: { color: "rgba(255,255,255,.6)" } } } } });
      if (attR.current) atI.current = new Chart(attR.current,  { type: "bar",      data: { labels: ["Mon","Tue","Wed","Thu","Fri","Sat"], datasets: [{ label: "Present", data: [92,88,95,87,90,78], backgroundColor: "rgba(37,99,235,.7)", borderRadius: 6 }, { label: "Absent", data: [8,12,5,13,10,22], backgroundColor: "rgba(239,68,68,.5)", borderRadius: 6 }] }, options: { responsive: true, plugins: { legend: { labels: { color: "rgba(255,255,255,.6)" } } }, scales: { x: { ticks: { color: "rgba(255,255,255,.4)" }, grid: { color: "rgba(255,255,255,.05)" } }, y: { ticks: { color: "rgba(255,255,255,.4)" }, grid: { color: "rgba(255,255,255,.05)" } } } } });
      if (grR.current)  grI.current = new Chart(grR.current,   { type: "line",     data: { labels: ["Jan","Feb","Mar","Apr","May","Jun"], datasets: [{ label: "Avg Grade %", data: [72,75,70,80,78,85], borderColor: "#7c3aed", backgroundColor: "rgba(124,58,237,.15)", fill: true, tension: .4, pointBackgroundColor: "#7c3aed" }] }, options: { responsive: true, plugins: { legend: { labels: { color: "rgba(255,255,255,.6)" } } }, scales: { x: { ticks: { color: "rgba(255,255,255,.4)" }, grid: { color: "rgba(255,255,255,.05)" } }, y: { ticks: { color: "rgba(255,255,255,.4)" }, grid: { color: "rgba(255,255,255,.05)" } } } } });
    }, 60);
    return () => { d(piI); d(doI); d(atI); d(grI); };
  }, [sec, students.length, faculty.length]);

  /* ── SEARCH ── */
  const searchResults = search.length > 1 ? [
    ...students.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).map(s => ({ type: "Student", label: s.name, sub: s.course, action: () => { setSec("students"); setSearch(""); setShowSearch(false); } })),
    ...faculty.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).map(f  => ({ type: "Faculty", label: f.name, sub: f.dept,   action: () => { setSec("faculty");  setSearch(""); setShowSearch(false); } })),
    ...notices.filter(n => n.title.toLowerCase().includes(search.toLowerCase())).map(n => ({ type: "Notice",  label: n.title, sub: n.date,  action: () => { setSec("notices");  setSearch(""); setShowSearch(false); } })),
  ] : [];

  /* ── TIMETABLE ── */
  const ttRows = [
    { time: "9:00–10:00",  mon: "Mathematics",  tue: "Physics",      wed: "C Programming", thu: "Mathematics",  fri: "Electronics" },
    { time: "10:00–11:00", mon: "C Programming", tue: "Mathematics",  wed: "Physics",       thu: "Electronics",  fri: "Mathematics" },
    { time: "11:30–12:30", mon: "Physics",       tue: "Electronics",  wed: "Chemistry",     thu: "C Programming",fri: "Physics" },
    { time: "12:30–1:30",  mon: "Chemistry",     tue: "Chemistry",    wed: "Electronics",   thu: "Chemistry",    fri: "Chemistry" },
    { time: "1:30–2:30",   mon: "🍽 Lunch",      tue: "🍽 Lunch",     wed: "🍽 Lunch",      thu: "🍽 Lunch",     fri: "🍽 Lunch",     isBreak: true },
    { time: "2:30–3:30",   mon: "Lab Session",   tue: "Project Work", wed: "Lab Session",   thu: "Seminar",      fri: "Project Work" },
    { time: "3:30–4:30",   mon: "Project Work",  tue: "Lab Session",  wed: "Seminar",       thu: "Lab Session",  fri: "Lab Session" },
    { time: "4:30–5:00",   mon: "Extra Class",   tue: "Extra Class",  wed: "Extra Class",   thu: "Extra Class",  fri: "Extra Class" },
  ];
  const subBg = s =>
    s.includes("Lunch") || s.includes("🍽") ? "rgba(245,158,11,.15)" :
    s.includes("Lab")                        ? "rgba(16,185,129,.12)" :
    s.includes("Project")                    ? "rgba(124,58,237,.12)" :
    s.includes("Seminar")                    ? "rgba(6,182,212,.12)"  :
                                               "rgba(37,99,235,.08)";

  /* ── CONFIRM DIALOG ── */
  const ask = (msg, fn) => setConfirm({ msg, fn });
  const Confirm = () => confirm ? (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: 28, maxWidth: 360, width: "90%", boxShadow: "0 25px 60px rgba(0,0,0,.6)" }}>
        <div style={{ fontSize: "1.8rem", marginBottom: 12, textAlign: "center" }}>⚠️</div>
        <p style={{ color: "#f8fafc", fontWeight: 600, textAlign: "center", margin: "0 0 8px", fontSize: "1rem" }}>Are you sure?</p>
        <p style={{ color: "rgba(255,255,255,.5)", textAlign: "center", fontSize: ".88rem", margin: "0 0 20px" }}>{confirm.msg}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { confirm.fn(); setConfirm(null); }} style={{ ...G("linear-gradient(135deg,#ef4444,#dc2626)"), flex: 1 }}>Yes, Delete</button>
          <button onClick={() => setConfirm(null)} style={{ ...xBtn, flex: 1, textAlign: "center" }}>Cancel</button>
        </div>
      </div>
    </div>
  ) : null;

  /* ── TOAST ── */
  const Toast = () => toast ? (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: toast.type === "error" ? "rgba(239,68,68,.9)" : "rgba(16,185,129,.9)", color: "#fff", borderRadius: 12, padding: "12px 20px", fontSize: ".88rem", fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,.4)", animation: "fadeUp .3s ease" }}>
      {toast.type === "error" ? "❌ " : "✅ "}{toast.msg}
    </div>
  ) : null;

  /* ── LOADING OVERLAY ── */
  const Loading = () => loading ? (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998, backdropFilter: "blur(4px)" }}>
      <div style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 600 }}>⏳ Loading from MongoDB…</div>
    </div>
  ) : null;

  /* ── STUDENT PROFILE MODAL ── */
  const Profile = () => {
    if (!profileStu) return null;
    const s     = profileStu;
    const fee   = getFeeForStudent(s._id);
    const total = fee.total || feeAmt[s.course] || 80000;
    const pct   = Math.round((fee.paid / total) * 100);
    const sm    = marks[s._id] || {};
    const subj  = Object.keys(sm);
    const avg   = subj.length ? Math.round(subj.reduce((a, k) => a + sm[k], 0) / subj.length) : 0;
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998, backdropFilter: "blur(6px)", overflowY: "auto", padding: 20 }}>
        <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,.1)", borderRadius: 20, width: "100%", maxWidth: 580, boxShadow: "0 25px 60px rgba(0,0,0,.6)" }}>
          <div style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)", borderRadius: "20px 20px 0 0", padding: "28px 28px 20px", position: "relative" }}>
            <button onClick={() => setProfileStu(null)} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", fontWeight: 700, color: "#fff", border: "3px solid rgba(255,255,255,.3)" }}>{s.name.charAt(0)}</div>
              <div>
                <h3 style={{ color: "#fff", margin: "0 0 4px", fontFamily: "Playfair Display,serif", fontSize: "1.2rem" }}>{s.name}</h3>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Badge cls={courseBadge(s.course)}>{s.course}</Badge>
                  <Badge cls="badge-green">{s.year} Year</Badge>
                  <Badge cls="badge-blue">{s.status}</Badge>
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[["📧 Email", s.email || "—"], ["📱 Phone", s.phone || "—"]].map(([l, v]) => (
                <div key={l} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ fontSize: ".7rem", color: "rgba(255,255,255,.4)", marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: ".85rem", color: "#f8fafc", fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
              {[["📊 Avg Marks", `${avg}%`, avg >= 60 ? "#34d399" : "#fca5a5"], ["📋 Attendance", "85%", "#34d399"], ["💰 Fee Paid", `${pct}%`, "#fcd34d"]].map(([l, v, c]) => (
                <div key={l} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: ".68rem", color: "rgba(255,255,255,.4)", marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700, color: c, fontFamily: "Playfair Display,serif" }}>{v}</div>
                </div>
              ))}
            </div>
            {subj.length > 0 && (
              <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: ".8rem", fontWeight: 600, color: "rgba(255,255,255,.6)", marginBottom: 10 }}>📝 Subject-wise Marks</div>
                {subj.map(k => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: ".78rem", color: "rgba(255,255,255,.55)", width: 160, flexShrink: 0 }}>{k.replace(/_/g, " ")}</div>
                    <div style={{ flex: 1, background: "rgba(255,255,255,.06)", borderRadius: 20, height: 8, overflow: "hidden" }}>
                      <div style={{ width: `${sm[k]}%`, height: "100%", background: gradeColor(sm[k]), borderRadius: 20, transition: "width .5s" }}></div>
                    </div>
                    <div style={{ fontSize: ".78rem", fontWeight: 600, color: gradeColor(sm[k]), width: 32, textAlign: "right" }}>{sm[k]}</div>
                    <div style={{ fontSize: ".7rem", color: "rgba(255,255,255,.3)", width: 20 }}>{grade(sm[k])}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════
     SECTION RENDERERS
     ══════════════════════════════════════════════════════════════ */
  const PH = ({ t, s }) => (
    <div style={{ marginBottom: 20 }}>
      <div className="section-title">{t}</div>
      <p className="section-subtitle">{s}</p>
    </div>
  );

  /* ── HOME ── */
  const showHome = () => (
    <div>
      <div className="hero-banner text-white mb-4">
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <img src="./cyber-vidya-logo.png" alt="logo" style={{ height: 52, objectFit: "contain", filter: "drop-shadow(0 2px 10px rgba(255,255,255,.3))" }} onError={e => e.target.style.display = "none"} />
          <div style={{ width: 2, height: 44, background: "rgba(255,255,255,.2)", borderRadius: 2 }}></div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.6rem" }}>Welcome, {session.name}!</h2>
            <p className="lead" style={{ margin: 0 }}>G.H. Raisoni College · {role} Dashboard</p>
          </div>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 20, padding: "4px 14px", fontSize: ".78rem", color: "#fff" }}>
          {role === "Admin" ? "🛡 Admin Access" : role === "Faculty" ? "👨‍🏫 Faculty Access" : "🎓 Student Access"}
        </span>
      </div>
      {role === "Admin" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
          <SCard icon="🎓" num={students.length} label="Total Students"  color="#2563eb" change="↑ +8% semester" />
          <SCard icon="👨‍🏫" num={faculty.length}  label="Faculty Members" color="#10b981" change="Active staff" />
          <SCard icon="📚" num={courses.length}  label="Courses Offered" color="#7c3aed" change="Active programs" />
          <SCard icon="🏆" num="96%"             label="Placement Rate"  color="#f59e0b" change="↑ Best year" />
        </div>
      )}
      {role === "Admin" && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: ".72rem", textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255,255,255,.3)", fontWeight: 600, marginBottom: 10 }}>⚡ Quick Actions</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { l: "➕ Add Student",     fn: () => { setSec("students");   setShowAddS(true); } },
              { l: "📋 Mark Attendance", fn: () => setSec("attendance") },
              { l: "📢 Add Notice",      fn: () => { setSec("notices");    setShowAddNotice(true); } },
              { l: "📝 Enter Marks",     fn: () => setSec("marks") },
              { l: "🎓 Admissions",      fn: () => setSec("admission") },
            ].map(({ l, fn }) => (
              <button key={l} onClick={fn} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "9px 16px", fontSize: ".82rem", color: "rgba(255,255,255,.7)", cursor: "pointer", fontWeight: 500, transition: "all .2s" }}
                onMouseEnter={e => e.target.style.background = "rgba(37,99,235,.2)"}
                onMouseLeave={e => e.target.style.background = "rgba(255,255,255,.06)"}>{l}</button>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: role === "Admin" ? "2fr 1fr" : "1fr", gap: 16 }}>
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 14 }}>
            {[
              { icon: "🎯", title: "Quality Education", desc: "World-class academic programs.",  bg: "linear-gradient(135deg,#1d4ed8,#2563eb)" },
              { icon: "🌍", title: "Global Vision",     desc: "Preparing global leaders.",       bg: "linear-gradient(135deg,#065f46,#10b981)" },
              { icon: "💡", title: "Innovation",        desc: "Creativity and research.",        bg: "linear-gradient(135deg,#92400e,#f59e0b)" },
            ].map((c, i) => (
              <div key={i} className="dashboard-card" style={{ background: c.bg, padding: "22px 18px", textAlign: "center", color: "#fff", borderRadius: 14 }}>
                <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>{c.icon}</div>
                <h4 style={{ fontFamily: "Playfair Display,serif", fontWeight: 700, fontSize: "1rem", marginBottom: 6, color: "#fff" }}>{c.title}</h4>
                <p style={{ fontSize: ".82rem", opacity: .88, lineHeight: 1.6, margin: 0, color: "#fff" }}>{c.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="info-card"><h4>🎯 Our Mission</h4><p>Nurture talent through quality education, preparing students to excel globally.</p></div>
            <div className="info-card"><h4>🌟 Our Vision</h4><p>Recognized globally as a premier institution shaping future leaders.</p></div>
          </div>
        </div>
        {role === "Admin" && (
          <div style={{ background: "var(--navy-card)", border: "1px solid var(--navy-border)", borderRadius: 14, padding: 18 }}>
            <div style={{ fontFamily: "Playfair Display,serif", fontWeight: 700, fontSize: ".95rem", color: "var(--text-primary)", marginBottom: 14 }}>🕐 Recent Activity</div>
            {activity.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: i < activity.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(37,99,235,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".9rem", flexShrink: 0 }}>{a.icon}</div>
                <div>
                  <div style={{ fontSize: ".82rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{a.msg}</div>
                  <div style={{ fontSize: ".68rem", color: "rgba(255,255,255,.25)", marginTop: 3 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  /* ── ANALYTICS ── */
  const showAnalytics = () => (
    <div>
      <PH t="Analytics & Charts" s="Real-time insights into college performance" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <SCard icon="🎓" num={students.length} label="Total Students" color="#2563eb" />
        <SCard icon="👨‍🏫" num={faculty.length}  label="Faculty"        color="#10b981" />
        <SCard icon="💰" num={"₹" + (feeRec.reduce((a, r) => a + (r.paid || 0), 0) / 100000).toFixed(1) + "L"} label="Fees Collected" color="#f59e0b" />
        <SCard icon="📋" num="89%" label="Avg Attendance" color="#7c3aed" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="chart-card"><p className="chart-card-title">👥 Students vs Faculty</p><canvas ref={pieR}></canvas></div>
        <div className="chart-card"><p className="chart-card-title">📊 Course Distribution</p><canvas ref={doR}></canvas></div>
        <div className="chart-card"><p className="chart-card-title">📋 Weekly Attendance Trend</p><canvas ref={attR}></canvas></div>
        <div className="chart-card"><p className="chart-card-title">📈 Grade Performance Trend</p><canvas ref={grR}></canvas></div>
      </div>
      {attHistory.length > 0 && (
        <div className="table-card" style={{ marginTop: 20 }}>
          <div className="table-card-header"><h5>📅 Recent Attendance Summary</h5></div>
          <table className="table">
            <thead><tr><th>Date</th><th>Present</th><th>Absent</th><th>Attendance %</th></tr></thead>
            <tbody>
              {attHistory.map((h, i) => (
                <tr key={i}>
                  <td>{h.date}</td>
                  <td><span className="badge-pill badge-green">{h.present}</span></td>
                  <td><span className="badge-pill" style={{ background: "rgba(239,68,68,.15)", color: "#fca5a5" }}>{h.absent}</span></td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, background: "rgba(255,255,255,.06)", borderRadius: 20, height: 6, overflow: "hidden" }}>
                        <div style={{ width: `${Math.round(h.present / (h.present + h.absent) * 100)}%`, height: "100%", background: "#10b981", borderRadius: 20 }}></div>
                      </div>
                      <span style={{ fontSize: ".78rem", color: "#34d399" }}>{Math.round(h.present / (h.present + h.absent) * 100)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  /* ── STUDENTS ── */
  const showStudents = () => (
    <div>
      <PH t="Students" s="Manage and view enrolled students" />
      <div className="table-card">
        <div className="table-card-header">
          <h5>🎓 Student Records ({students.length})</h5>
          {role === "Admin" && <button onClick={() => setShowAddS(!showAddS)} style={G("linear-gradient(135deg,#2563eb,#7c3aed)")}>➕ Add Student</button>}
        </div>
        {showAddS && (
          <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,.07)", background: "rgba(37,99,235,.05)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            {[["Name","text",newS.name,v=>setNewS({...newS,name:v}),"200px"],["Phone","text",newS.phone,v=>setNewS({...newS,phone:v}),"130px"],["Email","email",newS.email,v=>setNewS({...newS,email:v}),"200px"]].map(([l,t,v,fn,w]) => (
              <div key={l}><label style={lbl}>{l}</label><input type={t} placeholder={l} value={v} onChange={e => fn(e.target.value)} style={I(w)} /></div>
            ))}
            <div><label style={lbl}>Course</label>
              <select value={newS.course} onChange={e => setNewS({ ...newS, course: e.target.value })} style={I()}>
                <option value="">Select</option><option>B.Tech</option><option>M.Tech</option><option>MCA</option><option>MBA</option><option>BCA</option>
              </select></div>
            <div><label style={lbl}>Year</label>
              <select value={newS.year} onChange={e => setNewS({ ...newS, year: e.target.value })} style={I("100px")}>
                <option value="">Select</option><option>1st</option><option>2nd</option><option>3rd</option><option>4th</option>
              </select></div>
            <div style={{ display: "flex", gap: 8 }}><button onClick={addStudent} style={sBtn}>✔ Save</button><button onClick={() => setShowAddS(false)} style={xBtn}>✖</button></div>
          </div>
        )}
        <table className="table">
          <thead><tr><th>#</th><th>Name</th><th>Course</th><th>Year</th><th>Contact</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={s._id}>
                <td style={{ color: "rgba(255,255,255,.3)" }}>{i + 1}</td>
                <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}>{Av(s.name)}<button onClick={() => setProfileStu(s)} style={{ background: "none", border: "none", color: "#93c5fd", cursor: "pointer", fontSize: ".88rem", fontWeight: 600, padding: 0 }}>{s.name}</button></div></td>
                <td><Badge cls={courseBadge(s.course)}>{s.course}</Badge></td>
                <td>{s.year}</td>
                <td style={{ fontSize: ".78rem", color: "rgba(255,255,255,.4)" }}>{s.phone}</td>
                <td><Badge cls="badge-green">{s.status}</Badge></td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setProfileStu(s)} style={{ ...G("rgba(37,99,235,.15)", "#93c5fd"), border: "1px solid rgba(37,99,235,.2)", padding: "4px 10px", fontSize: ".75rem" }}>👁 View</button>
                    {role === "Admin" && <button onClick={() => ask(`Delete ${s.name}? This cannot be undone.`, () => delStudent(s._id))} style={{ ...dBtn, padding: "4px 10px" }}>🗑</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ── FACULTY ── */
  const showFaculty = () => (
    <div>
      <PH t="Faculty" s="Teaching staff directory" />
      <div className="table-card">
        <div className="table-card-header">
          <h5>👨‍🏫 Faculty Members ({faculty.length})</h5>
          {role === "Admin" && <button onClick={() => setShowAddF(!showAddF)} style={G("linear-gradient(135deg,#10b981,#065f46)")}>➕ Add Faculty</button>}
        </div>
        {showAddF && (
          <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,.07)", background: "rgba(16,185,129,.05)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div><label style={lbl}>Name</label><input placeholder="Name" value={newF.name} onChange={e => setNewF({ ...newF, name: e.target.value })} style={I()} /></div>
            <div><label style={lbl}>Department</label><input placeholder="Department" value={newF.dept} onChange={e => setNewF({ ...newF, dept: e.target.value })} style={I("180px")} /></div>
            <div><label style={lbl}>Experience</label><input placeholder="e.g. 5 yrs" value={newF.exp} onChange={e => setNewF({ ...newF, exp: e.target.value })} style={I("100px")} /></div>
            <div><label style={lbl}>Salary (₹)</label><input placeholder="80000" value={newF.salary} onChange={e => setNewF({ ...newF, salary: e.target.value })} style={I("110px")} /></div>
            <div style={{ display: "flex", gap: 8 }}><button onClick={addFaculty} style={sBtn}>✔ Save</button><button onClick={() => setShowAddF(false)} style={xBtn}>✖</button></div>
          </div>
        )}
        <table className="table">
          <thead><tr><th>#</th><th>Name</th><th>Department</th><th>Experience</th><th>Salary</th>{role === "Admin" && <th>Action</th>}</tr></thead>
          <tbody>
            {faculty.map((f, i) => (
              <tr key={f._id}>
                <td style={{ color: "rgba(255,255,255,.3)" }}>{i + 1}</td>
                <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}>{Av(f.name, "linear-gradient(135deg,#10b981,#065f46)")}{f.name}</div></td>
                <td>{f.dept}</td>
                <td><Badge cls="badge-green">{f.exp}</Badge></td>
                <td style={{ color: "#fcd34d", fontWeight: 600 }}>₹{f.salary?.toLocaleString()}</td>
                {role === "Admin" && <td><button onClick={() => ask(`Delete ${f.name}?`, () => delFaculty(f._id))} style={dBtn}>🗑 Delete</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ── MARKS ── */
  const showMarks = () => (
    <div>
      <PH t="Marks & Results" s="Subject-wise marks and grade management" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {(() => {
          const all  = students.flatMap(s => Object.values(marks[s._id] || {}));
          const avg  = all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : 0;
          const pass = students.filter(s => { const vs = Object.values(marks[s._id] || {}); return vs.length && vs.every(v => v >= 40); }).length;
          return [
            { icon: "📊", num: `${avg}%`, label: "Class Average",   color: "#2563eb" },
            { icon: "✅", num: pass,       label: "Passed",          color: "#10b981" },
            { icon: "❌", num: students.length - pass, label: "Failed", color: "#ef4444" },
            { icon: "🏆", num: students.filter(s => { const vs = Object.values(marks[s._id] || {}); return vs.length && vs.every(v => v >= 80); }).length, label: "Distinction", color: "#f59e0b" },
          ].map((sc, i) => <SCard key={i} {...sc} />);
        })()}
      </div>
      <div className="table-card">
        <div className="table-card-header"><h5>📝 Student Marks</h5></div>
        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ minWidth: 700 }}>
            <thead>
              <tr><th>Student</th><th>Course</th><th style={{ textAlign: "center" }}>Avg</th><th style={{ textAlign: "center" }}>Grade</th><th style={{ textAlign: "center" }}>Result</th><th>Subject Breakdown</th></tr>
            </thead>
            <tbody>
              {students.map(s => {
                const sm   = marks[s._id] || {};
                const vs   = Object.values(sm);
                const avg  = vs.length ? Math.round(vs.reduce((a, b) => a + b, 0) / vs.length) : 0;
                const pass = vs.length && vs.every(v => v >= 40);
                return (
                  <tr key={s._id}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}>{Av(s.name)}{s.name}</div></td>
                    <td><Badge cls={courseBadge(s.course)}>{s.course}</Badge></td>
                    <td style={{ textAlign: "center", fontWeight: 700, color: gradeColor(avg) }}>{avg}%</td>
                    <td style={{ textAlign: "center" }}><span style={{ fontWeight: 700, fontSize: "1.1rem", color: gradeColor(avg) }}>{grade(avg)}</span></td>
                    <td style={{ textAlign: "center" }}><span className="badge-pill" style={{ background: pass ? "rgba(16,185,129,.15)" : "rgba(239,68,68,.15)", color: pass ? "#34d399" : "#fca5a5" }}>{pass ? "✅ Pass" : "❌ Fail"}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {Object.entries(sm).map(([k, v]) => (
                          <span key={k} style={{ fontSize: ".7rem", background: `${gradeColor(v)}22`, color: gradeColor(v), border: `1px solid ${gradeColor(v)}44`, borderRadius: 6, padding: "2px 7px" }}>{k.replace(/_/g, " ")}: {v}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  /* ── LIBRARY ── */
  const showLibrary = () => (
    <div>
      <PH t="Library" s="Book inventory, issue and return management" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <SCard icon="📚" num={books.length}                                    label="Total Books"  color="#2563eb" />
        <SCard icon="✅" num={books.reduce((a, b) => a + (b.total - b.issued), 0)} label="Available" color="#10b981" />
        <SCard icon="📖" num={books.reduce((a, b) => a + b.issued, 0)}         label="Issued"       color="#f59e0b" />
        <SCard icon="⚠️" num={books.filter(b => b.issued >= b.total).length}   label="Out of Stock" color="#ef4444" />
      </div>
      {role === "Admin" && (
        <div className="table-card" style={{ marginBottom: 16 }}>
          <div className="table-card-header"><h5>📖 Issue a Book</h5></div>
          <div style={{ padding: "16px 24px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div><label style={lbl}>Select Book</label>
              <select value={issueForm.bookId} onChange={e => setIssueForm({ ...issueForm, bookId: e.target.value })} style={I("200px")}>
                <option value="">Choose book</option>
                {books.filter(b => b.issued < b.total).map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select></div>
            <div><label style={lbl}>Select Student</label>
              <select value={issueForm.studentId} onChange={e => setIssueForm({ ...issueForm, studentId: e.target.value })} style={I("180px")}>
                <option value="">Choose student</option>
                {students.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select></div>
            <button onClick={issueBook} style={sBtn}>📤 Issue Book</button>
          </div>
        </div>
      )}
      <div className="table-card">
        <div className="table-card-header"><h5>📚 Book Inventory</h5></div>
        <table className="table">
          <thead><tr><th>#</th><th>Title</th><th>Author</th><th>Dept</th><th>Total</th><th>Issued</th><th>Available</th><th>Status</th>{role === "Admin" && <th>Action</th>}</tr></thead>
          <tbody>
            {books.map((b, i) => {
              const avail = b.total - b.issued;
              return (
                <tr key={b.id}>
                  <td style={{ color: "rgba(255,255,255,.3)" }}>{i + 1}</td>
                  <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{b.title}</td>
                  <td style={{ color: "rgba(255,255,255,.5)" }}>{b.author}</td>
                  <td><Badge cls="badge-blue">{b.dept}</Badge></td>
                  <td>{b.total}</td>
                  <td style={{ color: "#fcd34d" }}>{b.issued}</td>
                  <td style={{ color: avail > 0 ? "#34d399" : "#fca5a5", fontWeight: 600 }}>{avail}</td>
                  <td><span className="badge-pill" style={{ background: avail > 0 ? "rgba(16,185,129,.15)" : "rgba(239,68,68,.15)", color: avail > 0 ? "#34d399" : "#fca5a5" }}>{avail > 0 ? "Available" : "Out of Stock"}</span></td>
                  {role === "Admin" && <td>{b.issued > 0 ? <button onClick={() => returnBook(b.id)} style={{ ...G("rgba(16,185,129,.15)", "#34d399"), border: "1px solid rgba(16,185,129,.2)", padding: "4px 12px", fontSize: ".75rem" }}>↩ Return</button> : <span style={{ color: "rgba(255,255,255,.2)", fontSize: ".75rem" }}>—</span>}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ── HOSTEL ── */
  const showHostel = () => (
    <div>
      <PH t="Hostel Management" s="Room allotment and occupancy" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <SCard icon="🏠" num={rooms.length}                            label="Total Rooms"    color="#2563eb" />
        <SCard icon="👤" num={rooms.reduce((a, r) => a + r.occ, 0)}   label="Occupied Beds"  color="#10b981" />
        <SCard icon="🛏" num={rooms.reduce((a, r) => a + (r.cap - r.occ), 0)} label="Vacant Beds" color="#7c3aed" />
        <SCard icon="💰" num={"₹" + rooms.reduce((a, r) => a + r.fee * r.occ, 0).toLocaleString()} label="Monthly Revenue" color="#f59e0b" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {rooms.map(r => {
          const pct  = Math.round((r.occ / r.cap) * 100);
          const full = r.occ >= r.cap;
          return (
            <div key={r.id} style={{ background: "var(--navy-card)", border: `1px solid ${full ? "rgba(239,68,68,.3)" : "rgba(255,255,255,.07)"}`, borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div><div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: ".95rem" }}>Room {r.num}</div>
                  <div style={{ fontSize: ".75rem", color: "rgba(255,255,255,.4)", marginTop: 2 }}>{r.type} · ₹{r.fee}/mo</div></div>
                <span className="badge-pill" style={{ background: full ? "rgba(239,68,68,.15)" : r.occ > 0 ? "rgba(245,158,11,.15)" : "rgba(16,185,129,.15)", color: full ? "#fca5a5" : r.occ > 0 ? "#fcd34d" : "#34d399" }}>{full ? "Full" : r.occ > 0 ? "Partial" : "Vacant"}</span>
              </div>
              <div style={{ background: "rgba(255,255,255,.06)", borderRadius: 20, height: 6, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ width: `${pct}%`, height: "100%", background: full ? "#ef4444" : r.occ > 0 ? "#f59e0b" : "#10b981", borderRadius: 20 }}></div>
              </div>
              <div style={{ fontSize: ".78rem", color: "rgba(255,255,255,.4)", marginBottom: 8 }}>{r.occ}/{r.cap} beds occupied</div>
              {r.students.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {r.students.map(st => <span key={st} style={{ fontSize: ".72rem", background: "rgba(37,99,235,.1)", color: "#93c5fd", border: "1px solid rgba(37,99,235,.2)", borderRadius: 6, padding: "2px 8px" }}>{st}</span>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── ATTENDANCE ── */
  const showAttendance = () => (
    <div>
      <PH t="Attendance" s="Mark and track daily attendance" />
      {role !== "Student" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["student", "faculty"].map(t => (
            <button key={t} onClick={() => { setAttTab(t); setAttSaved(false); }} style={{ padding: "10px 28px", borderRadius: 10, fontSize: ".88rem", fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "DM Sans,sans-serif", background: attTab === t ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "rgba(255,255,255,.06)", color: attTab === t ? "#fff" : "rgba(255,255,255,.4)" }}>
              {t === "student" ? "🎓 Student Attendance" : "👨‍🏫 Faculty Attendance"}
            </button>
          ))}
        </div>
      )}
      <div className="table-card">
        <div className="table-card-header">
          <h5>{attTab === "student" ? "🎓 Student" : "👨‍🏫 Faculty"} Attendance</h5>
          {role !== "Student" && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} style={{ ...I("150px"), padding: "7px 12px" }} />
              <button onClick={saveAttendance} style={sBtn}>💾 Save to DB</button>
            </div>
          )}
        </div>
        {attSaved && <div style={{ padding: "12px 24px", background: "rgba(16,185,129,.1)", borderBottom: "1px solid rgba(16,185,129,.2)", color: "#34d399", fontSize: ".85rem", fontWeight: 500 }}>✅ Attendance saved to MongoDB for {attDate}</div>}
        {(attTab === "student" || role === "Student") ? (
          <table className="table">
            <thead><tr><th>#</th><th>Student</th><th>Course</th><th>Year</th><th style={{ textAlign: "center" }}>Present</th><th style={{ textAlign: "center" }}>Absent</th><th style={{ textAlign: "center" }}>Status</th></tr></thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s._id}>
                  <td style={{ color: "rgba(255,255,255,.3)" }}>{i + 1}</td>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}>{Av(s.name)}{s.name}</div></td>
                  <td><Badge cls={courseBadge(s.course)}>{s.course}</Badge></td>
                  <td>{s.year}</td>
                  <td style={{ textAlign: "center" }}><input type="radio" name={`s-${s._id}`} disabled={role === "Student"} checked={stuAtt[s._id] === "P"} onChange={() => setStuAtt(p => ({ ...p, [s._id]: "P" }))} style={{ accentColor: "#10b981", width: 18, height: 18 }} /></td>
                  <td style={{ textAlign: "center" }}><input type="radio" name={`s-${s._id}`} disabled={role === "Student"} checked={stuAtt[s._id] === "A"} onChange={() => setStuAtt(p => ({ ...p, [s._id]: "A" }))} style={{ accentColor: "#ef4444", width: 18, height: 18 }} /></td>
                  <td style={{ textAlign: "center" }}>
                    {stuAtt[s._id] === "P" && <Badge cls="badge-green">Present</Badge>}
                    {stuAtt[s._id] === "A" && <span className="badge-pill" style={{ background: "rgba(239,68,68,.15)", color: "#fca5a5" }}>Absent</span>}
                    {!stuAtt[s._id] && <span style={{ color: "rgba(255,255,255,.2)", fontSize: ".78rem" }}>Not marked</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="table">
            <thead><tr><th>#</th><th>Faculty</th><th>Department</th><th style={{ textAlign: "center" }}>Present</th><th style={{ textAlign: "center" }}>Absent</th><th style={{ textAlign: "center" }}>Status</th></tr></thead>
            <tbody>
              {faculty.map((f, i) => (
                <tr key={f._id}>
                  <td style={{ color: "rgba(255,255,255,.3)" }}>{i + 1}</td>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}>{Av(f.name, "linear-gradient(135deg,#10b981,#065f46)")}{f.name}</div></td>
                  <td>{f.dept}</td>
                  <td style={{ textAlign: "center" }}><input type="radio" name={`f-${f._id}`} checked={facAtt[f._id] === "P"} onChange={() => setFacAtt(p => ({ ...p, [f._id]: "P" }))} style={{ accentColor: "#10b981", width: 18, height: 18 }} /></td>
                  <td style={{ textAlign: "center" }}><input type="radio" name={`f-${f._id}`} checked={facAtt[f._id] === "A"} onChange={() => setFacAtt(p => ({ ...p, [f._id]: "A" }))} style={{ accentColor: "#ef4444", width: 18, height: 18 }} /></td>
                  <td style={{ textAlign: "center" }}>
                    {facAtt[f._id] === "P" && <Badge cls="badge-green">Present</Badge>}
                    {facAtt[f._id] === "A" && <span className="badge-pill" style={{ background: "rgba(239,68,68,.15)", color: "#fca5a5" }}>Absent</span>}
                    {!facAtt[f._id] && <span style={{ color: "rgba(255,255,255,.2)", fontSize: ".78rem" }}>Not marked</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  /* ── COURSES ── */
  const showCourses = () => (
    <div>
      <PH t="Courses" s="Academic programs offered by the college" />
      <div className="table-card">
        <div className="table-card-header"><h5>📚 All Courses ({courses.length})</h5></div>
        <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {courses.map(c => (
            <div key={c.id} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div><div style={{ fontWeight: 700, color: "#f8fafc", fontSize: ".92rem", marginBottom: 4 }}>{c.name}</div><Badge cls="badge-green">{c.status}</Badge></div>
                {role === "Admin" && <button onClick={() => ask(`Delete course: ${c.name}?`, () => setCourses(p => p.filter(x => x.id !== c.id)))} style={{ ...dBtn, padding: "3px 8px" }}>🗑</button>}
              </div>
              <p style={{ color: "rgba(255,255,255,.4)", fontSize: ".82rem", margin: "0 0 10px", lineHeight: 1.6 }}>{c.desc}</p>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontSize: ".78rem", color: "rgba(255,255,255,.4)" }}>⏱ {c.dur}</span>
                <span style={{ fontSize: ".78rem", color: "rgba(255,255,255,.4)" }}>🪑 {c.seats} Seats</span>
                <span style={{ fontSize: ".78rem", color: "#fcd34d" }}>💰 {c.fee}</span>
              </div>
              <button onClick={() => setExpCourse(expCourse === c.id ? null : c.id)} style={{ marginTop: 10, background: "rgba(37,99,235,.1)", color: "#93c5fd", border: "1px solid rgba(37,99,235,.2)", borderRadius: 8, padding: "4px 12px", fontSize: ".75rem", cursor: "pointer" }}>
                {expCourse === c.id ? "▲ Hide" : "▼ Details"}
              </button>
              {expCourse === c.id && <div style={{ marginTop: 10, padding: 12, background: "rgba(37,99,235,.05)", borderRadius: 8, border: "1px solid rgba(37,99,235,.15)", fontSize: ".82rem", color: "rgba(255,255,255,.6)", lineHeight: 1.7 }}>
                <strong style={{ color: "#93c5fd" }}>Duration:</strong> {c.dur} &nbsp;|&nbsp; <strong style={{ color: "#93c5fd" }}>Seats:</strong> {c.seats} &nbsp;|&nbsp; <strong style={{ color: "#93c5fd" }}>Fee:</strong> {c.fee}
              </div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── TIMETABLE ── */
  const showTimetable = () => (
    <div>
      <PH t="Timetable" s="Weekly class schedule — 9:00 AM to 5:00 PM" />
      <div style={{ background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 10, padding: "10px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <span>☕</span><span style={{ color: "#fcd34d", fontSize: ".85rem", fontWeight: 600 }}>Tea Break: 11:00 – 11:30 AM daily</span>
      </div>
      <div className="table-card" style={{ overflowX: "auto" }}>
        <table className="table" style={{ minWidth: 700 }}>
          <thead><tr><th style={{ minWidth: 110 }}>🕐 Time</th>{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(d => <th key={d} style={{ textAlign: "center" }}>{d}</th>)}</tr></thead>
          <tbody>
            {ttRows.map((row, idx) => (
              <React.Fragment key={idx}>
                {idx === 2 && <tr><td style={{ color: "#fcd34d", fontWeight: 600, fontSize: ".8rem" }}>11:00–11:30</td>{["mon","tue","wed","thu","fri"].map(d => <td key={d} style={{ textAlign: "center", background: "rgba(245,158,11,.08)", color: "#fcd34d", fontWeight: 600, fontSize: ".8rem" }}>☕ Tea Break</td>)}</tr>}
                <tr style={{ background: row.isBreak ? "rgba(245,158,11,.03)" : "" }}>
                  <td style={{ color: row.isBreak ? "#fcd34d" : "rgba(255,255,255,.5)", fontSize: ".8rem", fontWeight: row.isBreak ? 600 : 400, whiteSpace: "nowrap" }}>{row.time}</td>
                  {["mon","tue","wed","thu","fri"].map(d => (
                    <td key={d} style={{ textAlign: "center" }}><span style={{ display: "inline-block", background: subBg(row[d]), borderRadius: 6, padding: "3px 8px", fontSize: ".76rem", color: row.isBreak ? "#fcd34d" : "rgba(255,255,255,.75)", fontWeight: row.isBreak ? 600 : 400 }}>{row[d]}</span></td>
                  ))}
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ── FEES ── */
  const showFees = () => {
    const paid    = students.filter(s => { const f = getFeeForStudent(s._id); return f.paid >= f.total; }).length;
    const partial = students.filter(s => { const f = getFeeForStudent(s._id); return f.paid > 0 && f.paid < f.total; }).length;
    const unpaid  = students.filter(s => { const f = getFeeForStudent(s._id); return f.paid === 0; }).length;
    return (
      <div>
        <PH t="Fee Structure" s="Student fee records and payment tracking" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
          <SCard icon="🎓" num={students.length} label="Total Students" color="#2563eb" />
          <SCard icon="✅" num={paid}             label="Fully Paid"     color="#10b981" />
          <SCard icon="⚠️" num={partial}          label="Partial"        color="#f59e0b" />
          <SCard icon="❌" num={unpaid}            label="Unpaid"         color="#ef4444" />
        </div>
        <div className="table-card">
          <div className="table-card-header"><h5>💰 Student Fee Records</h5></div>
          <table className="table">
            <thead><tr><th>#</th><th>Student</th><th>Course</th><th>Total Fee</th><th>Paid</th><th>Remaining</th><th>Status</th>{role === "Admin" && <th>Add Payment</th>}</tr></thead>
            <tbody>
              {students.map((s, i) => {
                const fee   = getFeeForStudent(s._id);
                const total = fee.total || feeAmt[s.course] || 80000;
                const rem   = total - fee.paid;
                const pct   = Math.round((fee.paid / total) * 100);
                const st    = feeStatus(fee.paid, total);
                return (
                  <tr key={s._id}>
                    <td style={{ color: "rgba(255,255,255,.3)" }}>{i + 1}</td>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}>{Av(s.name)}{s.name}</div></td>
                    <td><Badge cls={courseBadge(s.course)}>{s.course}</Badge></td>
                    <td style={{ color: "rgba(255,255,255,.5)" }}>₹{total.toLocaleString()}</td>
                    <td>
                      <div style={{ color: "#34d399", fontWeight: 600, fontSize: ".88rem" }}>₹{fee.paid.toLocaleString()}</div>
                      <div style={{ background: "rgba(255,255,255,.06)", borderRadius: 20, height: 5, marginTop: 3, width: 90, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#10b981" : pct > 0 ? "#f59e0b" : "#ef4444", borderRadius: 20 }}></div></div>
                      <div style={{ fontSize: ".68rem", color: "rgba(255,255,255,.3)", marginTop: 2 }}>{pct}%</div>
                    </td>
                    <td style={{ color: "#fca5a5", fontWeight: 600 }}>₹{rem.toLocaleString()}</td>
                    <td><span className="badge-pill" style={{ background: st.b, color: st.c }}>{st.l}</span></td>
                    {role === "Admin" && <td>
                      {rem > 0
                        ? <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <input type="number" placeholder="₹" value={payInp[s._id] || ""} onChange={e => setPayInp(p => ({ ...p, [s._id]: e.target.value }))} style={{ ...I("90px"), padding: "5px 10px", fontSize: ".78rem" }} />
                            <button onClick={() => addPayment(s._id, payInp[s._id] || 0)} style={{ ...sBtn, padding: "5px 10px", fontSize: ".75rem" }}>+Pay</button>
                          </div>
                        : <span style={{ color: "#34d399", fontSize: ".78rem" }}>✅ Cleared</span>}
                    </td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ── SALARY ── */
  const showSalary = () => {
    const totalPaid = salRec.filter(r => r.paid).length;
    const totalSal  = faculty.reduce((a, f) => a + (f.salary || 0), 0);
    return (
      <div>
        <PH t="Faculty Salary" s="Monthly salary management" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
          <SCard icon="👨‍🏫" num={faculty.length}            label="Total Faculty"   color="#2563eb" />
          <SCard icon="✅"   num={totalPaid}                 label="Salary Paid"     color="#10b981" />
          <SCard icon="⏳"   num={faculty.length - totalPaid} label="Pending"        color="#f59e0b" />
          <SCard icon="💰"   num={"₹" + totalSal.toLocaleString()} label="Monthly Budget" color="#7c3aed" />
        </div>
        <div className="table-card">
          <div className="table-card-header"><h5>💳 Salary Records — April 2026</h5></div>
          <table className="table">
            <thead><tr><th>#</th><th>Faculty</th><th>Department</th><th>Salary</th><th>Status</th>{role === "Admin" && <th>Action</th>}</tr></thead>
            <tbody>
              {faculty.map((f, i) => {
                const rec = salRec.find(r => String(r.fid) === String(f._id)) || { paid: false };
                return (
                  <tr key={f._id}>
                    <td style={{ color: "rgba(255,255,255,.3)" }}>{i + 1}</td>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}>{Av(f.name, "linear-gradient(135deg,#10b981,#065f46)")}{f.name}</div></td>
                    <td>{f.dept}</td>
                    <td style={{ color: "#fcd34d", fontWeight: 600 }}>₹{f.salary?.toLocaleString()}</td>
                    <td><span className="badge-pill" style={{ background: rec.paid ? "rgba(16,185,129,.15)" : "rgba(245,158,11,.15)", color: rec.paid ? "#34d399" : "#fcd34d" }}>{rec.paid ? "✅ Paid" : "⏳ Pending"}</span></td>
                    {role === "Admin" && <td>{!rec.paid
                      ? <button onClick={() => setSalRec(p => p.map(r => String(r.fid) === String(f._id) ? { ...r, paid: true } : r))} style={{ ...G("rgba(16,185,129,.15)", "#34d399"), border: "1px solid rgba(16,185,129,.2)", padding: "5px 14px", fontSize: ".78rem" }}>💳 Mark Paid</button>
                      : <span style={{ color: "#34d399", fontSize: ".78rem" }}>✅ Done</span>}
                    </td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ── NOTICES ── */
  const showNotices = () => (
    <div>
      <PH t="Notice Board" s="Announcements, exams, events & alerts" />
      <div className="table-card">
        <div className="table-card-header">
          <h5>📢 Notices ({notices.length})</h5>
          <div style={{ display: "flex", gap: 8 }}>
            {unread > 0 && <button onClick={markAllRead} style={{ ...G("rgba(37,99,235,.15)", "#93c5fd"), border: "1px solid rgba(37,99,235,.2)", padding: "7px 14px", fontSize: ".78rem" }}>✔ Mark all read</button>}
            {role === "Admin" && <button onClick={() => setShowAddNotice(!showAddNotice)} style={G("linear-gradient(135deg,#f59e0b,#d97706)")}>➕ Add</button>}
          </div>
        </div>
        {showAddNotice && (
          <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,.07)", background: "rgba(245,158,11,.05)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div><label style={lbl}>Title</label><input placeholder="Notice title" value={newNotice.title} onChange={e => setNewNotice({ ...newNotice, title: e.target.value })} style={I("220px")} /></div>
            <div><label style={lbl}>Category</label>
              <select value={newNotice.category} onChange={e => setNewNotice({ ...newNotice, category: e.target.value })} style={I()}>
                <option>General</option><option>Exam</option><option>Event</option><option>Fee</option><option>Holiday</option>
              </select></div>
            <div><label style={lbl}>Date</label><input type="date" value={newNotice.date} onChange={e => setNewNotice({ ...newNotice, date: e.target.value })} style={I("150px")} /></div>
            <div><label style={lbl}>Content</label><input placeholder="Content..." value={newNotice.content} onChange={e => setNewNotice({ ...newNotice, content: e.target.value })} style={I("260px")} /></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addNotice} style={sBtn}>✔ Post</button>
              <button onClick={() => setShowAddNotice(false)} style={xBtn}>✖</button>
            </div>
          </div>
        )}
        <div style={{ padding: 14 }}>
          {notices.map(n => (
            <div key={n._id} onClick={() => markNoticeRead(n._id)}
              style={{ background: n.read ? "rgba(255,255,255,.015)" : "rgba(37,99,235,.06)", border: `1px solid ${n.read ? "rgba(255,255,255,.06)" : catColor(n.category) + "30"}`, borderLeft: `3px solid ${catColor(n.category)}`, borderRadius: 10, padding: "16px 18px", marginBottom: 10, cursor: "pointer", position: "relative" }}>
              {!n.read && <div style={{ position: "absolute", top: 14, right: 44, width: 8, height: 8, borderRadius: "50%", background: "#3b82f6" }}></div>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: `${catColor(n.category)}20`, color: catColor(n.category), border: `1px solid ${catColor(n.category)}40`, borderRadius: 20, padding: "2px 10px", fontSize: ".7rem", fontWeight: 600 }}>{n.category}</span>
                  <span style={{ fontWeight: 700, color: "#f8fafc", fontSize: ".9rem" }}>{n.title}</span>
                  {!n.read && <span style={{ background: "rgba(37,99,235,.2)", color: "#93c5fd", borderRadius: 20, padding: "1px 8px", fontSize: ".65rem", fontWeight: 600 }}>NEW</span>}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: "rgba(255,255,255,.3)", fontSize: ".72rem" }}>📅 {n.date}</span>
                  {role === "Admin" && <button onClick={e => { e.stopPropagation(); ask(`Delete notice: "${n.title}"?`, () => delNotice(n._id)); }} style={{ ...dBtn, padding: "2px 8px", fontSize: ".7rem" }}>🗑</button>}
                </div>
              </div>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: ".83rem", margin: 0, lineHeight: 1.6 }}>{n.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── ADMISSION ── */
  const showAdmission = () => (
    <div>
      <PH t="Admission" s="New student admission management" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <SCard icon="📋" num={admissions.length}                                  label="Applications" color="#2563eb" />
        <SCard icon="✅" num={admissions.filter(a => a.status === "Approved").length} label="Approved" color="#10b981" />
        <SCard icon="⏳" num={admissions.filter(a => a.status === "Pending").length}  label="Pending"  color="#f59e0b" />
        <SCard icon="🎓" num={courses.length}                                     label="Courses Open" color="#7c3aed" />
      </div>
      {role === "Admin" && (
        <div className="table-card" style={{ marginBottom: 16 }}>
          <div className="table-card-header">
            <h5>➕ New Admission Application</h5>
            <button onClick={() => setShowAdmForm(!showAdmForm)} style={G("linear-gradient(135deg,#10b981,#065f46)")}>➕ Add Application</button>
          </div>
          {showAdmForm && (
            <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,.07)", background: "rgba(16,185,129,.05)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div><label style={lbl}>Full Name</label><input placeholder="Applicant name" value={admForm.name} onChange={e => setAdmForm({ ...admForm, name: e.target.value })} style={I("180px")} /></div>
              <div><label style={lbl}>Course</label>
                <select value={admForm.course} onChange={e => setAdmForm({ ...admForm, course: e.target.value })} style={I()}>
                  <option>B.Tech</option><option>MCA</option><option>MBA</option><option>M.Tech</option><option>BCA</option>
                </select></div>
              <div><label style={lbl}>Score %</label><input type="number" placeholder="85" value={admForm.score} onChange={e => setAdmForm({ ...admForm, score: e.target.value })} style={I("80px")} /></div>
              <div><label style={lbl}>Phone</label><input placeholder="Phone" value={admForm.phone} onChange={e => setAdmForm({ ...admForm, phone: e.target.value })} style={I("130px")} /></div>
              <div><label style={lbl}>Email</label><input placeholder="Email" value={admForm.email} onChange={e => setAdmForm({ ...admForm, email: e.target.value })} style={I("180px")} /></div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { if (!admForm.name) return; setAdmissions(p => [...p, { ...admForm, id: Date.now(), status: "Pending", date: today }]); setAdmForm({ name: "", course: "B.Tech", score: "", phone: "", email: "" }); setShowAdmForm(false); }} style={sBtn}>✔ Submit</button>
                <button onClick={() => setShowAdmForm(false)} style={xBtn}>✖</button>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="table-card">
        <div className="table-card-header"><h5>📋 Applications List</h5></div>
        <table className="table">
          <thead><tr><th>#</th><th>Applicant</th><th>Course</th><th>Score</th><th>Date</th><th>Status</th>{role === "Admin" && <th>Actions</th>}</tr></thead>
          <tbody>
            {admissions.map((a, i) => (
              <tr key={a.id}>
                <td style={{ color: "rgba(255,255,255,.3)" }}>{i + 1}</td>
                <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}>{Av(a.name, "linear-gradient(135deg,#7c3aed,#2563eb)")}{a.name}</div></td>
                <td><Badge cls={courseBadge(a.course)}>{a.course}</Badge></td>
                <td style={{ fontWeight: 600, color: a.score >= 80 ? "#34d399" : a.score >= 60 ? "#fcd34d" : "#fca5a5" }}>{a.score}%</td>
                <td style={{ color: "rgba(255,255,255,.4)", fontSize: ".8rem" }}>{a.date}</td>
                <td><span className="badge-pill" style={{ background: a.status === "Approved" ? "rgba(16,185,129,.15)" : "rgba(245,158,11,.15)", color: a.status === "Approved" ? "#34d399" : "#fcd34d" }}>{a.status}</span></td>
                {role === "Admin" && <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    {a.status === "Pending" && <button onClick={() => setAdmissions(p => p.map(x => x.id === a.id ? { ...x, status: "Approved" } : x))} style={{ ...G("rgba(16,185,129,.15)", "#34d399"), border: "1px solid rgba(16,185,129,.2)", padding: "4px 10px", fontSize: ".74rem" }}>✅ Approve</button>}
                    <button onClick={() => ask(`Reject ${a.name}'s application?`, () => setAdmissions(p => p.filter(x => x.id !== a.id)))} style={{ ...dBtn, padding: "4px 8px", fontSize: ".74rem" }}>🗑</button>
                  </div>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ── FEEDBACK ── */
  const showFeedback = () => (
    <div>
      <PH t="Feedback & Complaints" s="Student feedback and resolution tracking" />
      <div className="table-card" style={{ marginBottom: 16 }}>
        <div className="table-card-header"><h5>💬 Submit Feedback</h5></div>
        <div style={{ padding: "18px 24px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div><label style={lbl}>Your Name</label><input placeholder="Name" value={fbForm.name} onChange={e => setFbForm({ ...fbForm, name: e.target.value })} style={I("180px")} /></div>
          <div><label style={lbl}>Type</label>
            <select value={fbForm.type} onChange={e => setFbForm({ ...fbForm, type: e.target.value })} style={I()}>
              <option>Academic</option><option>Facility</option><option>Admin</option><option>Other</option>
            </select></div>
          <div><label style={lbl}>Message</label><input placeholder="Your feedback or complaint..." value={fbForm.msg} onChange={e => setFbForm({ ...fbForm, msg: e.target.value })} style={I("300px")} /></div>
          <button onClick={() => { if (!fbForm.name || !fbForm.msg) return; setFeedbacks(p => [{ id: Date.now(), name: fbForm.name, type: fbForm.type, msg: fbForm.msg, status: "Pending", date: today }, ...p]); setFbForm({ name: "", type: "Academic", msg: "" }); showToast("Feedback submitted ✅"); }} style={sBtn}>📤 Submit</button>
        </div>
      </div>
      <div className="table-card">
        <div className="table-card-header"><h5>📋 Feedback Records ({feedbacks.length})</h5></div>
        <table className="table">
          <thead><tr><th>#</th><th>Student</th><th>Type</th><th>Message</th><th>Date</th><th>Status</th>{role === "Admin" && <th>Action</th>}</tr></thead>
          <tbody>
            {feedbacks.map((f, i) => (
              <tr key={f.id}>
                <td style={{ color: "rgba(255,255,255,.3)" }}>{i + 1}</td>
                <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}>{Av(f.name, "linear-gradient(135deg,#7c3aed,#06b6d4)")}{f.name}</div></td>
                <td><Badge cls="badge-violet">{f.type}</Badge></td>
                <td style={{ color: "rgba(255,255,255,.55)", fontSize: ".85rem", maxWidth: 220 }}>{f.msg}</td>
                <td style={{ color: "rgba(255,255,255,.35)", fontSize: ".78rem" }}>{f.date}</td>
                <td><span className="badge-pill" style={{ background: f.status === "Resolved" ? "rgba(16,185,129,.15)" : "rgba(245,158,11,.15)", color: f.status === "Resolved" ? "#34d399" : "#fcd34d" }}>{f.status}</span></td>
                {role === "Admin" && <td>{f.status === "Pending" ? <button onClick={() => setFeedbacks(p => p.map(x => x.id === f.id ? { ...x, status: "Resolved" } : x))} style={{ ...G("rgba(16,185,129,.15)", "#34d399"), border: "1px solid rgba(16,185,129,.2)", padding: "4px 10px", fontSize: ".74rem" }}>✅ Resolve</button> : <span style={{ color: "#34d399", fontSize: ".78rem" }}>Done</span>}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     NAV CONFIG
     ══════════════════════════════════════════════════════════════ */
  const mainNav = [
    { id: "home",      l: "Home",      i: "🏠" },
    { id: "analytics", l: "Analytics", i: "📊" },
    { id: "students",  l: "Students",  i: "🎓" },
    { id: "faculty",   l: "Faculty",   i: "👨‍🏫" },
    { id: "marks",     l: "Results",   i: "📝" },
  ].filter(x => allowed.includes(x.id));

  const mgmtNav = [
    { id: "library",    l: "Library",    i: "📚" },
    { id: "hostel",     l: "Hostel",     i: "🏠" },
    { id: "attendance", l: "Attendance", i: "📋" },
    { id: "courses",    l: "Courses",    i: "📖" },
    { id: "timetable",  l: "Timetable",  i: "🗓️" },
    { id: "fees",       l: "Fees",       i: "💰" },
    { id: "salary",     l: "Salary",     i: "💳" },
    { id: "admission",  l: "Admission",  i: "🎓" },
    { id: "notices",    l: "Notices",    i: "📢" },
    { id: "feedback",   l: "Feedback",   i: "💬" },
  ].filter(x => allowed.includes(x.id));

  const render = () => {
    switch (sec) {
      case "home":       return showHome();
      case "analytics":  return showAnalytics();
      case "students":   return showStudents();
      case "faculty":    return showFaculty();
      case "marks":      return showMarks();
      case "library":    return showLibrary();
      case "hostel":     return showHostel();
      case "attendance": return showAttendance();
      case "courses":    return showCourses();
      case "timetable":  return showTimetable();
      case "fees":       return showFees();
      case "salary":     return showSalary();
      case "notices":    return showNotices();
      case "admission":  return showAdmission();
      case "feedback":   return showFeedback();
      default:           return showHome();
    }
  };

  const titles = { home:"Dashboard", analytics:"Analytics", students:"Students", faculty:"Faculty", marks:"Marks & Results", library:"Library", hostel:"Hostel", attendance:"Attendance", courses:"Courses", timetable:"Timetable", fees:"Fees", salary:"Salary", notices:"Notice Board", admission:"Admission", feedback:"Feedback" };

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div className="dashboard-layout">
      <Loading />
      <Toast />
      <Confirm />
      <Profile />

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="./cyber-vidya-logo.png" alt="logo" style={{ height: 38, objectFit: "contain", marginBottom: 8, filter: "drop-shadow(0 2px 8px rgba(37,99,235,.4))" }} onError={e => e.target.style.display = "none"} />
          <div className="sidebar-brand-name">G.H. Raisoni</div>
          <div className="sidebar-brand-sub">College of Engineering</div>
        </div>
        <div style={{ padding: "10px 12px" }}>
          <div style={{ background: "rgba(37,99,235,.12)", border: "1px solid rgba(37,99,235,.2)", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <span>{role === "Admin" ? "🛡" : role === "Faculty" ? "👨‍🏫" : "🎓"}</span>
            <div><div style={{ fontSize: ".78rem", fontWeight: 600, color: "#93c5fd" }}>{session.name}</div><div style={{ fontSize: ".66rem", color: "rgba(255,255,255,.3)" }}>{role}</div></div>
          </div>
        </div>
        <div className="sidebar-section-label">Main Menu</div>
        <nav className="sidebar-nav">
          {mainNav.map(item => (
            <button key={item.id} className={`sidebar-nav-item ${sec === item.id ? "active" : ""}`} onClick={() => setSec(item.id)}>
              <span className="nav-icon">{item.i}</span>{item.l}
            </button>
          ))}
        </nav>
        {mgmtNav.length > 0 && <>
          <div className="sidebar-section-label">Management</div>
          <nav className="sidebar-nav">
            {mgmtNav.map(item => (
              <button key={item.id} className={`sidebar-nav-item ${sec === item.id ? "active" : ""}`} onClick={() => setSec(item.id)}>
                <span className="nav-icon">{item.i}</span>{item.l}
                {item.id === "notices" && unread > 0 && <span style={{ marginLeft: "auto", background: "#ef4444", color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: ".62rem", fontWeight: 700 }}>{unread}</span>}
              </button>
            ))}
          </nav>
        </>}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}><span>🚪</span> Logout</button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <h3>{titles[sec]}</h3>
            <p style={{ color: "rgba(255,255,255,.3)", fontSize: ".72rem", margin: "2px 0 0" }}>
              {time.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {time.toLocaleTimeString()}
            </p>
          </div>
          <div className="topbar-right">
            {/* Search */}
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "6px 12px", gap: 6 }}>
                <span style={{ color: "rgba(255,255,255,.3)", fontSize: ".9rem" }}>🔍</span>
                <input placeholder="Search…" value={search} onChange={e => { setSearch(e.target.value); setShowSearch(true); }} onFocus={() => setShowSearch(true)} style={{ background: "none", border: "none", color: "#fff", outline: "none", width: 160, fontSize: ".82rem", fontFamily: "DM Sans,sans-serif" }} />
              </div>
              {showSearch && searchResults.length > 0 && (
                <div style={{ position: "absolute", top: 46, right: 0, width: 300, background: "#111827", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, boxShadow: "0 20px 50px rgba(0,0,0,.5)", zIndex: 200, overflow: "hidden" }}>
                  {searchResults.map((r, i) => (
                    <div key={i} onClick={r.action} style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,.04)", cursor: "pointer", display: "flex", gap: 10, alignItems: "center" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(37,99,235,.1)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span style={{ fontSize: ".7rem", background: "rgba(37,99,235,.15)", color: "#93c5fd", borderRadius: 20, padding: "2px 8px" }}>{r.type}</span>
                      <div><div style={{ fontSize: ".85rem", color: "#f8fafc" }}>{r.label}</div><div style={{ fontSize: ".72rem", color: "rgba(255,255,255,.35)" }}>{r.sub}</div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Bell */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowBell(!showBell)} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, width: 38, height: 38, cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                🔔{unread > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 17, height: 17, fontSize: ".6rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{unread}</span>}
              </button>
              {showBell && (
                <div style={{ position: "absolute", top: 46, right: 0, width: 300, background: "#111827", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, boxShadow: "0 20px 50px rgba(0,0,0,.5)", zIndex: 200, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, color: "#f8fafc", fontSize: ".9rem" }}>🔔 Notifications</span>
                    <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#93c5fd", fontSize: ".75rem", cursor: "pointer" }}>Mark all read</button>
                  </div>
                  {notices.slice(0, 5).map(n => (
                    <div key={n._id} onClick={() => { markNoticeRead(n._id); setShowBell(false); setSec("notices"); }}
                      style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,.04)", cursor: "pointer", background: n.read ? "transparent" : "rgba(37,99,235,.05)", display: "flex", gap: 10 }}>
                      <span style={{ fontSize: ".95rem", flexShrink: 0 }}>{n.category === "Exam" ? "📝" : n.category === "Event" ? "🎉" : n.category === "Fee" ? "💰" : n.category === "Holiday" ? "🏖" : "📢"}</span>
                      <div><div style={{ fontSize: ".82rem", fontWeight: n.read ? 400 : 600, color: n.read ? "rgba(255,255,255,.5)" : "#f8fafc" }}>{n.title}</div><div style={{ fontSize: ".7rem", color: "rgba(255,255,255,.3)", marginTop: 2 }}>{n.date}</div></div>
                      {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", marginLeft: "auto", flexShrink: 0, marginTop: 4 }}></div>}
                    </div>
                  ))}
                  <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,.07)", textAlign: "center" }}>
                    <button onClick={() => { setShowBell(false); setSec("notices"); }} style={{ background: "none", border: "none", color: "#93c5fd", fontSize: ".8rem", cursor: "pointer" }}>View all →</button>
                  </div>
                </div>
              )}
            </div>
            {/* Dark mode */}
            <button onClick={toggleDark} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, width: 38, height: 38, cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{darkMode ? "☀️" : "🌙"}</button>
            <span className="topbar-status">● Online</span>
            <div className="topbar-badge">
              <div className="topbar-avatar">{session.name.charAt(0)}</div>
              <span className="topbar-user-name">{session.name}</span>
            </div>
          </div>
        </header>
        <main className="page-content" key={sec}>{render()}</main>
      </div>
    </div>
  );
}
