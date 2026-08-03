from rest_framework.permissions import BasePermission

class IsAdminOrSubAdmin(BasePermission):
    """
    Allow access to:
      - superuser (treated as admin)
      - users with role 'admin'
      - users with role 'sub-admin'
    Deny others.
    """
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser:
            return True
        role_name = getattr(getattr(user, 'role', None), 'name', '') or ''
        return role_name.lower() in ('admin', 'sub-admin')
    

  
class StaffObjectPermission(BasePermission):
    """
    Object-level permissions:
      - superuser/admin (same power): full control (retrieve, update, delete)
      - sub-admin: can retrieve and update, but cannot delete
      - others: no object-level access
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        # is admin-like (superuser or role == 'admin')
        role_name = getattr(getattr(user, 'role', None), 'name', '') or ''
        is_admin_like = user.is_superuser or role_name.lower() == 'admin'
        is_subadmin = role_name.lower() == 'sub-admin'

        # Admin-like: allow everything
        if is_admin_like:
            return True

        # Subadmin: allow GET, PUT, PATCH but NOT DELETE
        if is_subadmin:
            if request.method == 'DELETE':
                return False
            return True

        # Others: deny
        return False


class HasModulePermission(BasePermission):
    """
    Checks user's Role permissions against view.module_key:
      - GET / HEAD / OPTIONS -> checks 'can_view'
      - POST -> checks 'can_create'
      - PUT / PATCH -> checks 'can_edit'
      - DELETE -> checks 'can_delete'
    Superusers & 'admin' role bypass restrictions.
    """
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        
        if user.is_superuser:
            return True
        
        role = getattr(user, 'role', None)
        if not role:
            return True
        
        role_name = getattr(role, 'name', '') or ''
        if role_name.lower() == 'admin':
            return True

        module_key = getattr(view, 'module_key', None)
        if not module_key:
            return True

        if role_name.lower() == 'designer' and module_key == 'leads' and request.method in ('GET', 'HEAD', 'OPTIONS', 'PATCH'):
            return True

        perms = role.get_permissions().get(module_key)
        if perms is None or not isinstance(perms, dict):
            return True

        def _is_truthy(val):
            return val is True or val == 1 or str(val).lower() == 'true'

        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return _is_truthy(perms.get('can_view', False))
        elif request.method == 'POST':
            return _is_truthy(perms.get('can_create', False))
        elif request.method in ('PUT', 'PATCH'):
            return _is_truthy(perms.get('can_edit', False))
        elif request.method == 'DELETE':
            return _is_truthy(perms.get('can_delete', False))
        
        return True