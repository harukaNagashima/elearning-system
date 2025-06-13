# Amazon Linux で rclone を使用する方法

## 特記事項

Amazon Linux（EC2インスタンスなど）でrcloneを使用する場合、いくつか注意点があります。

## 1. インストール

```bash
# Amazon Linux 2023 / Amazon Linux 2
sudo yum install -y curl unzip

# rcloneをダウンロード＆インストール
curl -O https://downloads.rclone.org/rclone-current-linux-amd64.zip
unzip rclone-current-linux-amd64.zip
cd rclone-*-linux-amd64
sudo cp rclone /usr/bin/
sudo chown root:root /usr/bin/rclone
sudo chmod 755 /usr/bin/rclone

# バージョン確認
rclone version
```

## 2. Google Drive設定（ヘッドレス環境）

Amazon LinuxはGUI環境がないため、ブラウザ認証ができません。以下の方法で設定します：

### 方法1: ローカルマシンで認証してコピー

1. **ローカルマシン（Mac/Windows）で設定**
```bash
# ローカルマシンで実行
rclone config
# 通常通りGoogle Driveを設定
```

2. **設定ファイルをコピー**
```bash
# ローカルマシンで設定を確認
cat ~/.config/rclone/rclone.conf

# Amazon Linuxインスタンスに設定をコピー
scp ~/.config/rclone/rclone.conf ec2-user@your-instance:/home/ec2-user/
```

3. **Amazon Linuxで設定ファイルを配置**
```bash
# Amazon Linuxで実行
mkdir -p ~/.config/rclone
mv ~/rclone.conf ~/.config/rclone/
chmod 600 ~/.config/rclone/rclone.conf
```

### 方法2: リモート設定を使用

```bash
# Amazon Linuxで実行
rclone config

# 設定手順：
# 1. n (New remote)
# 2. 名前を入力（例: gdrive）
# 3. Storage typeで Google Drive を選択
# 4. Client IDとClient Secretは空欄でEnter
# 5. Scopeは 1 (Full access)
# 6. Use auto config? → n （重要）
# 7. 表示されたURLをローカルPCのブラウザで開く
# 8. Googleアカウントでログイン
# 9. 認証コードをコピーしてターミナルに貼り付け
# 10. Configure this as a Shared Drive? → n
# 11. y で確定
```

## 3. cronでの自動実行

```bash
# crontabを編集
crontab -e

# 毎日深夜2時にバックアップを実行
0 2 * * * /usr/bin/rclone copy /home/ec2-user/data gdrive:backup/$(date +\%Y\%m\%d)/ --log-file=/home/ec2-user/rclone.log
```

## 4. systemdサービスとして実行

```bash
# サービスファイルを作成
sudo nano /etc/systemd/system/rclone-backup.service
```

```ini
[Unit]
Description=Rclone backup service
After=network-online.target

[Service]
Type=oneshot
User=ec2-user
ExecStart=/usr/bin/rclone copy /home/ec2-user/data gdrive:backup/ --log-file=/var/log/rclone-backup.log

[Install]
WantedBy=multi-user.target
```

```bash
# サービスを有効化
sudo systemctl enable rclone-backup.service
sudo systemctl start rclone-backup.service
```

## 5. IAMロールを使用したS3連携（参考）

Amazon LinuxならS3も簡単に使えます：

```bash
# S3の設定（IAMロール使用）
rclone config
# 1. n (New remote)
# 2. 名前を入力（例: s3）
# 3. Storage typeで Amazon S3 を選択
# 4. AWS Credentials: 1 (IAM Role)
# 5. Region: ap-northeast-1 (東京)
# 6. 残りはデフォルト

# S3にコピー
rclone copy file.csv s3:your-bucket/path/
```

## 6. トラブルシューティング

### 権限エラーの場合
```bash
# SELinuxが原因の場合
sudo setenforce 0  # 一時的に無効化
# または
sudo setsebool -P httpd_can_network_connect 1
```

### メモリ不足の場合
```bash
# 転送を制限
rclone copy large_file.csv gdrive: --transfers 1 --checkers 1
```

### ネットワークタイムアウトの場合
```bash
# タイムアウトを延長
rclone copy file.csv gdrive: --timeout 30m --contimeout 60s
```