# AWS Production Deployment Guide

このガイドでは、E-learningシステムをAWS本番環境にデプロイする手順を説明します。

## アーキテクチャ概要

```
Internet → Route 53 → ALB → ECS Fargate → RDS MySQL
                           ↓
                      ElastiCache Redis
                           ↓
                         S3 Bucket
```

## 必要なAWSサービス

- **ECS Fargate**: コンテナ実行環境
- **RDS MySQL**: データベース
- **ElastiCache Redis**: キャッシュ・セッション管理
- **Application Load Balancer**: 負荷分散
- **ECR**: Dockerイメージリポジトリ
- **S3**: 静的ファイル配信
- **Route 53**: DNS管理
- **ACM**: SSL証明書
- **CloudWatch**: 監視・ログ

## デプロイ手順

### 1. 事前準備

```bash
# AWS CLIの設定
aws configure

# 必要な環境変数を設定
export DB_PASSWORD="your-secure-database-password"
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
```

### 2. インフラストラクチャのデプロイ

```bash
# CloudFormationでインフラを作成
./deploy/deploy.sh
```

### 3. 環境設定

1. `.env.production.example`をコピーして`.env.production`を作成
2. 実際の値を設定:
   - SECRET_KEY: Django用の秘密鍵
   - DATABASE_URL: RDSエンドポイント
   - REDIS_URL: ElastiCacheエンドポイント
   - ALLOWED_HOSTS: ドメイン名

### 4. DNS設定

Route 53でドメインを設定:
```bash
# ホストゾーンを作成
aws route53 create-hosted-zone --name your-domain.com --caller-reference $(date +%s)

# ALBをポイントするAレコードを作成
```

### 5. SSL証明書

AWS Certificate Managerで証明書を取得:
```bash
# 証明書をリクエスト
aws acm request-certificate \
    --domain-name your-domain.com \
    --subject-alternative-names www.your-domain.com \
    --validation-method DNS
```

### 6. データベース初期化

```bash
# ECSタスクで初期マイグレーションを実行
aws ecs run-task \
    --cluster elearning-system-cluster \
    --task-definition elearning-system \
    --overrides '{"containerOverrides":[{"name":"backend","command":["python","manage.py","migrate"]}]}'

# 管理者ユーザーを作成
aws ecs run-task \
    --cluster elearning-system-cluster \
    --task-definition elearning-system \
    --overrides '{"containerOverrides":[{"name":"backend","command":["python","manage.py","createsuperuser"]}]}'
```

### 7. 初期データ投入

```bash
# CSVデータを投入
aws ecs run-task \
    --cluster elearning-system-cluster \
    --task-definition elearning-system \
    --overrides '{"containerOverrides":[{"name":"backend","command":["python","manage.py","load_csv_data","path/to/your/data.csv"]}]}'
```

## 運用管理

### 監視設定

CloudWatchで以下のメトリクスを監視:
- ECSタスクのCPU/メモリ使用率
- RDSの接続数・クエリ性能
- ALBのレスポンス時間・エラー率

### ログ管理

```bash
# アプリケーションログの確認
aws logs tail /ecs/elearning-backend --follow

# Nginxアクセスログの確認
aws logs tail /ecs/elearning-frontend --follow
```

### スケーリング

```bash
# ECSサービスのタスク数を変更
aws ecs update-service \
    --cluster elearning-system-cluster \
    --service elearning-system-service \
    --desired-count 3
```

### バックアップ

- RDS: 自動バックアップが7日間保持
- S3: バージョニング有効

### アップデート手順

```bash
# 新しいイメージをビルド・プッシュ
./deploy/deploy.sh

# ECSサービスが自動的にローリングアップデート
```

## セキュリティ考慮事項

1. **IAMロール**: 最小権限の原則
2. **セキュリティグループ**: 必要最小限のポート開放
3. **暗号化**: RDS・EBS・S3すべて暗号化済み
4. **秘密情報**: AWS Secrets Managerで管理
5. **SSL/TLS**: ALBでSSL終端

## トラブルシューティング

### よくある問題

1. **ECSタスクが起動しない**
   ```bash
   aws ecs describe-tasks --cluster elearning-system-cluster --tasks TASK_ID
   ```

2. **データベース接続エラー**
   - セキュリティグループの設定確認
   - 環境変数の確認

3. **ロードバランサーのヘルスチェック失敗**
   - アプリケーションの起動状態確認
   - ヘルスチェックパスの確認

### サポート

- CloudWatchログで詳細なエラー情報を確認
- AWS Supportケースの作成
- Sentryでアプリケーションエラーの追跡

## コスト最適化

1. **リザーブドインスタンス**: RDSとElastiCache
2. **スポットインスタンス**: 開発環境では利用可能
3. **Auto Scaling**: 需要に応じたスケーリング
4. **S3ライフサイクル**: 古いログの自動削除

## 注意事項

- 本番デプロイ前に必ずステージング環境でテスト
- データベースバックアップの確認
- ドメイン設定とSSL証明書の準備
- 負荷テストの実行