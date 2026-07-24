import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser, faBars, faXmark } from "@fortawesome/free-solid-svg-icons";

// SVG/PNG Logo path from your assets folder
import logoNNIT from "../assets/logo-nnit.svg";

const Navbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = useCallback(() => {
    window.dispatchEvent(new Event("authChange"));
    setIsAuthenticated(false);
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login", { replace: true });
  }, [navigate]);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("access");
    if (!token) return setIsAuthenticated(false);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASE_API_URL}/auth/dj-rest-auth/user/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      res.ok ? setIsAuthenticated(true) : handleLogout();
    } catch {
      handleLogout();
    }
  }, [handleLogout]);

  useEffect(() => {
    const publicPaths = ["/login", "/register"];
    if (!publicPaths.includes(location.pathname)) {
      checkAuth();
    } else {
      setIsAuthenticated(false);
    }
  }, [location, checkAuth]);

  // Handle mobile drawer toggling
  const handleToggleMobileMenu = () => {
    if (onMenuClick) {
      onMenuClick(); // Trigger external sidebar handler if passed
    } else {
      setIsMobileMenuOpen((prev) => !prev); // Use built-in mobile sidebar
    }
  };

  return (
    <>
      <nav style={styles.navbar}>
        {/* LEFT: Mobile Hamburger Icon & Logo */}
        <div style={styles.left}>
          <button
            onClick={handleToggleMobileMenu}
            style={styles.menuBtn}
            className="md:hidden"
            title="Toggle Sidebar"
          >
            <FontAwesomeIcon icon={faBars} size="lg" />
          </button>

          <Link to="/dashboard" style={styles.brand}>
            <img
              src={logoNNIT}
              alt="NNIT Logo"
              style={styles.logoImg}
            />
          </Link>
        </div>

        {/* RIGHT: Profile / Login Button */}
        <div style={styles.links}>
          {isAuthenticated ? (
            <Link to="/profile" style={styles.profileLink} title="Profile">
              <FontAwesomeIcon icon={faCircleUser} style={styles.profileIcon} />
            </Link>
          ) : (
            <Link to="/login" style={styles.loginBtn}>
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* MOBILE SIDEBAR OVERLAY (Fallback if onMenuClick is not provided) */}
      {isMobileMenuOpen && (
        <div style={styles.overlay} onClick={() => setIsMobileMenuOpen(false)}>
          <div style={styles.sidebar} onClick={(e) => e.stopPropagation()}>
            <div style={styles.sidebarHeader}>
              <img src={logoNNIT} alt="NNIT Logo" style={{ height: "26px" }} />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                style={styles.closeBtn}
              >
                <FontAwesomeIcon icon={faXmark} size="lg" />
              </button>
            </div>
            
            <div style={styles.sidebarContent}>
              <Link
                to="/dashboard"
                style={styles.sidebarLink}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    style={styles.sidebarLink}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    style={styles.logoutBtn}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  style={styles.sidebarLoginBtn}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 24px",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    backdropFilter: "blur(8px)",
    borderBottom: "3px solid #F2721C", // NNIT Brand Orange
    boxShadow: "0 2px 12px rgba(0, 80, 160, 0.12)",
    position: "fixed",
    top: "0",
    width: "100%",
    zIndex: 1000,
    minHeight: "70px",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  menuBtn: {
    background: "none",
    border: "none",
    color: "#0050A0", // NNIT Deep Blue
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
  },
  logoImg: {
    height: "45px",
    width: "auto",
    objectFit: "contain",
  },
  links: {
    display: "flex",
    alignItems: "center",
  },
  profileLink: {
    color: "#0050A0",
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
  },
  profileIcon: {
    fontSize: "28px", // Increased from 22px
  },
  loginBtn: {
    color: "#FFFFFF",
    backgroundColor: "#F2721C",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "14px",
    padding: "10px 20px", // Increased padding
    borderRadius: "24px",
    boxShadow: "0 2px 8px rgba(242, 114, 28, 0.3)",
    transition: "all 0.3s ease",
  },

  /* Mobile Sidebar Styles */
  overlay: {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    zIndex: 1100,
    display: "flex",
  },
  sidebar: {
    width: "250px",
    height: "100%",
    backgroundColor: "#FFFFFF",
    boxShadow: "2px 0 10px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    padding: "16px",
  },
  sidebarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #E5E7EB",
    paddingBottom: "12px",
    marginBottom: "16px",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#0050A0",
    fontSize: "18px",
    cursor: "pointer",
  },
  sidebarContent: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  sidebarLink: {
    color: "#0050A0",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "15px",
    padding: "8px 0",
  },
  sidebarLoginBtn: {
    textAlign: "center",
    backgroundColor: "#F2721C",
    color: "#FFFFFF",
    padding: "10px",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: "600",
    marginTop: "10px",
  },
  logoutBtn: {
    textAlign: "left",
    background: "none",
    border: "none",
    color: "#DC2626",
    fontWeight: "600",
    fontSize: "15px",
    padding: "8px 0",
    cursor: "pointer",
  },
};

export default Navbar;