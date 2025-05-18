from rest_framework import permissions

class IsAuthorOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Разрешено чтение для всех
        if request.method in permissions.SAFE_METHODS:
            return True
        # Только автор может изменять или удалять
        return obj.author == request.user