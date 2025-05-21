#!/usr/bin/env python3
"""
Split WOVN.io allowed domain list per token into separate rows,
prepend "https://" to each domain if not already present,
and output into multiple CSV files with up to CHUNK_SIZE rows each.

Filenames and output headers are specified within the script.
Adjust INPUT_CSV, OUTPUT_PREFIX, and CHUNK_SIZE constants as needed.
"""
import csv
import re

# --- ユーザが指定するファイル名・設定 ---
INPUT_CSV = 'orgin_file_token_domain.csv'        # 入力CSVファイル
OUTPUT_PREFIX = 'output/splited_token_domain/file'              # 出力ファイル接頭辞（output_1.csv, output_2.csv ...）
CHUNK_SIZE = 100                      # 1ファイルあたりの行数上限

# --- 出力するカラム名 ---
TOKEN_COL = 'token'
DOMAIN_COL = 'url'

# --- 元の日本語ヘッダー(自動マッピング用) ---
ORIG_TOKEN = 'トークンキー'
ORIG_DOMAIN = 'WOVN.io: 許可ドメインリスト'

# 区切りパターン（改行, カンマ, セミコロン）
pattern = re.compile(r'[\n,;]+')
# URLプレフィックス確認パターン
url_pattern = re.compile(r'^https?://', re.IGNORECASE)

def split_domains():
    with open(INPUT_CSV, newline='', encoding='utf-8-sig') as infile:
        reader = csv.DictReader(infile)
        headers = reader.fieldnames or []
        # カラム名判定
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

        file_index = 1
        row_count = 0
        output_file = None
        writer = None

        def open_new_file(idx):
            filename = f"{OUTPUT_PREFIX}_{idx}.csv"
            f = open(filename, 'w', newline='', encoding='utf-8')
            w = csv.DictWriter(f, fieldnames=[TOKEN_COL, DOMAIN_COL])
            w.writeheader()
            return f, w

        for row in reader:
            token = row.get(token_key, '').strip()
            domain_list = row.get(domain_key, '')
            domains = pattern.split(domain_list)
            for d in domains:
                d = d.strip()
                if not d:
                    continue
                # https:// がなければ付与
                if not url_pattern.match(d):
                    d = 'https://' + d
                # 新しいチャンクファイルを開く必要があるか？
                if row_count % CHUNK_SIZE == 0:
                    if output_file:
                        output_file.close()
                    output_file, writer = open_new_file(file_index)
                    file_index += 1
                    row_count = 0
                writer.writerow({TOKEN_COL: token, DOMAIN_COL: d})
                row_count += 1

        # 最後のファイルを閉じる
        if output_file:
            output_file.close()

if __name__ == '__main__':
    split_domains()
