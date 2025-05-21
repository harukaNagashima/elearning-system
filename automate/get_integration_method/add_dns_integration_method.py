#!/usr/bin/env python3
"""
service_dicts_summary の default_host と
tls_subscriptions の tls_domain_ids を部分一致でチェックし、
マッチした場合は integration_method 列に『DNSパターン』を設定するスクリプト
"""
import pandas as pd

# ファイルパスをコード内で指定
SERVICE_CSV = 'output/service_dicts_summary.csv'
TLS_CSV = 'output/tls_subscriptions.csv'
OUTPUT_CSV = 'output/service_dicts_summary.csv'


def main():
    # CSV 読み込み
    df_service = pd.read_csv(SERVICE_CSV)
    df_tls = pd.read_csv(TLS_CSV)

    # tls_domain_ids をフラットリスト化（カンマ区切り想定）
    tls_domains = []
    for entry in df_tls['tls_domain_ids'].dropna():
        for dom in str(entry).split(','):
            d = dom.strip()
            if d:
                tls_domains.append(d)

    # 部分一致チェック関数: host を文字列化し、NaN はスキップ
    def is_dns_pattern(host) -> bool:
        # NaN や空文字を除外
        if pd.isna(host):
            return False
        host_str = str(host).strip()
        if not host_str:
            return False
        # 部分一致チェック
        return any(host_str in tls for tls in tls_domains)

    # integration_method 列を追加／更新
    df_service['integration_method'] = df_service['default_host'].apply(
        lambda h: 'DNSパターン' if is_dns_pattern(h) else ''
    )

    # 実行結果のサマリ
    total = len(df_service)
    matched = (df_service['integration_method'] == 'DNSパターン').sum()
    print(f"Processed {total} entries, matched DNS パターン: {matched}")

    # 結果を保存
    df_service.to_csv(OUTPUT_CSV, index=False)
    print(f"Saved: {OUTPUT_CSV}")


if __name__ == '__main__':
    main()