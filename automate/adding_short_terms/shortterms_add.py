import time
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from getpass import getpass
from pathlib import Path

CSV_PATH = "/Users/haruka.nagashima/wovnio/dashboard/import_csv/next21_glossary_shortterms.csv"
CHROMEDRIVER_PATH = "/Applications/chromedriver-mac-arm64/chromedriver"
WOVN_LOGIN_URL = "https://wovn.io/ja/sign_in_form/"

options = webdriver.ChromeOptions()
driver = webdriver.Chrome(service=Service(CHROMEDRIVER_PATH), options=options)
driver.get(WOVN_LOGIN_URL)

email = input("📧 WOVNログイン用メールアドレスを入力してください:  ")
password = getpass("🔑 パスワードを入力（表示されません）: ")

WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='text']"))).send_keys(email)
driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys(password)
driver.find_element(By.XPATH, '//button[.//span[text()="サインイン"]]').click()
WebDriverWait(driver, 20).until(lambda d: "projects" in d.current_url)
print("✅ ログイン完了")

print("🌐 プロジェクト一覧に移動します。用語集画面を手動で開いてください。")
input("🛑 WOVN画面で『用語集』に移動し、『+ 用語追加』ボタンが見える状態になったら Enter を押してください → ")

def safe_click(selector, by=By.CSS_SELECTOR, retries=3, wait_sec=10):
    for i in range(retries):
        try:
            try:
                WebDriverWait(driver, 3).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, 'div[data-testid="modal"]'))
                )
                print("⚠️ モーダルが表示中 → 消えるまで待機...")
                WebDriverWait(driver, 2).until_not(
                    EC.presence_of_element_located((By.CSS_SELECTOR, 'div[data-testid="modal"]'))
                )
            except:
                pass

            element = WebDriverWait(driver, wait_sec).until(EC.element_to_be_clickable((by, selector)))
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
            time.sleep(0.2)
            driver.execute_script("arguments[0].click();", element)
            return True
        except Exception as e:
            print(f"🔁 クリックリトライ中... ({i+1}/{retries}) → {e}")
            time.sleep(1)
    return False

def wait_modal_close(timeout=10):
    try:
        WebDriverWait(driver, timeout).until_not(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'div[data-testid="modal"]'))
        )
        return True
    except:
        return False

def wait_modal_ready(timeout=3):
    try:
        WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'textarea.glossary-row__textarea'))
        )
        return True
    except:
        return False

def fill_textarea(selector, value, index=None):
    try:
        elements = WebDriverWait(driver, 10).until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, selector))
        )
        target = elements[index] if index is not None else elements[-1]
        target.clear()
        target.send_keys(value)
        return True
    except Exception as e:
        print(f"⚠️ 入力失敗: {selector} → {e}")
        return False

for _ in range(3):
    try:
        add_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, 'button.terminology-toolbar__button--add'))
        )
        driver.execute_script("arguments[0].scrollIntoView(true);", add_button)
        break
    except:
        print("🔁 再確認中...")
        time.sleep(1)
else:
    raise Exception("❌ 『+ 用語追加』ボタンが表示されませんでした。HTMLを保存しました。")
print("✅ 『+ 用語追加』ボタン検出完了")

df = pd.read_csv(CSV_PATH)

#言語によって修正する！
for idx, row in df.iterrows():
    ja_term = row["ja"]
    term1 = row["en"]
    term2 = row["zh-CHS"] 
    term3 = row["zh-CHT"] 

    try:
        if not safe_click('button.terminology-toolbar__button--add'):
            raise Exception("『+ 用語追加』クリックに失敗")

        print("🧭 モーダルを開いた")

        if not wait_modal_ready():
            raise Exception("モーダルの読み込みが完了していません")

        fill_textarea('textarea.glossary-row__textarea', ja_term, index=0)
        fill_textarea('textarea.glossary-row__textarea', term1, index=1)
        fill_textarea('textarea.glossary-row__textarea', term2, index=2)
        fill_textarea('textarea.glossary-row__textarea', term3, index=3)

        if not safe_click('//button[.//span[text()="次へ"] and not(@disabled)]', by=By.XPATH):
            raise Exception("Step1の『次へ』ボタン押下に失敗")

        if not safe_click('//button[.//span[text()="次へ"] and not(@disabled)]', by=By.XPATH):
            raise Exception("Step2の『次へ』ボタン押下に失敗")

        if not safe_click('div[role="combobox"]'):
            raise Exception("言語ドロップダウンのクリックに失敗")

        WebDriverWait(driver, 10).until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, 'div[data-portal="true"] .m-dropdown__menu-item'))
        )

        items = driver.find_elements(By.CSS_SELECTOR, 'div[data-portal="true"] .m-dropdown__menu-item')
        for item in items:
            if "全ての言語" in item.text:
                checkbox = item.find_element(By.CSS_SELECTOR, 'input[type="checkbox"]')
                if not checkbox.is_selected():
                    driver.execute_script("arguments[0].click();", checkbox)
                    break

        next_btn = driver.find_element(By.XPATH, '//button[.//span[text()="次へ"]]')
        driver.execute_script("arguments[0].removeAttribute('disabled');", next_btn)
        driver.execute_script("arguments[0].click();", next_btn)

        if not safe_click('//button[.//span[text()="確認"] and not(@disabled)]', by=By.XPATH):
            raise Exception("Step4の『確認』ボタン押下に失敗")

        WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, '//button[.//span[text()="閉じる"]]'))
        ).click()

        if not wait_modal_close():
            raise Exception("モーダルが閉じませんでした")

        print(f"✅ 登録成功: {ja_term}")

    except Exception as e:
        print(f"❌ 登録失敗: {ja_term} → {e}")
        try:
            if driver.session_id:
                with open(f"error_{ja_term}.html", "w", encoding="utf-8") as f:
                    f.write(driver.page_source)
        except Exception as inner_e:
            print(f"⚠️ HTML保存失敗: {inner_e}")

print("🎉 全用語の登録が完了しました！")
driver.quit()
