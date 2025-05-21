#!/usr/bin/env python3
import configparser
import requests
import pandas as pd
import sys

def main():
    # --- config.ini からトークン読み込み ---
    config = configparser.ConfigParser()
    config.read("config.ini")
    token = config["fastly"]["api_token"]
    if not token:
        sys.exit("ERROR: config.ini に fastly.api_token が設定されていません")

    # --- API 呼び出し ---
    url = "https://api.fastly.com/tls/subscriptions"
    headers = {
        "Fastly-Key": token,
        "Accept":     "application/json",
    }

    try:
        resp = requests.get(url, headers=headers)
        resp.raise_for_status()
    except requests.exceptions.HTTPError as e:
        sys.exit(f"HTTP error: {e} (status {resp.status_code})")
    except requests.exceptions.RequestException as e:
        sys.exit(f"Request failed: {e}")

    # --- JSON をパースして行リスト作成 ---
    data = resp.json().get("data", [])
    rows = []
    for sub in data:
        # 基本フィールド
        row = {
            "id":   sub.get("id"),
            "type": sub.get("type"),
        }
        # attributes をフラットにマージ
        attrs = sub.get("attributes", {})
        row.update(attrs)

        # relationships.tls_domains.data から ID リストを抽出
        rels = sub.get("relationships", {})
        tls_domains = rels.get("tls_domains", {}).get("data", [])
        domain_ids = [d.get("id") for d in tls_domains if d.get("id") is not None]
        row["tls_domain_ids"] = ",".join(domain_ids)

        rows.append(row)

    # --- pandas で DataFrame 化 & CSV 出力 ---
    df = pd.DataFrame(rows)
    # 好きな列順に並べ替え
    cols = [
        "id", "type",
        "certificate_authority", "created_at", "state", "has_active_order", "updated_at",
        "tls_domain_ids"
    ]
    df = df.reindex(columns=cols)
    df.to_csv("output/tls_subscriptions.csv", index=False, encoding="utf-8")

    print("tls_subscriptions.csv に tls_domain_ids 列を含めて出力しました")

if __name__ == "__main__":
    main()
