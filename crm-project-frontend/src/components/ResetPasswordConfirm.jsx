import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

export default function ResetPasswordConfirm() {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  const CONFIRM_ENDPOINT = `${BASE_API}/auth/password-reset-confirm/`;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setIsSuccess(false);
      setMessage("Passwords do not match. Please re-enter.");
      return;
    }

    if (newPassword.length < 8) {
      setIsSuccess(false);
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setMessage("");
    setIsSuccess(false);

    try {
      const res = await fetch(CONFIRM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uidb64: uid,
          token: token,
          new_password: newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setIsSuccess(false);
        setMessage(
          data?.detail ||
          data?.new_password?.[0] ||
          data?.non_field_errors?.[0] ||
          "Password reset failed or token expired. Please request a new link."
        );
      } else {
        setIsSuccess(true);
        setMessage("Password successfully reset! Redirecting to login…");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error) {
      console.error(error);
      setIsSuccess(false);
      setMessage("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.outerWrapper}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');
        .rpc-input:focus {
          border-color: #F26522 !important;
          box-shadow: 0 0 0 4px rgba(242,101,34,.12) !important;
        }
        .rpc-btn:hover {
          background: #e05411 !important;
          box-shadow: 0 6px 16px rgba(242,101,34,.35) !important;
        }
        .rpc-btn:active {
          transform: scale(.98);
        }
      `}</style>
      <div style={styles.card}>
        <div style={styles.brandHeader}>
          <div style={styles.logoBadge}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F26522" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 style={styles.title}>Set New Password</h2>
          <p style={styles.subtitle}>
            Please enter your new password below to secure your account.
          </p>
        </div>

        {message && (
          <div style={isSuccess ? styles.successBanner : styles.errorBanner}>
            {isSuccess ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8, flexShrink: 0 }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8, flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>New Password</label>
            <div style={styles.inputWrapper}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a9ba8" strokeWidth="2" style={styles.inputIcon}>
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={showPass ? "text" : "password"}
                required
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rpc-input"
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={styles.toggleBtn}
                aria-label="Toggle password visibility"
              >
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                )}
              </button>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Confirm New Password</label>
            <div style={styles.inputWrapper}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a9ba8" strokeWidth="2" style={styles.inputIcon}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <input
                type={showPass ? "text" : "password"}
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rpc-input"
                style={styles.input}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rpc-btn"
            style={styles.button}
          >
            {loading ? "Resetting Password…" : "Reset Password"}
          </button>
        </form>

        <div style={styles.footer}>
          <Link to="/login" style={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  outerWrapper: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(145deg, #071c30 0%, #0F4C81 51%, #0a2540 100%)",
    padding: "20px",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "440px",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "36px 32px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  brandHeader: {
    textAlign: "center",
    marginBottom: "28px",
  },
  logoBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    background: "#fff5f0",
    border: "1px solid rgba(242, 101, 34, 0.2)",
    marginBottom: "16px",
  },
  title: {
    fontFamily: "'Manrope', sans-serif",
    fontSize: "26px",
    fontWeight: "800",
    color: "#0F4C81",
    margin: "0 0 8px 0",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: "14px",
    color: "#5c7285",
    lineHeight: "1.5",
    margin: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#0F4C81",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    pointerEvents: "none",
  },
  toggleBtn: {
    position: "absolute",
    right: "12px",
    background: "transparent",
    border: "none",
    color: "#8a9ba8",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    width: "100%",
    height: "48px",
    paddingLeft: "42px",
    paddingRight: "42px",
    borderRadius: "10px",
    border: "1px solid #d0d7de",
    fontSize: "14px",
    color: "#0F4C81",
    outline: "none",
    transition: "all 0.2s ease",
  },
  button: {
    width: "100%",
    height: "48px",
    borderRadius: "10px",
    border: "none",
    background: "#F26522",
    color: "#ffffff",
    fontFamily: "'Manrope', sans-serif",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(242, 101, 34, 0.25)",
    transition: "all 0.2s ease",
  },
  successBanner: {
    display: "flex",
    alignItems: "center",
    padding: "12px 14px",
    borderRadius: "10px",
    background: "#f6ffed",
    border: "1px solid #b7eb8f",
    color: "#389e0d",
    fontSize: "13px",
    fontWeight: "500",
    marginBottom: "20px",
    lineHeight: "1.4",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    padding: "12px 14px",
    borderRadius: "10px",
    background: "#fff1f0",
    border: "1px solid #ffa39e",
    color: "#d9363e",
    fontSize: "13px",
    fontWeight: "500",
    marginBottom: "20px",
    lineHeight: "1.4",
  },
  footer: {
    marginTop: "24px",
    textAlign: "center",
    paddingTop: "20px",
    borderTop: "1px solid #f0f2f5",
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    color: "#0F4C81",
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
    transition: "color 0.2s ease",
  },
};
