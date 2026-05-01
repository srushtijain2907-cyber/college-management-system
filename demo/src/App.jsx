import React, { useState } from "react";
import Login from "./Login";
import Dashboard from "./dashboard";

export default function App() {
  const [session, setSession] = useState(() => {
    const s = localStorage.getItem("cms_session");
    return s ? JSON.parse(s) : null;
  });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("cms_dark") === "true");

  const handleLogin = (role, name) => {
    const s = { role, name };
    localStorage.setItem("cms_session", JSON.stringify(s));
    setSession(s);
  };

  const handleLogout = () => {
    localStorage.removeItem("cms_session");
    setSession(null);
  };

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("cms_dark", String(next));
  };

  return (
    <div className={darkMode ? "app-dark" : "app-light"}>
      {session
        ? <Dashboard session={session} onLogout={handleLogout} darkMode={darkMode} toggleDark={toggleDark} />
        : <Login onLogin={handleLogin} darkMode={darkMode} toggleDark={toggleDark} />
      }
    </div>
  );
}
