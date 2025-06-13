# Google API セットアップガイド

このスクリプトを使用するには、Google Cloud Consoleで認証情報を設定する必要があります。

## セットアップ手順

1. **Google Cloud Consoleにアクセス**
   - https://console.cloud.google.com/

2. **新しいプロジェクトを作成（または既存のプロジェクトを使用）**

3. **APIを有効化**
   - 「APIとサービス」→「ライブラリ」から以下のAPIを有効化：
     - Google Sheets API
     - Google Drive API

4. **認証情報を作成**
   - 「APIとサービス」→「認証情報」
   - 「+ 認証情報を作成」→「OAuth クライアント ID」
   - アプリケーションの種類：「デスクトップアプリ」
   - 名前を付けて作成

5. **credentials.jsonをダウンロード**
   - 作成したOAuth 2.0クライアントIDの右側にあるダウンロードボタンをクリック
   - ダウンロードしたファイルを `credentials.json` という名前でこのディレクトリに保存

## 初回実行時

初回実行時はブラウザが開き、Googleアカウントでの認証が求められます。
認証後、`token.pickle` ファイルが作成され、次回以降は自動的に認証されます。

## 必要なパッケージのインストール

```bash
pip install -r requirements.txt
```