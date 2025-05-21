import os
import pandas as pd
import requests
from bs4 import BeautifulSoup
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

# 入出力ディレクトリ設定
INPUT_DIR = 'output/splited_token_domain'
OUTPUT_DIR = 'output/wovn_install_methods'
SKIP_DOMAINS = ['sharepoint.com']

# ドメインスキップ判定

def is_skip_domain(url):
    return any(domain in url for domain in SKIP_DOMAINS)

# リトライ付きリクエスト

def get_with_retry(url, retries=3, delay=1):
    for i in range(retries):
        try:
            r = requests.get(url, timeout=5)
            r.raise_for_status()
            return r
        except Exception:
            if i < retries - 1:
                time.sleep(delay)
            else:
                return None

# WOVN導入方式判定

def detect_wovn(token, url):
    if is_skip_domain(url):
        return {'token': token, 'url': url, '導入方式': 'スキップ:認証が必要', 'バージョン': ''}
    r = get_with_retry(url)
    if not r:
        return {'token': token, 'url': url, '導入方式': 'リクエスト失敗', 'バージョン': ''}
    soup = BeautifulSoup(r.text, 'html.parser')
    script = soup.find('script', src=re.compile(r'j\.wovn\.io'))
    install_type = 'scriptが設置されていません'
    version = ''

    if script:
        raw  = script.get('data-wovnio','') or ''
        info = script.get('data-wovnio-info','') or ''
        m = None
        if 'backendVersion=WOVN.proxy_' in raw:
            install_type = 'Proxy方式'
            m = re.search(r'backendVersion=WOVN\.proxy_([0-9.]+)', raw)
        elif 'backendVersion=WOVN.php_' in raw:
            install_type = 'PHPライブラリ方式'
            m = re.search(r'backendVersion=WOVN\.php_([0-9.]+)', raw)
        elif 'version=Wovn.cs_' in raw:
            install_type = 'C#ライブラリ方式'
            m = re.search(r'version=Wovn\.cs_([0-9.]+)', raw)
        elif 'version=' in raw and 'backend=true' in raw:
            install_type = 'Javaライブラリ方式'
            m = re.search(r'version=([0-9.]+)', raw)
        elif 'version=WOVN.wp_' in info:
            install_type = 'WordPressプラグイン方式'
            m = re.search(r'version=WOVN\.wp_([0-9.]+)', info)
        elif 'key=' in raw and 'backend' not in raw:
            install_type = 'Script方式'
        if m:
            version = m.group(1)

    return {'token': token, 'url': url, '導入方式': install_type, 'バージョン': version}

# ファイル単位で処理

def process_file(input_path, output_path):
    df = pd.read_csv(input_path)
    cols = [c.lower() for c in df.columns]
    token_col = df.columns[cols.index('token')]
    url_col = df.columns[cols.index('url')]
    entries = df[[token_col, url_col]].dropna().rename(columns={token_col:'token', url_col:'url'})

    results = []
    with ThreadPoolExecutor(max_workers=10) as exe:
        futures = [exe.submit(detect_wovn, row['token'], row['url']) for _, row in entries.iterrows()]
        for f in as_completed(futures):
            results.append(f.result())

    out_df = pd.DataFrame(results, columns=['token','url','導入方式','バージョン'])
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    out_df.to_csv(output_path, index=False)
    print(f"完了：{output_path}")

# エントリポイント

if __name__ == '__main__':
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for filename in os.listdir(INPUT_DIR):
        if filename.endswith('.csv'):
            input_path = os.path.join(INPUT_DIR, filename)
            output_path = os.path.join(OUTPUT_DIR, filename)
            process_file(input_path, output_path)
