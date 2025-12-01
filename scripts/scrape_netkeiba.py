#!/usr/bin/env python3
"""
netkeiba.comから競馬レースデータをスクレイピングするスクリプト

注意: このスクリプトは教育目的のみに使用してください。
netkeibaの利用規約を遵守し、過度なアクセスは避けてください。
"""

import json
import time
import re
from datetime import datetime, timedelta
import requests
from bs4 import BeautifulSoup

# 定数
BASE_URL = "https://race.netkeiba.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
REQUEST_DELAY = 2  # リクエスト間隔（秒）

# 競馬場コード
RACECOURSES = {
    "01": "札幌",
    "02": "函館",
    "03": "福島",
    "04": "新潟",
    "05": "東京",
    "06": "中山",
    "07": "中京",
    "08": "京都",
    "09": "阪神",
    "10": "小倉",
}

def get_upcoming_race_ids(limit=100):
    """
    3年分の主要G1レースIDを取得
    """
    # 主要G1レースの開催パターン（月-競馬場-レース番号）
    # 形式: (年, 月, 日, 競馬場コード, レース番号)
    g1_races_2024 = [
        (2024, 12, 22, "06", "11"),  # 有馬記念 (中山)
        (2024, 11, 24, "05", "11"),  # ジャパンカップ (東京)
        (2024, 10, 27, "05", "11"),  # 天皇賞秋 (東京)
        (2024, 10, 6, "08", "11"),   # 秋華賞 (京都)
        (2024, 9, 29, "06", "11"),   # スプリンターズS (中山)
        (2024, 6, 2, "05", "11"),    # 日本ダービー (東京)
        (2024, 5, 26, "05", "11"),   # オークス (東京)
        (2024, 5, 5, "08", "11"),    # NHKマイルC (京都)
        (2024, 4, 28, "05", "11"),   # 天皇賞春 (東京)
        (2024, 4, 21, "06", "11"),   # 皐月賞 (中山)
        (2024, 3, 31, "06", "11"),   # 大阪杯 (中山)
        (2024, 2, 25, "05", "11"),   # フェブラリーS (東京)
    ]

    g1_races_2023 = [
        (2023, 12, 24, "06", "11"),  # 有馬記念
        (2023, 11, 26, "05", "11"),  # ジャパンカップ
        (2023, 10, 29, "05", "11"),  # 天皇賞秋
        (2023, 10, 15, "09", "11"),  # 秋華賞
        (2023, 10, 1, "06", "11"),   # スプリンターズS
        (2023, 5, 28, "05", "11"),   # 日本ダービー
        (2023, 5, 21, "05", "11"),   # オークス
        (2023, 5, 7, "05", "11"),    # NHKマイルC
        (2023, 4, 30, "08", "11"),   # 天皇賞春
        (2023, 4, 16, "06", "11"),   # 皐月賞
        (2023, 4, 2, "09", "11"),    # 大阪杯
        (2023, 2, 19, "05", "11"),   # フェブラリーS
    ]

    g1_races_2022 = [
        (2022, 12, 25, "06", "11"),  # 有馬記念
        (2022, 11, 27, "05", "11"),  # ジャパンカップ
        (2022, 10, 30, "05", "11"),  # 天皇賞秋
        (2022, 10, 16, "09", "11"),  # 秋華賞
        (2022, 10, 2, "06", "11"),   # スプリンターズS
        (2022, 5, 29, "05", "11"),   # 日本ダービー
        (2022, 5, 22, "05", "11"),   # オークス
        (2022, 5, 8, "05", "11"),    # NHKマイルC
        (2022, 5, 1, "08", "11"),    # 天皇賞春
        (2022, 4, 17, "06", "11"),   # 皐月賞
        (2022, 4, 3, "09", "11"),    # 大阪杯
        (2022, 2, 20, "05", "11"),   # フェブラリーS
    ]

    # すべての年のレースを結合
    all_races = g1_races_2024 + g1_races_2023 + g1_races_2022

    # レースIDに変換
    race_ids = []
    for year, month, day, course, race_num in all_races:
        race_id = f"{year}{month:02d}{day:02d}{course}{race_num}"
        race_ids.append(race_id)

    return race_ids[:limit]

