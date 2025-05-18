from rest_framework import viewsets, permissions
from .models import Blog, Post, Comment
from .serializers import BlogSerializer, PostSerializer, CommentSerializer, UserSerializer
from django.contrib.auth.models import User
from rest_framework.decorators import action
from rest_framework.response import Response
from .permissions import IsAuthorOrReadOnly
from rest_framework.exceptions import PermissionDenied

# Вьюсеты для работы с блогами
class BlogViewSet(viewsets.ModelViewSet):
    queryset = Blog.objects.all()
    serializer_class = BlogSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)



# Вьюсеты для работы с постами

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    def perform_create(self, serializer):
        blog = serializer.validated_data.get("blog")
        if blog.author != self.request.user:
            raise PermissionDenied("Вы не являетесь автором этого блога.")
        serializer.save() 

# Вьюсеты для работы с комментариями
class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer

# Вьюсеты для работы с пользователями
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]  # Разрешаем доступ всем для создания пользователей

    @action(detail=False, methods=['get'])
    def id(self, request):
        user = request.user
        return Response({'user_id': user.id})
