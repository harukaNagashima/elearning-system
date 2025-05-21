#!/usr/bin/env bash
# merge_wovn_methods.sh

# 入出力ディレクトリ
INPUT_DIR="output/wovn_install_methods"
MERGED_FILE="output/wovn_install_methods_merged.csv"

# 出力ファイルのヘッダーを作成（最初のファイルから取得）
first_file=$(ls "$INPUT_DIR"/*.csv | head -n1)
head -n1 "$first_file" > "$MERGED_FILE"

# 各ファイルのデータ部（2 行目以降）を追記
for f in "$INPUT_DIR"/*.csv; do
  tail -n +2 "$f" >> "$MERGED_FILE"
done
