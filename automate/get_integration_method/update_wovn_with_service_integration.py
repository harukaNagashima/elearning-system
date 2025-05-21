#!/usr/bin/env python3
"""
wovn_install_methods_merged.csv の "導入方式" を
service_dicts_summary.csv の "integration_method" で更新するスクリプト
トークン一致時のみ更新し、一致しない場合は既存の値を保持します
"""
import pandas as pd

# 入出力ファイル設定
WOVN_CSV = 'output/wovn_install_methods_merged.csv'
SERVICE_CSV = 'output/service_dicts_summary.csv'
OUTPUT_CSV = 'wovn_install_methods_updated.csv'


def main():
    # CSV読み込み
    df_wovn = pd.read_csv(WOVN_CSV)
    df_service = pd.read_csv(SERVICE_CSV)

    # service_dicts_summary に integration_method 列があるか確認
    if 'integration_method' not in df_service.columns:
        raise KeyError(f"{SERVICE_CSV} に 'integration_method' 列が見つかりません。先にDNS/Proxy方式スクリプトを実行してください。")

    # token および integration_method のみ抽出
    df_svc = df_service[['token', 'integration_method']].drop_duplicates(subset=['token'])

    # マージ（左結合）
    df_merged = pd.merge(
        df_wovn,
        df_svc,
        on='token',
        how='left'
    )

    # 一致した場合のみ導入方式を上書き
    # df_merged['integration_method'] がサービス側の方式
    updated = df_merged['integration_method'].notna()
    df_merged.loc[updated, '導入方式'] = df_merged.loc[updated, 'integration_method']

    # 不要な integration_method 列を削除
    df_merged = df_merged.drop(columns=['integration_method'])

    # 保存
    df_merged.to_csv(OUTPUT_CSV, index=False)

    # サマリ出力
    total = len(df_merged)
    num_updated = updated.sum()
    print(f"Processed {total} entries, updated 導入方式: {num_updated} 件")
    print(f"Saved: {OUTPUT_CSV}")


if __name__ == '__main__':
    main()
