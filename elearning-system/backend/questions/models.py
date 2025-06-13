from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Genre(models.Model):
    id = models.CharField(max_length=10, primary_key=True)  # g02, g03, etc.
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id} - {self.name}"

class Question(models.Model):
    DIFFICULTY_CHOICES = [
        (1, '初級'),
        (2, '中級'),
        (3, '上級'),
    ]
    
    id = models.CharField(max_length=20, primary_key=True)  # QFB00001, etc.
    genre = models.ForeignKey(Genre, on_delete=models.CASCADE, related_name='questions')
    difficulty = models.IntegerField(choices=DIFFICULTY_CHOICES)
    point_weight = models.IntegerField(default=1)
    time_weight = models.IntegerField(default=1)
    body = models.TextField()  # 問題文
    object = models.TextField(blank=True)  # 問題の対象（TextFieldに変更）
    clarification = models.TextField(blank=True)  # 解説
    author_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='authored_questions')
    modified_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='modified_questions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.id} - {self.body[:50]}..."

class Choice(models.Model):
    id = models.CharField(max_length=50, primary_key=True)  # a000000077, etc. (サイズ拡張)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    content = models.TextField()  # 選択肢の内容
    is_correct = models.BooleanField(default=False)
    order_index = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order_index']

    def __str__(self):
        marker = "◯" if self.is_correct else "×"
        return f"{self.question.id} - {self.content[:30]}... {marker}"
