import { useState, useEffect } from 'react';

export function useUserRole(baseApi) {
  const [userRole, setUserRole] = useState(null);
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
      setIsSuperUser(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch(`${baseApi}/auth/me/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then(data => {
        setUserRole(data.role);
        setIsSuperUser(!!data.is_superuser || data.role?.name?.toLowerCase() === 'admin');
      })
      .catch(err => {
        console.error("Failed to fetch user role:", err);
        setUserRole(null);
        setIsSuperUser(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [baseApi, trigger]);

  const permissions = userRole?.permissions || {};
  return { userRole, permissions, isLoading, isSuperUser };
}

export function useModulePermissions(moduleKey) {
  const baseApi = import.meta.env.VITE_BASE_API_URL;
  const { userRole, permissions, isLoading, isSuperUser } = useUserRole(baseApi);

  const isSuper = isSuperUser || userRole?.name?.toLowerCase() === 'admin';
  const modPerms = permissions?.[moduleKey] || {};

  const canView = isSuper || (modPerms.can_view !== false);
  const canCreate = isSuper || (modPerms.can_create !== false);
  const canEdit = isSuper || (modPerms.can_edit !== false);
  const canDelete = isSuper || (modPerms.can_delete !== false);

  return {
    canView,
    canCreate,
    canEdit,
    canDelete,
    userRole,
    permissions,
    isLoading,
    isSuper
  };
}