#!/usr/bin/env python3
"""
service_dicts_summaryのdefault_hostと
tls_subscriptionsのtls_domain_idsを部分一致でチェックし、
マッチした場合はintegration_methodに『DNSパターン』を設定するスクリプト
"""
import pandas as pd

# ファイルパスをコード内で指定
SERVICE_CSV = 'output/service_dicts_summary.csv'
TLS_CSV = 'output/tls_subscriptions.csv'
OUTPUT_CSV = 'output/integration_method.csv'

def main():
    # CSV読み込み
    df_service = pd.read_csv(SERVICE_CSV)
    df_tls = pd.read_csv(TLS_CSV)

    # tls_domain_idsをフラットリスト化（カンマ区切り想定）
    tls_domains = []
    for entry in df_tls['tls_domain_ids'].dropna():
        for dom in str(entry).split(','):
            d = dom.strip()
            if d:
                tls_domains.append(d)

    # 部分一致チェック関数
def is_dns_pattern(host: str) -> bool:
    return any(host in tls for tls in tls_domains)

    # integration_method列を追加／更新
    df_service['integration_method'] = df_service['default_host'].apply(
        lambda h: 'DNSパターン' if is_dns_pattern(h) else ''
    )

    # 結果を保存
    df_service.to_csv(OUTPUT_CSV, index=False)
    print(f"Saved: {OUTPUT_CSV}")

if __name__ == '__main__':
    main()

