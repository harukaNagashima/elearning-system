import configparser
import pandas as pd
from fastly import Configuration, ApiClient
from fastly.api.service_api import ServiceApi
from fastly.api.dictionary_api import DictionaryApi
from fastly.api.dictionary_item_api import DictionaryItemApi

# --- config.ini 読み込み ---
config = configparser.ConfigParser()
config.read("config.ini")
token = config["fastly"]["api_token"]
if not token:
    raise RuntimeError("config.ini に fastly.api_token が設定されていません")

# --- Fastly クライアント初期化 ---
conf = Configuration()
conf.api_token = token

with ApiClient(conf) as client:
    service_api    = ServiceApi(client)
    dictionary_api = DictionaryApi(client)
    item_api       = DictionaryItemApi(client)

    rows = []
    for svc in service_api.list_services():
        svc_id = svc.id
        ver    = svc.version

        for d in dictionary_api.list_dictionaries(svc_id, ver):
            dict_id = d.id

            # 初期化
            record = {
                "service_id":       svc_id,
                "version":          ver,
                "dictionary_id":    dict_id,
                "token":            None,
                "default_host":     None,
                "url_pattern_name": None,
                "auth_header":      None,
            }
            # アイテムを取得してマッピング
            for it in item_api.list_dictionary_items(svc_id, dict_id):
                if it.item_key in record:
                    record[it.item_key] = it.item_value

            rows.append(record)

# --- pandas で DataFrame 化 & CSV 出力 ---
df = pd.DataFrame(rows)
# 出力したい列順に並べ替え
df = df[[
    "service_id",
    "version",
    "dictionary_id",
    "token",
    "default_host",
    "url_pattern_name",
    "auth_header"
]]
df.to_csv("service_dicts_summary.csv", index=False, encoding="utf-8")

print("service_dicts_summary.csv に出力しました")