#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./join_by_token.sh left.csv right.csv output.csv
# Example:
#   ./join_by_token.sh wovn_install_methods_merged.csv service_dicts_summary.csv merged.csv

if [ "$#" -ne 3 ]; then
  echo "Usage: $0 <left.csv> <right.csv> <output.csv>"
  exit 1
fi

LEFT_FILE="$1"
RIGHT_FILE="$2"
OUTPUT_FILE="$3"
TMP_DIR=$(mktemp -d)

# 1. 左ファイルのヘッダー取得
HEADER_LEFT=$(head -n1 "$LEFT_FILE")

# 2. 右ファイルに 'token' 列が存在するか確認し、列インデックスを取得
token_idx=$(head -n1 "$RIGHT_FILE" | awk -F',' '{for(i=1;i<=NF;i++) if($i=="token") print i}')
if [ -z "$token_idx" ]; then
  echo "Error: 'token' column not found in $RIGHT_FILE" >&2
  exit 1
fi

# 3. 右ファイルのヘッダーを再構築 (token を先頭に移動)
HEADER_RIGHT=$(head -n1 "$RIGHT_FILE" | awk -F',' -v idx="$token_idx" 'BEGIN{OFS=","} { printf $idx; for(i=1;i<=NF;i++) if(i!=idx) printf ","$i; }')

# 4. 結合後ヘッダーを書き込み
echo "${HEADER_LEFT},${HEADER_RIGHT}" > "$OUTPUT_FILE"

# 5. 本体部分をソートして一時ファイルに保存
# 左ファイル: token 列が先頭にある前提
tail -n +2 "$LEFT_FILE" | sort -t, -k1,1 > "$TMP_DIR/left.sorted.csv"
# 右ファイル: token を先頭にリオーダーし、ソート
tail -n +2 "$RIGHT_FILE" |
  awk -F',' -v idx="$token_idx" 'BEGIN{OFS=","} { printf $idx; for(i=1;i<=NF;i++) if(i!=idx) printf ","$i; }' |
  sort -t, -k1,1 > "$TMP_DIR/right.sorted.csv"

# 6. join による結合 (token が一致する行のみ)
join -t, -1 1 -2 1 "$TMP_DIR/left.sorted.csv" "$TMP_DIR/right.sorted.csv" >> "$OUTPUT_FILE"

# 7. クリーンアップ
rm -rf "$TMP_DIR"

echo "Merge completed: $OUTPUT_FILE"