def scrape_race_data(race_id):
    """
    指定されたレースIDのデータをスクレイピング
    """
    url = f"{BASE_URL}/race/shutuba.html?race_id={race_id}"

    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "lxml")

        # レース情報を取得
        race_name = soup.select_one(".RaceName")
        if not race_name:
            print(f"レース名が取得できませんでした: {race_id}")
            return None

        race_name_text = race_name.get_text(strip=True)

        # レース詳細情報
        race_data1 = soup.select_one(".RaceData01")
        if not race_data1:
            print(f"レース詳細が取得できませんでした: {race_id}")
            return None

        race_info_text = race_data1.get_text(strip=True)

        # 距離を抽出
        distance_match = re.search(r'(\d+)m', race_info_text)
        distance = int(distance_match.group(1)) if distance_match else 2000

        # 馬場を抽出
        track = "芝" if "芝" in race_info_text else "ダート"

        # 天候を抽出
        weather = "晴"
        if "曇" in race_info_text:
            weather = "曇"
        elif "雨" in race_info_text:
            weather = "雨"

        # グレードを抽出
        grade = "G3"
        if "G1" in race_name_text or "GⅠ" in race_name_text:
            grade = "G1"
        elif "G2" in race_name_text or "GⅡ" in race_name_text:
            grade = "G2"

        # 出走馬情報を取得
        horses_table = soup.select_one(".Shutuba_Table")
        horses = []

        if horses_table:
            horse_rows = horses_table.select("tr.HorseList")

            for idx, row in enumerate(horse_rows, start=1):
                try:
                    # 馬番
                    num_td = row.select_one(".Umaban")
                    horse_num = int(num_td.get_text(strip=True)) if num_td else idx

                    # 馬名
                    name_td = row.select_one(".Horse_Name a")
                    horse_name = name_td.get_text(strip=True) if name_td else f"馬{idx}"

                    # 騎手
                    jockey_td = row.select_one(".Jockey a")
                    jockey = jockey_td.get_text(strip=True) if jockey_td else "騎手"

                    # 馬体重
                    weight_td = row.select_one(".Weight")
                    weight_text = weight_td.get_text(strip=True) if weight_td else "480"
                    weight_match = re.search(r'(\d+)', weight_text)
                    weight = int(weight_match.group(1)) if weight_match else 480

                    # オッズ（暫定的にランダム）
                    odds_base = 2.0 + (idx - 1) * 1.5

                    # 能力値（距離とグレードから推定）
                    speed = 85 - (idx - 1) * 3
                    stamina = 80 + (distance - 1600) // 400 * 5 - (idx - 1) * 2

                    horse_data = {
                        "id": f"h{race_id}_{idx:02d}",
                        "number": horse_num,
                        "name": horse_name,
                        "speed": max(60, min(95, speed)),
                        "stamina": max(60, min(95, stamina)),
                        "odds_base": round(odds_base, 1),
                        "jockey": jockey,
                        "weight": weight,
                        "trainer": "調教師"  # netkeibaからは取得困難
                    }

                    horses.append(horse_data)

                except Exception as e:
                    print(f"馬情報の取得エラー: {e}")
                    continue

        # レースデータを構築
        race = {
            "id": f"race_{race_id}",
            "name": race_name_text,
            "grade": grade,
            "distance": distance,
            "track": track,
            "weather": weather,
            "week": 1,  # 固定値
            "description": f"{race_name_text}",
            "horses": horses[:18]  # 最大18頭
        }

        return race

    except requests.RequestException as e:
        print(f"リクエストエラー: {e}")
        return None
    except Exception as e:
        print(f"予期しないエラー: {e}")
        return None

def main():
    """メイン処理"""
    print("netkeibaからレースデータを取得中...")

    # レースIDを取得（3年分のG1レース、最大36レース）
    race_ids = get_upcoming_race_ids(limit=20)  # サーバー負荷を考慮して20レースに制限
    print(f"対象レース数: {len(race_ids)}")

    races = []

    for idx, race_id in enumerate(race_ids, start=1):
        print(f"\n[{idx}/{len(race_ids)}] レースID: {race_id} を取得中...")

        race_data = scrape_race_data(race_id)

        if race_data:
            races.append(race_data)
            print(f"✓ {race_data['name']} を取得しました")
        else:
            print(f"✗ レースデータの取得に失敗しました")

        # リクエスト間隔を設ける
        if idx < len(race_ids):
            print(f"待機中... ({REQUEST_DELAY}秒)")
            time.sleep(REQUEST_DELAY)

    # 既存データと統合
    output_path = "public/data/races.json"

    try:
        with open(output_path, "r", encoding="utf-8") as f:
            existing_races = json.load(f)
        print(f"\n既存レース数: {len(existing_races)}")
    except FileNotFoundError:
        existing_races = []
        print("\n既存データなし、新規作成します")

    # 既存のIDと重複しないように追加
    existing_ids = {race["id"] for race in existing_races}
    new_races = [race for race in races if race["id"] not in existing_ids]

    # 統合
    all_races = existing_races + new_races

    # 週番号を再割り当て
    for idx, race in enumerate(all_races, start=1):
        race["week"] = idx

    # JSONファイルに保存
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_races, f, ensure_ascii=False, indent=2)

    print(f"\n✓ 保存完了: {output_path}")
    print(f"  - 新規追加: {len(new_races)}レース")
    print(f"  - 合計: {len(all_races)}レース")

if __name__ == "__main__":
    main()
