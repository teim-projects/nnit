import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function NNITLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="#E87722" />
        <text x="8" y="29" fontFamily="Arial Black" fontWeight="900" fontSize="22" fill="white">P</text>
      </svg>
      <div>
        <div style={{ fontFamily: "'Arial Black', Arial", fontWeight: 900, fontSize: "15px", color: "#E87722", letterSpacing: "1px", lineHeight: 1 }}>NNIT</div>
        <div style={{ fontFamily: "Arial", fontWeight: 700, fontSize: "8px", color: "rgba(255,255,255,0.75)", letterSpacing: "0.5px", lineHeight: 1.3 }}>CAR PARKING SYSTEMS PVT. LTD.</div>
      </div>
    </div>
  );
}

function ParkingBg() {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.07 }} xmlns="http://www.w3.org/2000/svg">
      {[0,1,2,3,4,5].map(row =>
        [0,1,2,3,4].map(col => (
          <g key={`${row}-${col}`} transform={`translate(${col * 90 + 20},${row * 110 + 20})`}>
            <rect width="70" height="95" rx="4" fill="none" stroke="#E87722" strokeWidth="2" strokeDasharray="4 4" />
            <rect x="22" y="30" width="26" height="42" rx="3" fill="#E87722" />
            <rect x="24" y="26" width="10" height="8" rx="2" fill="#E87722" />
            <rect x="38" y="26" width="10" height="8" rx="2" fill="#E87722" />
            <circle cx="30" cy="75" r="5" fill="#1B3A8C" />
            <circle cx="40" cy="75" r="5" fill="#1B3A8C" />
          </g>
        ))
      )}
    </svg>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  console.log("Register BASE_API =", BASE_API);

  if (!BASE_API) {
    console.error("Register: VITE_BASE_API_URL is not defined!");
  }

  const [form, setForm] = useState({ email: "", mobile_no: "", password1: "", password2: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password1 !== form.password2) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_API}/auth/dj-rest-auth/registration/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Object.values(data).flat()[0];
        setError(typeof msg === "string" ? msg : JSON.stringify(msg));
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "13px 14px 13px 42px",
    borderRadius: "12px",
    border: "1.5px solid #e5e7eb",
    fontSize: "13px",
    background: "#fafbff",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    fontWeight: 700,
    color: "#6b7280",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    marginBottom: "8px",
  };

  const iconWrap = (icon) => (
    <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>{icon}</span>
  );

  const userIcon = <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
  const mailIcon = <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
  const lockIcon = <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
  const phoneIcon = <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "Inter, Arial, sans-serif" }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div style={{
        width: "48%",
        background: "linear-gradient(135deg, #0f1f4b 0%, #1B3A8C 55%, #1a4fa0 100%)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "48px 56px",
      }}>
        <ParkingBg />

        <div style={{ position: "relative", zIndex: 1 }}><NNITLogo /></div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: "40px", background: "rgba(232,119,34,0.18)", border: "1px solid rgba(232,119,34,0.4)", color: "#E87722", fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "20px" }}>
            Join NNIT CRM
          </div>

          <h1 style={{ color: "white", fontSize: "36px", fontWeight: 900, lineHeight: 1.2, margin: "0 0 16px" }}>
            Start Managing<br />
            <span style={{ color: "#E87722" }}>Parking Projects</span><br />
            Efficiently
          </h1>

          <p style={{ color: "rgba(179,208,255,0.85)", fontSize: "14px", lineHeight: 1.7, maxWidth: "340px", margin: "0 0 28px" }}>
            Create your account and access leads, quotations, AMC contracts and inventory — all in one place.
          </p>

          {["Manage leads & follow-ups", "Generate professional quotations", "Track AMC contracts", "Real-time inventory management"].map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(232,119,34,0.25)", border: "1px solid rgba(232,119,34,0.5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="10" height="10" fill="#E87722" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span style={{ color: "rgba(179,208,255,0.9)", fontSize: "13px" }}>{f}</span>
            </div>
          ))}
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ color: "rgba(179,208,255,0.5)", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", margin: 0 }}>
            Cars. Care. Convenience. Covered.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────── */}
      <div style={{ flex: 1, background: "#f7f8fc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: "440px" }}>

          <div style={{ background: "white", borderRadius: "28px", padding: "44px 40px", boxShadow: "0 8px 40px rgba(0,0,0,0.09)", border: "1px solid #e8eaf0" }}>

            {success ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(232,119,34,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <svg width="28" height="28" fill="none" stroke="#E87722" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#111827", margin: "0 0 8px" }}>Account Created!</h3>
                <p style={{ fontSize: "13px", color: "#9ca3af" }}>Redirecting to login…</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "28px" }}>
                  <h2 style={{ fontSize: "24px", fontWeight: 900, color: "#111827", margin: "0 0 6px" }}>Create account ✨</h2>
                  <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>Register for NNIT CRM access</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                  {/* Email */}
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <div style={{ position: "relative" }}>
                      {iconWrap(mailIcon)}
                      <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = "#E87722"; e.target.style.boxShadow = "0 0 0 3px rgba(232,119,34,0.12)"; }}
                        onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }} />
                    </div>
                  </div>

                  {/* Mobile */}
                  <div>
                    <label style={labelStyle}>Mobile Number</label>
                    <div style={{ position: "relative" }}>
                      {iconWrap(phoneIcon)}
                      <input type="text" name="mobile_no" value={form.mobile_no} onChange={handleChange} placeholder="9876543210" required style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = "#E87722"; e.target.style.boxShadow = "0 0 0 3px rgba(232,119,34,0.12)"; }}
                        onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }} />
                    </div>
                  </div>

                  {/* Passwords */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={labelStyle}>Password</label>
                      <div style={{ position: "relative" }}>
                        {iconWrap(lockIcon)}
                        <input type="password" name="password1" value={form.password1} onChange={handleChange} placeholder="Min 8 chars" required style={inputStyle}
                          onFocus={e => { e.target.style.borderColor = "#E87722"; e.target.style.boxShadow = "0 0 0 3px rgba(232,119,34,0.12)"; }}
                          onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Confirm</label>
                      <div style={{ position: "relative" }}>
                        {iconWrap(lockIcon)}
                        <input type="password" name="password2" value={form.password2} onChange={handleChange} placeholder="Repeat" required style={inputStyle}
                          onFocus={e => { e.target.style.borderColor = "#E87722"; e.target.style.boxShadow = "0 0 0 3px rgba(232,119,34,0.12)"; }}
                          onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }} />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div style={{ background: "#fff4ee", border: "1px solid #ffd0b0", color: "#c0440a", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading} style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "12px",
                    border: "none",
                    background: loading ? "#d1d5db" : "linear-gradient(135deg, #E87722 0%, #c45e0f 100%)",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "15px",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading ? "none" : "0 6px 20px rgba(232,119,34,0.38)",
                    letterSpacing: "0.3px",
                    marginTop: "4px",
                  }}>
                    {loading ? "Creating…" : "Create Account →"}
                  </button>
                </form>

                <p style={{ textAlign: "center", fontSize: "13px", color: "#9ca3af", marginTop: "24px" }}>
                  Already have an account?{" "}
                  <Link to="/login" style={{ color: "#E87722", fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
                </p>
              </>
            )}
          </div>

          <p style={{ textAlign: "center", fontSize: "11px", color: "#9ca3af", marginTop: "20px" }}>
            © 2026 NNIT Car Parking Systems Pvt. Ltd.
          </p>
        </div>
      </div>

    </div>
  );
}
