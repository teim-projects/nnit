import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function NNITLogo({ dark = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="#E87722" />
        <text x="8" y="29" fontFamily="Arial Black" fontWeight="900" fontSize="22" fill="white">P</text>
      </svg>
      <div>
        <div style={{ fontFamily: "'Arial Black', Arial", fontWeight: 900, fontSize: "15px", color: dark ? "#E87722" : "#E87722", letterSpacing: "1px", lineHeight: 1 }}>
          NNIT
        </div>
        <div style={{ fontFamily: "Arial", fontWeight: 700, fontSize: "8px", color: dark ? "#1B3A8C" : "rgba(255,255,255,0.75)", letterSpacing: "0.5px", lineHeight: 1.3 }}>
          CAR PARKING SYSTEMS PVT. LTD.
        </div>
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

export default function Login() {
  const navigate = useNavigate();
  const BASE_API = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";

  const [form, setForm] = useState({ email_or_mobile: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_API}/auth/dj-rest-auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.non_field_errors?.[0] || data?.detail || "Invalid credentials.");
        return;
      }
      if (data.access) localStorage.setItem("access", data.access);
      if (data.refresh) localStorage.setItem("refresh", data.refresh);
      window.dispatchEvent(new Event("authChange"));
      navigate("/dashboard");
    } catch {
      setError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "Inter, Arial, sans-serif" }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div style={{
        width: "52%",
        background: "linear-gradient(135deg, #0f1f4b 0%, #1B3A8C 55%, #1a4fa0 100%)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "48px 56px",
      }}>
        <ParkingBg />

        {/* Logo */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <NNITLogo />
        </div>

        {/* Main content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: "40px",
            background: "rgba(232,119,34,0.18)",
            border: "1px solid rgba(232,119,34,0.4)",
            color: "#E87722",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}>
            Smart Parking CRM
          </div>

          <h1 style={{ color: "white", fontSize: "38px", fontWeight: 900, lineHeight: 1.2, margin: "0 0 16px" }}>
            Manage Your<br />
            <span style={{ color: "#E87722" }}>Parking Business</span><br />
            Smarter
          </h1>

          <p style={{ color: "rgba(179,208,255,0.85)", fontSize: "14px", lineHeight: 1.7, maxWidth: "360px", margin: 0 }}>
            Complete CRM for car parking systems — leads, quotations, installations and AMC contracts in one place.
          </p>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginTop: "36px" }}>
            {[
              { value: "500+", label: "Projects Delivered" },
              { value: "98%",  label: "Client Satisfaction" },
              { value: "15+",  label: "Years Experience" },
            ].map(s => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "16px",
                padding: "16px 12px",
                textAlign: "center",
              }}>
                <div style={{ color: "#E87722", fontSize: "24px", fontWeight: 900 }}>{s.value}</div>
                <div style={{ color: "rgba(179,208,255,0.7)", fontSize: "11px", marginTop: "4px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tagline */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ color: "rgba(179,208,255,0.5)", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", margin: 0 }}>
            Cars. Care. Convenience. Covered.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        background: "#f7f8fc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>

          {/* Card */}
          <div style={{
            background: "white",
            borderRadius: "28px",
            padding: "44px 40px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.09)",
            border: "1px solid #e8eaf0",
          }}>
            <div style={{ marginBottom: "32px" }}>
              <h2 style={{ fontSize: "26px", fontWeight: 900, color: "#111827", margin: "0 0 6px" }}>
                Welcome back 👋
              </h2>
              <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>
                Sign in to your NNIT CRM account
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Email / Mobile */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "8px" }}>
                  Email or Mobile
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="email_or_mobile"
                    value={form.email_or_mobile}
                    onChange={handleChange}
                    placeholder="you@example.com or 9876543210"
                    required
                    style={{ width: "100%", padding: "13px 14px 13px 42px", borderRadius: "12px", border: "1.5px solid #e5e7eb", fontSize: "13px", background: "#fafbff", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => { e.target.style.borderColor = "#E87722"; e.target.style.boxShadow = "0 0 0 3px rgba(232,119,34,0.12)"; }}
                    onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "8px" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPass ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    style={{ width: "100%", padding: "13px 42px 13px 42px", borderRadius: "12px", border: "1.5px solid #e5e7eb", fontSize: "13px", background: "#fafbff", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => { e.target.style.borderColor = "#E87722"; e.target.style.boxShadow = "0 0 0 3px rgba(232,119,34,0.12)"; }}
                    onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 }}>
                    {showPass
                      ? <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ background: "#fff4ee", border: "1px solid #ffd0b0", color: "#c0440a", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
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
                  marginTop: "4px",
                  letterSpacing: "0.3px",
                  transition: "all 0.2s",
                }}
              >
                {loading ? "Signing in…" : "Sign In →"}
              </button>
            </form>

            {/* Register */}
            <p style={{ textAlign: "center", fontSize: "13px", color: "#9ca3af", marginTop: "24px" }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: "#E87722", fontWeight: 700, textDecoration: "none" }}>
                Create account
              </Link>
            </p>
          </div>

          <p style={{ textAlign: "center", fontSize: "11px", color: "#9ca3af", marginTop: "20px" }}>
            © 2026 NNIT Car Parking Systems Pvt. Ltd.
          </p>
        </div>
      </div>

    </div>
  );
}
