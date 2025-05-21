#!/usr/bin/env python3
"""
Split WOVN.io allowed domain list per token into separate rows.

Filenames and output headers are specified within the script.
Adjust INPUT_CSV and OUTPUT_CSV constants as needed.
If the input CSV uses Japanese headers トークンキー / WOVN.io: 許可ドメインリスト,
the script will detect and map them automatically.
"""
import csv
import re

# --- ユーザが指定するファイル名 ---
INPUT_CSV = 'orgin_file_token_domain.csv'
OUTPUT_CSV = 'splited_token_domain.csv'

# --- 出力するカラム名 ---
TOKEN_COL = 'token'
DOMAIN_COL = 'url'

# --- 元の日本語ヘッダー(自動マッピング用) ---
ORIG_TOKEN = 'トークンキー'
ORIG_DOMAIN = 'WOVN.io: 許可ドメインリスト'

# 区切りパターン（改行, カンマ, セミコロン）
pattern = re.compile(r'[\n,;]+')

def split_domains():
    with open(INPUT_CSV, newline='', encoding='utf-8-sig') as infile:
        reader = csv.DictReader(infile)
        # ヘッダーを検出して実際のカラム名を決定
        headers = reader.fieldnames or []
        if TOKEN_COL in headers:
            token_key = TOKEN_COL
        elif ORIG_TOKEN in headers:
            token_key = ORIG_TOKEN
        else:
            raise KeyError(f"Token column not found: expected '{TOKEN_COL}' or '{ORIG_TOKEN}'")
        if DOMAIN_COL in headers:
            domain_key = DOMAIN_COL
        elif ORIG_DOMAIN in headers:
            domain_key = ORIG_DOMAIN
        else:
            raise KeyError(f"Domain column not found: expected '{DOMAIN_COL}' or '{ORIG_DOMAIN}'")

        # 出力ファイル準備
        with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=[TOKEN_COL, DOMAIN_COL])
            writer.writeheader()
            for row in reader:
                token = row.get(token_key, '').strip()
                domain_list = row.get(domain_key, '')
                domains = pattern.split(domain_list)
                for d in domains:
                    d = d.strip()
                    if d:
                        writer.writerow({TOKEN_COL: token, DOMAIN_COL: d})

if __name__ == '__main__':
    split_domains()
