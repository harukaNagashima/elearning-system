import pandas as pd
import requests
from bs4 import BeautifulSoup
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
import os
import time

# ▼ 入力ファイル名（任意のCSV）
input_path = 'vessel-hotel_error_urls.csv'
df = pd.read_csv(input_path)

# ▼ URL列を自動認識（大文字・小文字対応）
columns = [col.lower() for col in df.columns]
if 'url' in columns:
    url_column = df.columns[columns.index('url')]
else:
    raise ValueError("URL列（'URL' または 'url'）が見つかりません")
urls = df[url_column].tolist()

# ▼ リトライ付きGETリクエスト関数
def get_with_retry(url, retries=3, delay=1):
    for attempt in range(retries):
        try:
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            return response
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(delay)
            else:
                raise e

# ▼ WOVNスクリプト検出関数（トークン・方式・バージョン）
def detect_wovn_from_url(url):
    try:
        response = get_with_retry(url, retries=3, delay=1)
        soup = BeautifulSoup(response.text, 'html.parser')

        page_title = soup.title.string.strip() if soup.title else ""
        script = soup.find('script', src=re.compile(r'j\.wovn\.io'))
        token, install_type, version = None, "scriptが設置されていません", ""

        if script:
            raw = script.get('data-wovnio', '') or ''
            info = script.get('data-wovnio-info', '') or ''
            token_match = re.search(r'key=([a-zA-Z0-9-_]+)', raw)
            if token_match:
                token = token_match.group(1)

            # 導入方式 + バージョン
            if 'backendVersion=WOVN.proxy_' in raw:
                install_type = 'プロキシ型'
                version_match = re.search(r'backendVersion=WOVN\.proxy_([0-9.]+)', raw)
            elif 'backendVersion=WOVN.php_' in raw:
                install_type = 'PHPライブラリ型'
                version_match = re.search(r'backendVersion=WOVN\.php_([0-9.]+)', raw)
            elif 'version=Wovn.cs_' in raw:
                install_type = 'C#ライブラリ型'
                version_match = re.search(r'version=Wovn\.cs_([0-9.]+)', raw)
            elif 'version=' in raw and 'backend=true' in raw:
                install_type = 'Javaライブラリ型'
                version_match = re.search(r'version=([0-9.]+)', raw)
            elif 'version=WOVN.wp_' in info:
                install_type = 'WordPressプラグイン型'
                version_match = re.search(r'version=WOVN\.wp_([0-9.]+)', info)
            elif 'key=' in raw and 'backend' not in raw:
                install_type = 'JavaScriptタグ埋め込み型'
                version_match = None
            else:
                version_match = None

            if version_match:
                version = version_match.group(1)

        return {
            'title': page_title,
            'url': url,
            'token': token,
            '導入方式': install_type,
            'バージョン': version
        }

    except Exception as e:
        return {
            'title': '',
            'url': url,
            'token': None,
            '導入方式': f"エラー: {str(e)}",
            'バージョン': ''
        }

# ▼ 並列で一気にチェック
results = []
errors = []

with ThreadPoolExecutor(max_workers=10) as executor:
    future_to_url = {executor.submit(detect_wovn_from_url, url): url for url in urls}
    for future in as_completed(future_to_url):
        result = future.result()
        results.append(result)
        if "エラー:" in result['導入方式']:
            errors.append(result)

# ▼ 保存フォルダと出力
base_name = os.path.splitext(os.path.basename(input_path))[0]
output_dir = 'results'
os.makedirs(output_dir, exist_ok=True)

result_path = f"{output_dir}/{base_name}_wovn_method_results.csv"
error_path = f"{output_dir}/{base_name}_errors.csv"

pd.DataFrame(results).to_csv(result_path, index=False)
pd.DataFrame(errors).to_csv(error_path, index=False)

print(f"✔ 結果を保存しました: {result_path}")
print(f"⚠ エラーのみ保存しました: {error_path}")