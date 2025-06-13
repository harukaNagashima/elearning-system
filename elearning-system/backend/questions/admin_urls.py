from django.urls import path
from .admin_views import (
    AdminGenreListCreateView, AdminGenreDetailView,
    AdminQuestionListCreateView, AdminQuestionDetailView,
    AdminUserListView, AdminUserDetailView,
    AdminStatsView, AdminQuestionBulkActionView
)

urlpatterns = [
    # ジャンル管理
    path('genres/', AdminGenreListCreateView.as_view(), name='admin_genres'),
    path('genres/<int:pk>/', AdminGenreDetailView.as_view(), name='admin_genre_detail'),
    
    # 問題管理
    path('questions/', AdminQuestionListCreateView.as_view(), name='admin_questions'),
    path('questions/<int:pk>/', AdminQuestionDetailView.as_view(), name='admin_question_detail'),
    path('questions/bulk-action/', AdminQuestionBulkActionView.as_view(), name='admin_question_bulk'),
    
    # ユーザー管理
    path('users/', AdminUserListView.as_view(), name='admin_users'),
    path('users/<int:pk>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
    
    # 統計
    path('stats/', AdminStatsView.as_view(), name='admin_stats'),
]