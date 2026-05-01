/**
 * api.js  —  All API calls for the CMS dashboard
 * Place this in your src/ folder alongside dashboard.jsx
 */

const BASE = "http://localhost:5000/api";

// ── helpers ─────────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("cms_token");

const headers = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (email, password) => req("POST", "/auth/login",    { email, password }),
  register: (name, email, password, role) =>
                req("POST", "/auth/register", { name, email, password, role }),
};

// ── Students ────────────────────────────────────────────────────────────────
export const studentAPI = {
  getAll:  ()           => req("GET",    "/students"),
  create:  (data)       => req("POST",   "/students",     data),
  update:  (id, data)   => req("PUT",    `/students/${id}`, data),
  delete:  (id)         => req("DELETE", `/students/${id}`),
};

// ── Faculty ─────────────────────────────────────────────────────────────────
export const facultyAPI = {
  getAll:  ()           => req("GET",    "/faculty"),
  create:  (data)       => req("POST",   "/faculty",      data),
  update:  (id, data)   => req("PUT",    `/faculty/${id}`, data),
  delete:  (id)         => req("DELETE", `/faculty/${id}`),
};

// ── Marks ────────────────────────────────────────────────────────────────────
export const marksAPI = {
  getAll:          ()                    => req("GET",  "/marks"),
  getByStudent:    (studentId)           => req("GET",  `/marks/${studentId}`),
  saveOrUpdate:    (studentId, subjects) => req("POST", "/marks", { studentId, subjects }),
};

// ── Fees ─────────────────────────────────────────────────────────────────────
export const feeAPI = {
  getAll:     ()                  => req("GET", "/fees"),
  addPayment: (studentId, amount) => req("PUT", `/fees/${studentId}/pay`, { amount }),
};

// ── Notices ──────────────────────────────────────────────────────────────────
export const noticeAPI = {
  getAll:    ()     => req("GET",    "/notices"),
  create:    (data) => req("POST",   "/notices",          data),
  markRead:  (id)   => req("PUT",    `/notices/${id}/read`),
  markAllRead: ()   => req("PUT",    "/notices/read-all/mark"),
  delete:    (id)   => req("DELETE", `/notices/${id}`),
};

// ── Attendance ───────────────────────────────────────────────────────────────
export const attendanceAPI = {
  getAll:  (date, type)        => req("GET",  `/attendance?date=${date}&type=${type}`),
  save:    (date, type, records) => req("POST", "/attendance", { date, type, records }),
};
