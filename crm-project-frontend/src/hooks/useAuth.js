import { useState, useEffect } from 'react';
import { logoutUser, resolveUserDisplayName, healDesignRequests } from '../utils/auth';

export function useUserRole(baseApi) {
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userName, setUserName] = useState(() => localStorage.getItem("user_name") || "");
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    const handleAuthChange = () => {
      setTrigger(prev => prev + 1);
    };
    window.addEventListener("authChange", handleAuthChange);
    return () => {
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setUserRole(null);
      setUserData(null);
      setUserName("");
      setIsSuperUser(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch(`${baseApi}/auth/me/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            logoutUser(true);
          }
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then(data => {
        setUserData(data);
        setUserRole(data.role);
        setIsSuperUser(!!data.is_superuser || data.role?.name?.toLowerCase() === 'admin');

        // Resolve display name and persist to localStorage
        const resolvedName = resolveUserDisplayName(data);
        if (resolvedName) {
          setUserName(resolvedName);
          localStorage.setItem("user_name", resolvedName);
          // Automatically heal any existing design requests that had placeholder "Sales Person"
          healDesignRequests(resolvedName);
        }
        if (data.email) localStorage.setItem("user_email", data.email);
        if (data.first_name) localStorage.setItem("user_first_name", data.first_name);
        if (data.last_name) localStorage.setItem("user_last_name", data.last_name);
        if (data.id) localStorage.setItem("user_id", String(data.id));
        if (data.role?.name) localStorage.setItem("user_role", data.role.name);
      })
      .catch(err => {
        console.error("Failed to fetch user role:", err);
        setUserRole(null);
        setUserData(null);
        setIsSuperUser(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [baseApi, trigger]);

  const permissions = userRole?.permissions || {};
  return { userRole, userData, userName, permissions, isLoading, isSuperUser };
}

export function useModulePermissions(moduleKey) {
  const baseApi = import.meta.env.VITE_BASE_API_URL;
  const { userRole, permissions, isLoading, isSuperUser } = useUserRole(baseApi);

  const isSuper = isSuperUser || userRole?.name?.toLowerCase() === 'admin';
  const modPerms = permissions?.[moduleKey];

  const isTruthy = (val) => val === true || val === 1 || String(val).toLowerCase() === "true";

  // Superuser / Admin gets full unrestricted access across all modules
  if (isSuper) {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      userRole,
      permissions,
      isLoading,
      isSuper: true
    };
  }

  // Strictly evaluate configured role permissions for the specific module
  if (modPerms && typeof modPerms === "object") {
    return {
      canView: isTruthy(modPerms.can_view),
      canCreate: isTruthy(modPerms.can_create),
      canEdit: isTruthy(modPerms.can_edit),
      canDelete: isTruthy(modPerms.can_delete),
      userRole,
      permissions,
      isLoading,
      isSuper: false
    };
  }

  // Fallback for roles where permissions dictionary is not yet defined
  return {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    userRole,
    permissions,
    isLoading,
    isSuper: false
  };
}