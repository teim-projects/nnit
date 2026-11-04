// src/utils/auth.js

export function logoutUser(redirect = true) {
  localStorage.removeItem("access");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh");
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("user_role");
  
  // Dispatch custom event so App and Navbar react immediately
  window.dispatchEvent(new Event("authChange"));

  if (redirect && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export function getStoredToken() {
  return (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  );
}
