from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Genre, Question, Choice
from .serializers import GenreSerializer, QuestionSerializer, ChoiceSerializer
from accounts.serializers import UserSerializer

User = get_user_model()


class AdminGenreListCreateView(generics.ListCreateAPIView):
    """
    管理者用ジャンル一覧取得・作成API
    """
    queryset = Genre.objects.all().order_by('name')
    serializer_class = GenreSerializer
    permission_classes = [IsAdminUser]


class AdminGenreDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    管理者用ジャンル詳細・更新・削除API
    """
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [IsAdminUser]


class AdminQuestionListCreateView(generics.ListCreateAPIView):
    """
    管理者用問題一覧取得・作成API
    """
    serializer_class = QuestionSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = Question.objects.all().order_by('-created_at')
        
        # フィルタリング
        genre = self.request.query_params.get('genre')
        if genre:
            queryset = queryset.filter(genre_id=genre)
        
        difficulty = self.request.query_params.get('difficulty')
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(body__icontains=search) | 
                Q(object__icontains=search)
            )
        
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset


class AdminQuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    管理者用問題詳細・更新・削除API
    """
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAdminUser]


class AdminUserListView(generics.ListAPIView):
    """
    管理者用ユーザー一覧取得API
    """
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        
        # フィルタリング
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) | 
                Q(email__icontains=search) | 
                Q(first_name__icontains=search) | 
                Q(last_name__icontains=search)
            )
        
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        is_staff = self.request.query_params.get('is_staff')
        if is_staff is not None:
            queryset = queryset.filter(is_staff=is_staff.lower() == 'true')
        
        return queryset


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    """
    管理者用ユーザー詳細・更新API
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


class AdminStatsView(APIView):
    """
    管理者用統計情報取得API
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        total_questions = Question.objects.count()
        active_questions = Question.objects.filter(is_active=True).count()
        total_genres = Genre.objects.count()
        
        # 最近登録されたユーザー（過去7日）
        from django.utils import timezone
        from datetime import timedelta
        recent_users = User.objects.filter(
            date_joined__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'recent_users': recent_users,
            'total_questions': total_questions,
            'active_questions': active_questions,
            'total_genres': total_genres,
        })


class AdminQuestionBulkActionView(APIView):
    """
    管理者用問題一括操作API
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        action = request.data.get('action')
        question_ids = request.data.get('question_ids', [])
        
        if not action or not question_ids:
            return Response(
                {'error': 'アクションと問題IDが必要です'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        questions = Question.objects.filter(id__in=question_ids)
        
        if action == 'activate':
            questions.update(is_active=True)
            message = f'{questions.count()}件の問題を有効化しました'
        elif action == 'deactivate':
            questions.update(is_active=False)
            message = f'{questions.count()}件の問題を無効化しました'
        elif action == 'delete':
            count = questions.count()
            questions.delete()
            message = f'{count}件の問題を削除しました'
        else:
            return Response(
                {'error': '無効なアクションです'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({'message': message})