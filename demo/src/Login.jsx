import React, { useState, useEffect } from "react";
import "./login.css";

const USERS = [
  { username:"admin",   password:"admin123",   role:"Admin",   name:"Administrator" },
  { username:"faculty", password:"faculty123", role:"Faculty", name:"Dr. Sharma" },
  { username:"student", password:"student123", role:"Student", name:"Rahul Sharma" },
];

export default function Login({ onLogin, darkMode, toggleDark }) {
  const [selectedRole, setSelectedRole] = useState("Admin");
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [time, setTime]                 = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    const username = e.target.username.value.trim();
    const password = e.target.password.value;
    setTimeout(() => {
      const user = USERS.find(u => u.username === username && u.password === password);
      if (user) { setError(""); onLogin(user.role, user.name); }
      else { setError("Invalid credentials. Use the hint below."); }
      setLoading(false);
    }, 700);
  };

  const hints = { Admin:"admin / admin123", Faculty:"faculty / faculty123", Student:"student / student123" };

  return (
    <div className="login-wrapper">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      {/* Topbar */}
      <div style={{ position:"fixed",top:0,left:0,right:0,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 28px",background:"rgba(10,15,30,.7)",backdropFilter:"blur(14px)",zIndex:20,borderBottom:"1px solid rgba(255,255,255,.06)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <img src="./cyber-vidya-logo.png" alt="logo" style={{ height:34,objectFit:"contain" }} onError={e=>e.target.style.display="none"} />
          <div>
            <div style={{ fontSize:".78rem",fontWeight:700,color:"#f8fafc" }}>G.H. Raisoni College</div>
            <div style={{ fontSize:".63rem",color:"rgba(255,255,255,.35)" }}>Management Portal</div>
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:".82rem",fontWeight:600,color:"#f8fafc" }}>{time.toLocaleTimeString()}</div>
            <div style={{ fontSize:".63rem",color:"rgba(255,255,255,.35)" }}>{time.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}</div>
          </div>
          <button onClick={toggleDark} style={{ background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:"50%",width:36,height:36,cursor:"pointer",fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center" }}>{darkMode?"☀️":"🌙"}</button>
        </div>
      </div>

      <div className="login-card" style={{ marginTop:20 }}>
        {/* Logo */}
        <div className="login-logo-wrap text-center">
          <div style={{ display:"flex",justifyContent:"center",alignItems:"center",marginBottom:10 }}>
            <img src="./cyber-vidya-logo.png" alt="Cyber Vidya"
              style={{ height:68,objectFit:"contain",filter:"drop-shadow(0 4px 20px rgba(37,99,235,.5))" }}
              onError={e=>{ e.target.style.display="none"; }} />
          </div>
          <h2 style={{ margin:"0 0 3px" }}>Welcome Back</h2>
          <p className="college-name">G.H Raisoni College of Engineering</p>
          <span className="system-badge">CMS · Academic Portal 2026</span>
        </div>

        {/* Role selector */}
        <div style={{ display:"flex",gap:6,margin:"18px 0 4px" }}>
          {["Admin","Faculty","Student"].map(r => (
            <button key={r} onClick={()=>setSelectedRole(r)} style={{
              flex:1,padding:"9px 0",borderRadius:10,fontSize:".78rem",fontWeight:600,
              border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif",transition:"all .25s",
              background:selectedRole===r?"linear-gradient(135deg,#2563eb,#7c3aed)":"rgba(255,255,255,.06)",
              color:selectedRole===r?"#fff":"rgba(255,255,255,.4)",
              boxShadow:selectedRole===r?"0 4px 14px rgba(37,99,235,.3)":"none"
            }}>
              {r==="Admin"?"🛡":r==="Faculty"?"👨‍🏫":"🎓"} {r}
            </button>
          ))}
        </div>
        <p style={{ textAlign:"center",fontSize:".7rem",color:"rgba(255,255,255,.25)",margin:"4px 0 16px" }}>
          Hint: {hints[selectedRole]}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-1"><label className="form-label-custom">Username</label></div>
          <div className="input-group mb-3">
            <span className="input-group-text"><i className="fa fa-user"></i></span>
            <input type="text" name="username" className="form-control" placeholder="Enter username" required />
          </div>
          <div className="mb-1"><label className="form-label-custom">Password</label></div>
          <div className="input-group mb-3">
            <span className="input-group-text"><i className="fa fa-lock"></i></span>
            <input type="password" name="password" className="form-control" placeholder="Enter password" required />
          </div>
          {error && <div style={{ background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:8,padding:"9px 13px",color:"#fca5a5",fontSize:".8rem",marginBottom:12 }}>⚠️ {error}</div>}
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            <span>{loading?"Signing in…":"Sign In to Portal"}</span>
          </button>
        </form>

        {/* Mini stats */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginTop:18,padding:"14px 0 2px",borderTop:"1px solid rgba(255,255,255,.06)" }}>
          {[["1,240","Students"],["87","Faculty"],["24","Courses"]].map(([n,l])=>(
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontWeight:700,color:"#93c5fd",fontSize:".95rem",fontFamily:"Playfair Display,serif" }}>{n}</div>
              <div style={{ fontSize:".66rem",color:"rgba(255,255,255,.3)",marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div className="login-footer">© 2026 Cyber Vidya · G.H. Raisoni College</div>
      </div>
    </div>
  );
}
