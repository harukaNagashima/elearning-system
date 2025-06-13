# rcloneを使用したGoogle DriveへのCSVアップロード方法

## 1. rcloneのインストール

### macOS
```bash
brew install rclone
```

### Windows
[公式サイト](https://rclone.org/downloads/)からダウンロードしてインストール

### Linux
```bash
curl https://rclone.org/install.sh | sudo bash
```

## 2. Google Driveの設定

```bash
rclone config
```

設定手順：
1. `n` (New remote) を選択
2. 名前を入力（例: `gdrive`）
3. Storage typeで `Google Drive` を選択（番号を入力）
4. Client IDとClient Secretは空欄でEnter
5. Scopeは `1` (Full access) を選択
6. Root folder IDは空欄でEnter
7. Service Account Credentialsは空欄でEnter
8. Edit advanced config? → `n`
9. Use auto config? → `y`
10. ブラウザが開いてGoogleアカウントでログイン
11. Configure this as a Shared Drive? → `n`
12. 設定確認 → `y`
13. `q` で設定終了

## 3. 基本的な使い方

### ファイルのアップロード
```bash
# 単一ファイル
rclone copy your_file.csv gdrive:folder_name/

# 複数ファイル
rclone copy *.csv gdrive:folder_name/

# フォルダごと
rclone copy ./output gdrive:backup/
```

### ファイルの確認
```bash
# フォルダ内容を表示
rclone ls gdrive:folder_name/

# ツリー表示
rclone tree gdrive:

# ファイルサイズも表示
rclone lsl gdrive:folder_name/
```

### ファイルの同期
```bash
# ローカル→リモート（削除も同期）
rclone sync ./local_folder gdrive:remote_folder/

# 削除せずに同期
rclone copy ./local_folder gdrive:remote_folder/ --update
```

## 4. Pythonスクリプトから使用

```python
import subprocess
import os

def upload_to_gdrive(local_file, remote_path=""):
    """
    rcloneを使用してファイルをGoogle Driveにアップロード
    
    Args:
        local_file: アップロードするローカルファイルパス
        remote_path: Google Drive上のパス（例: "folder/subfolder/"）
    """
    # rcloneコマンドを構築
    cmd = ["rclone", "copy", local_file, f"gdrive:{remote_path}"]
    
    try:
        # コマンド実行
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ アップロード成功: {local_file} → gdrive:{remote_path}")
        else:
            print(f"❌ アップロード失敗: {result.stderr}")
            
    except FileNotFoundError:
        print("❌ rcloneがインストールされていません")
    except Exception as e:
        print(f"❌ エラー: {e}")

# 使用例
if __name__ == "__main__":
    # CSVファイルをアップロード
    upload_to_gdrive("output.csv", "wovn_data/")
    
    # 複数ファイルを一括アップロード
    csv_files = [f for f in os.listdir(".") if f.endswith(".csv")]
    for csv_file in csv_files:
        upload_to_gdrive(csv_file, "csv_backup/")
```

## 5. 便利なオプション

```bash
# 進捗表示
rclone copy file.csv gdrive: --progress

# 帯域制限（例: 10MB/s）
rclone copy file.csv gdrive: --bwlimit 10M

# ドライラン（実際にはアップロードしない）
rclone copy file.csv gdrive: --dry-run

# ログ出力
rclone copy file.csv gdrive: --log-file=upload.log --log-level INFO
```

## 6. トラブルシューティング

### 認証エラーの場合
```bash
# 設定を確認
rclone config show gdrive

# 再認証
rclone config reconnect gdrive:
```

### アップロード速度が遅い場合
```bash
# 並列アップロード数を増やす
rclone copy file.csv gdrive: --transfers 4
```

### 大きなファイルの場合
```bash
# チャンクサイズを調整（デフォルト8M）
rclone copy large_file.csv gdrive: --drive-chunk-size 32M
```