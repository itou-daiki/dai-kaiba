#!/usr/bin/env python3
"""
netkeiba.comのレース検索ページから実際のレースIDを取得するスクリプト
"""

import json
import time
import re
import requests
from bs4 import BeautifulSoup

BASE_URL = "https://race.netkeiba.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
REQUEST_DELAY = 3  # リクエスト間隔（秒）

def search_g1_races(year, max_results=12):
    """
    指定された年のG1レースを検索して実際のレースIDを取得
    """
    print(f"\n{year}年のG1レースを検索中...")

    # レース検索URL（G1のみ）
    search_url = f"{BASE_URL}/race/list.html"

    params = {
        'start_year': year,
        'end_year': year,
        'grade[]': 1,  # G1のみ
        'list': 100,    # 表示件数
    }

    try:
        response = requests.get(search_url, params=params, headers=HEADERS, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'lxml')

        race_ids = []

        # レース一覧テーブルから取得
        race_links = soup.select('a[href*="/race/"]')

        for link in race_links:
            href = link.get('href', '')
            # race_id パラメータを抽出
            match = re.search(r'race_id=(\d+)', href)
            if match:
                race_id = match.group(1)
                if len(race_id) == 12:  # 正しい形式のレースID
                    race_ids.append(race_id)

        # 重複を除去
        race_ids = list(dict.fromkeys(race_ids))[:max_results]

        print(f"✓ {len(race_ids)}件のG1レースを発見")
        return race_ids

    except Exception as e:
        print(f"✗ 検索エラー: {e}")
        return []

def main():
    """メイン処理"""
    print("netkeibaのレース検索から実際のレースIDを取得します")
    print("対象: 2022-2024年のG1レース")

    all_race_ids = []

    # 3年分のG1レースを検索
    for year in [2024, 2023, 2022]:
        race_ids = search_g1_races(year, max_results=12)
        all_race_ids.extend(race_ids)

        # リクエスト間隔
        if year != 2022:
            print(f"待機中... ({REQUEST_DELAY}秒)")
            time.sleep(REQUEST_DELAY)

    print(f"\n合計 {len(all_race_ids)} 件のレースIDを取得しました")

    # JSONファイルに保存
    output_file = 'scripts/race_ids.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'race_ids': all_race_ids,
            'count': len(all_race_ids),
            'years': [2024, 2023, 2022],
            'generated_at': time.strftime('%Y-%m-%d %H:%M:%S')
        }, f, ensure_ascii=False, indent=2)

    print(f"✓ レースIDを保存: {output_file}")

    # サンプル表示
    print("\n取得したレースID（最初の10件）:")
    for i, race_id in enumerate(all_race_ids[:10], 1):
        print(f"{i}. {race_id}")

    if len(all_race_ids) > 10:
        print(f"... 他 {len(all_race_ids) - 10} 件")

if __name__ == "__main__":
    main()
