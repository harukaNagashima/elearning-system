#!/usr/bin/env python3
"""
rcloneを使用してCSVファイルをGoogle Driveにアップロードするスクリプト
"""
import subprocess
import os
import sys
from datetime import datetime
from pathlib import Path

def check_rclone_installed():
    """rcloneがインストールされているか確認"""
    try:
        subprocess.run(["rclone", "version"], capture_output=True, check=True)
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False

def check_remote_configured(remote_name="gdrive"):
    """リモート設定が存在するか確認"""
    result = subprocess.run(["rclone", "listremotes"], capture_output=True, text=True)
    return f"{remote_name}:" in result.stdout

def upload_file(local_file, remote_path="", remote_name="gdrive", show_progress=True):
    """
    ファイルをGoogle Driveにアップロード
    
    Args:
        local_file: アップロードするファイルパス
        remote_path: リモートのパス（例: "folder/subfolder/"）
        remote_name: rcloneで設定したリモート名
        show_progress: 進捗を表示するか
    
    Returns:
        bool: 成功したらTrue
    """
    if not os.path.exists(local_file):
        print(f"❌ ファイルが見つかりません: {local_file}")
        return False
    
    cmd = ["rclone", "copy", local_file, f"{remote_name}:{remote_path}"]
    
    if show_progress:
        cmd.append("--progress")
    
    try:
        print(f"📤 アップロード中: {local_file} → {remote_name}:{remote_path}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ アップロード成功: {local_file}")
            return True
        else:
            print(f"❌ アップロード失敗: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ エラー: {e}")
        return False

def upload_multiple_files(file_pattern, remote_path="", remote_name="gdrive"):
    """
    複数ファイルを一括アップロード
    
    Args:
        file_pattern: ファイルパターン（例: "*.csv", "output/*.csv"）
        remote_path: リモートのパス
        remote_name: rcloneで設定したリモート名
    """
    files = list(Path(".").glob(file_pattern))
    
    if not files:
        print(f"❌ パターンに一致するファイルが見つかりません: {file_pattern}")
        return
    
    print(f"📋 {len(files)}個のファイルをアップロードします")
    
    success_count = 0
    for file in files:
        if upload_file(str(file), remote_path, remote_name, show_progress=False):
            success_count += 1
    
    print(f"\n✅ 完了: {success_count}/{len(files)} ファイルをアップロードしました")

def create_backup_folder():
    """日付付きバックアップフォルダ名を生成"""
    return f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

def main():
    # rcloneの確認
    if not check_rclone_installed():
        print("❌ rcloneがインストールされていません")
        print("インストール方法:")
        print("  macOS: brew install rclone")
        print("  その他: https://rclone.org/downloads/")
        sys.exit(1)
    
    # リモート設定の確認
    if not check_remote_configured():
        print("❌ Google Driveの設定がありません")
        print("設定方法: rclone config")
        print("詳細は RCLONE_SETUP.md を参照してください")
        sys.exit(1)
    
    # メニュー表示
    print("\n🚀 rclone CSV アップローダー")
    print("="*40)
    print("1. 単一ファイルをアップロード")
    print("2. 複数CSVファイルを一括アップロード")
    print("3. outputフォルダの内容をバックアップ")
    print("4. 特定のCSVファイルをアップロード")
    print("="*40)
    
    choice = input("選択してください (1-4): ")
    
    if choice == "1":
        file_path = input("アップロードするファイルパス: ")
        remote_path = input("リモートパス（空欄でルート）: ")
        upload_file(file_path, remote_path)
        
    elif choice == "2":
        pattern = input("ファイルパターン（例: *.csv）: ")
        remote_path = input("リモートパス（空欄でルート）: ")
        upload_multiple_files(pattern, remote_path)
        
    elif choice == "3":
        if os.path.exists("output"):
            backup_folder = create_backup_folder()
            print(f"📁 バックアップフォルダ: {backup_folder}")
            
            # outputフォルダの内容を一括アップロード
            cmd = ["rclone", "copy", "output", f"gdrive:{backup_folder}/", "--progress"]
            subprocess.run(cmd)
            print(f"✅ バックアップ完了: gdrive:{backup_folder}/")
        else:
            print("❌ outputフォルダが見つかりません")
            
    elif choice == "4":
        # 特定のCSVファイルをアップロード
        csv_files = {
            "1": ("output/wovn_install_methods_merged.csv", "WOVN導入方式マージ済み"),
            "2": ("output/service_dicts_summary.csv", "サービス辞書サマリー"),
            "3": ("wovn_install_methods_updated.csv", "WOVN導入方式更新済み")
        }
        
        print("\nアップロード可能なCSVファイル:")
        for key, (path, desc) in csv_files.items():
            if os.path.exists(path):
                print(f"  {key}. {desc} ({path})")
        
        file_choice = input("\nファイルを選択: ")
        if file_choice in csv_files:
            file_path, _ = csv_files[file_choice]
            if os.path.exists(file_path):
                remote_path = input("リモートパス（空欄でルート）: ")
                upload_file(file_path, remote_path)
            else:
                print(f"❌ ファイルが見つかりません: {file_path}")
        else:
            print("❌ 無効な選択です")
    
    else:
        print("❌ 無効な選択です")

if __name__ == "__main__":
    main()