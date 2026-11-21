// src/utils/auth.js

export function logoutUser(redirect = true) {
  localStorage.removeItem("access");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh");
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_first_name");
  localStorage.removeItem("user_last_name");
  localStorage.removeItem("user_id");
  
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

/**
 * Format and resolve a human-friendly display name from a user object or staff record
 */
export function resolveUserDisplayName(user) {
  if (!user) return "";
  const first = (user.first_name || "").trim();
  const last = (user.last_name || "").trim();
  if (first || last) {
    return `${first} ${last}`.trim();
  }
  if (user.full_name) {
    return user.full_name.trim();
  }
  if (user.username && !user.username.includes("@")) {
    return user.username.trim();
  }
  if (user.email) {
    const namePart = user.email.split("@")[0];
    const formatted = namePart
      .replace(/[._-]+/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return formatted || namePart;
  }
  if (user.mobile_no) {
    return `User (${user.mobile_no})`;
  }
  if (user.role?.name) {
    return `${user.role.name} Staff`;
  }
  return "";
}

/**
 * Get current logged in user's display name from localStorage, fallback to role or email
 */
export function getCurrentUserDisplayName() {
  const storedName = localStorage.getItem("user_name");
  if (
    storedName &&
    storedName !== "Sales Person" &&
    storedName !== "null" &&
    storedName !== "undefined"
  ) {
    return storedName;
  }
  const email = localStorage.getItem("user_email");
  if (email) {
    const namePart = email.split("@")[0];
    return namePart
      .replace(/[._-]+/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  const role = localStorage.getItem("user_role");
  if (role) {
    return `${role.charAt(0).toUpperCase() + role.slice(1)} Person`;
  }
  return "Sales Person";
}

/**
 * Automatically update existing design requests where salesPersonName was left as "Sales Person"
 */
export function healDesignRequests(currentUserName) {
  const nameToUse = currentUserName || getCurrentUserDisplayName();
  if (!nameToUse || nameToUse === "Sales Person") return;
  try {
    const raw = localStorage.getItem("nnit_design_requests");
    if (!raw) return;
    const list = JSON.parse(raw);
    let changed = false;
    const updated = list.map((item) => {
      if (!item.salesPersonName || item.salesPersonName === "Sales Person") {
        changed = true;
        return { ...item, salesPersonName: nameToUse };
      }
      return item;
    });
    if (changed) {
      localStorage.setItem("nnit_design_requests", JSON.stringify(updated));
      window.dispatchEvent(new Event("designRequestUpdated"));
    }
  } catch (e) {
    console.warn("Could not heal design requests:", e);
  }
}

/**
 * Check whether a design request belongs to the current user (or if the user is an admin / superuser)
 * - Admin / Superadmin: Always returns true (sees all entries)
 * - Sales Person / Staff: Returns true only if they created / sent the request
 */
export function isRequestOwnedByUser(request, { userRole, isSuperUser, userName, userData, userEmail, userId } = {}) {
  if (!request) return false;

  // 1. Superuser / Admin role gets unrestricted access to all entries
  const roleName = (userRole?.name || localStorage.getItem("user_role") || "").toLowerCase();
  const isSuper = isSuperUser || roleName === "admin" || roleName === "superadmin";
  if (isSuper) return true;

  // Current user identifiers
  const myId = String(userId || userData?.id || localStorage.getItem("user_id") || "");
  const myEmail = (userEmail || userData?.email || localStorage.getItem("user_email") || "").trim().toLowerCase();
  const myName = (userName || resolveUserDisplayName(userData) || getCurrentUserDisplayName() || "").trim().toLowerCase();

  // 2. Check created_by_id / userId match
  if (myId && (String(request.created_by_id) === myId || String(request.userId) === myId)) {
    return true;
  }

  // 3. Check exact email match
  if (myEmail && request.salesPersonEmail) {
    if (request.salesPersonEmail.trim().toLowerCase() === myEmail) {
      return true;
    }
  }

  // 4. Check display name match (case-insensitive)
  const reqName = (request.salesPersonName || "").trim().toLowerCase();
  if (reqName && myName) {
    if (reqName === myName || reqName.includes(myName) || myName.includes(reqName)) {
      return true;
    }
  }

  // 5. Check first_name / last_name from userData or localStorage
  const firstName = (userData?.first_name || localStorage.getItem("user_first_name") || "").trim().toLowerCase();
  const lastName = (userData?.last_name || localStorage.getItem("user_last_name") || "").trim().toLowerCase();
  if (firstName && reqName.includes(firstName)) return true;
  if (lastName && reqName.includes(lastName)) return true;

  // 6. If request is from backend lead assigned to or created by current user
  if (myId) {
    if (String(request.assigned_to_id || request.assign_to) === myId || String(request.created_by) === myId) {
      return true;
    }
  }

  return false;
}

/**
 * Safely check if two design request objects refer to the exact same request.
 * Matches strictly on unique ID or reqNo, or non-null leadId.
 * NEVER matches null === null or undefined === undefined.
 */
export function isSameDesignRequest(a, b) {
  if (!a || !b) return false;

  // 1. Exact ID match (case-insensitive)
  if (a.id && b.id && String(a.id).trim().toLowerCase() === String(b.id).trim().toLowerCase()) {
    return true;
  }

  // 2. Exact reqNo match (case-insensitive)
  if (a.reqNo && b.reqNo && String(a.reqNo).trim().toLowerCase() === String(b.reqNo).trim().toLowerCase()) {
    return true;
  }

  // 3. Lead ID match ONLY if both have a valid non-empty, non-null leadId
  const aLead =
    a.leadId !== null &&
    a.leadId !== undefined &&
    a.leadId !== "" &&
    a.leadId !== "null" &&
    a.leadId !== "undefined"
      ? String(a.leadId).trim()
      : null;
  const bLead =
    b.leadId !== null &&
    b.leadId !== undefined &&
    b.leadId !== "" &&
    b.leadId !== "null" &&
    b.leadId !== "undefined"
      ? String(b.leadId).trim()
      : null;

  if (aLead && bLead && aLead === bLead) {
    return true;
  }

  return false;
}



