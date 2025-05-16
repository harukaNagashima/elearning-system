# 📘 WOVN Glossary Automation Script

このPythonスクリプトは、WOVN.io の管理画面で用語集（Glossary）の一括登録を自動化するためのツールです。CSVで管理している多言語用語リストを、UIを操作して一括で登録できます。

## ✅ 機能

- ログイン画面の自動入力
- 用語集追加モーダルの操作
- 多言語翻訳入力（最大4言語）
- 「全ての言語」へのチェックと次への強制進行
- モーダル閉鎖の確認
- 失敗時のHTML保存

## 🧰 必要要件

- Python 3.9+
- Google Chrome（135以上推奨）
- ChromeDriver（バージョンはChromeに対応したものを使用）
- インストール済みライブラリ:
  ```bash
  pip install selenium pandas
  ```

## 🗂️ ファイル構成

- `wovn_glossary_final_complete_output.py` … メインスクリプト
- `shortterm_glossary.csv` … 登録用の用語CSVファイル（`ja`, `en`, `ko`, `zh-CHS`, `zh-CHT` など）

## 📄 CSVフォーマット

以下のようなヘッダーを含むCSVを用意してください：

| ja       | en       | ko      | zh-CHS | zh-CHT |
|----------|----------|---------|--------|--------|
| オメガ   | OMEGA    | 오메가  | 欧米茄  | 歐米茄  |

- `ja`（日本語）は必須
- 他言語は任意（ただしスクリプトでは最大4言語までに対応）

## 🔧 使用手順

1. **設定の変更（任意）**  
   スクリプト先頭の以下変数を環境に応じて変更してください：

   ```python
   CSV_PATH = "/path/to/your/shortterm_glossary.csv"
   CHROMEDRIVER_PATH = "/Applications/chromedriver"
   ```

2. **スクリプト実行**

   ```bash
   python3 wovn_glossary_final_complete_output.py
   ```

3. **ログイン情報の入力**
   - メールアドレス
   - パスワード（非表示）

4. **用語集ページを手動で開く**
   - ブラウザが自動起動し、WOVNにログインします。
   - 用語集ページを手動で開き「+ 用語追加」ボタンが表示された状態でEnterを押してください。

5. **自動登録開始**

## ❗ トラブルシューティング

- **「次へ」ボタンが押せない**
  - 「全ての言語」が選択されていない可能性があります。
- **stale element reference**
  - 画面遷移やDOM再描画のタイミングズレ。自動待機は組み込まれていますが、安定しない場合は待機時間を調整してください。
- **登録失敗時**
  - 該当ページのHTMLが `error_用語.html` という名前で保存されます。

## 💡 Tips

- 言語の順番を固定したい場合は、以下を編集できます：

   ```python
   term1 = row["en"]
   term2 = row["ko"]
   term3 = row["zh-CHS"]
   term4 = row["zh-CHT"]
   ```
