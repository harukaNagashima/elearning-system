import pandas as pd
import requests
from bs4 import BeautifulSoup
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

# スキップ対象ドメインのリスト
SKIP_DOMAINS = [
    'sharepoint.com',
    # 追加でスキップしたいドメインがあればここに追記
]

# URLがスキップ対象か判定する関数
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

# 判定ロジック
def detect_wovn_from_url(url):
    # スキップ判定
    if is_skip_domain(url):
        return {'url': url, '導入方式': 'スキップ:認証が必要', 'バージョン': ''}
    r = get_with_retry(url)
    if not r:
        return {'url': url, '導入方式': 'リクエスト失敗', 'バージョン': ''}
    soup = BeautifulSoup(r.text, 'html.parser')  # 必要なら features=\"xml\" に変更
    script = soup.find('script', src=re.compile(r'j\\.wovn\\.io'))
    install_type = 'scriptが設置されていません'
    version = ''
    if script:
        raw = script.get('data-wovnio','') or ''
        info = script.get('data-wovnio-info','') or ''
        m = None
        if 'backendVersion=WOVN.proxy_' in raw:
            install_type = 'プロキシ型'
            m = re.search(r'backendVersion=WOVN\\.proxy_([0-9.]+)', raw)
        elif 'backendVersion=WOVN.php_' in raw:
            install_type = 'PHPライブラリ型'
            m = re.search(r'backendVersion=WOVN\\.php_([0-9.]+)', raw)
        elif 'version=Wovn.cs_' in raw:
            install_type = 'C#ライブラリ型'
            m = re.search(r'version=Wovn\\.cs_([0-9.]+)', raw)
        elif 'version=' in raw and 'backend=true' in raw:
            install_type = 'Javaライブラリ型'
            m = re.search(r'version=([0-9.]+)', raw)
        elif 'version=WOVN.wp_' in info:
            install_type = 'WordPressプラグイン型'
            m = re.search(r'version=WOVN\\.wp_([0-9.]+)', info)
        elif 'key=' in raw and 'backend' not in raw:
            install_type = 'JavaScriptタグ埋め込み型'
        if m:
            version = m.group(1)
    return {'url': url, '導入方式': install_type, 'バージョン': version}

# CSV読み込みと並列処理
def main():
    df = pd.read_csv('output/splited_token_domain.csv')
    columns = [c.lower() for c in df.columns]
    url_col = df.columns[columns.index('url')]
    urls = df[url_col].dropna().tolist()

    results = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(detect_wovn_from_url, u) for u in urls]
        for f in futures:
            results.append(f.result())

    out_df = pd.DataFrame(results)
    out_df.to_csv('wovn_install_methods.csv', index=False)

if __name__ == '__main__':
    main()
