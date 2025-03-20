プロジェクトの概要:
サーバー監視システム

期待する動作:
サーバーのステータスを正しく判定し、ログに記録する

修正したい内容：

・InspectionItem (点検項目)をチェックして、結果を点検結果テーブルに保存します。

・Inspection (点検)した項目は多いので、点検テーブルと点検結果テーブルに分けて保存します。

・Inspection (点検)の開始時間、終了時間はInspectionResult (点検結果)の確認時間から開始時間と終了時間を出します。

・点検した結果を一覧で確認できるページを作ります。
　　そのページには以下の項目が表示されています。
　　点検日（Inspection.点検日）、点検者名（Inspection.点検者名）、点検時間（開始時間 ~ 終了時間）
　　レコードの横には、詳細ボタン（Inspection IDごとの結果一覧へ遷移）、編集ボタン（InspectionとResultの編集画面）を置きます。

## 点検結果 一覧ページ (Inspection List Page)

## | 点検日 | 点検者名 | 点検時間 | 操作 |

| 2025/03/20 | 田中 一郎 | 09:10 ~ 09:35 | [詳細] [編集]|
| 2025/03/18 | 鈴木 花子 | 13:00 ~ 13:25 | [詳細] [編集]|
| 2025/03/17 | 佐藤 次郎 | 10:00 ~ 10:50 | [詳細] [編集]|

---

## 点検詳細ページ (Inspection Detail Page)

## 点検情報

点検日 : 2025/03/20
点検者名 : 田中 一郎
点検時間 : 09:10 ~ 09:35

---

## 点検結果一覧

## | 点検項目名 | ステータス | 確認日時 |

| 電源ランプ確認 | 正常 | 2025/03/20 09:10 |
| ファン動作確認 | 異常 | 2025/03/20 09:15 |
| ネットワークLED確認| 正常 | 2025/03/20 09:20 |
| ケーブル緩み確認 | 正常 | 2025/03/20 09:35 |

---

[戻る]

点検編集ページ (Inspection Edit Page)

---

## 点検情報の編集

点検日 : [ 2025/03/20 ] (日付ピッカー)
点検者名 : [ 田中 一郎 ] (テキスト入力)

---

## 点検結果の編集

## | 点検項目名 | ステータス | 確認日時 |

| 電源ランプ確認 | [正常] [異常] | [ 2025/03/20 09:10 ]|
| ファン動作確認 | [正常] [異常] | [ 2025/03/20 09:15 ]|
| ネットワークLED確認| [正常] [異常] | [ 2025/03/20 09:20 ]|
| ケーブル緩み確認 | [正常] [異常] | [ 2025/03/20 09:35 ]|

---

[保存] [キャンセル]

・点検日と確認日時のバリデーションはフロントエンドで制御（例: 同じ日付内でない場合はアラート表示）

・InspectionItem (点検項目)の点検項目名は同じものが多い。
　　入力するときに点検項目名をリスト形式から選択したい。

・InspectionItem → InspectionItemName とリレーション
InspectionItem テーブルは「機器ID」と「点検項目マスタID」で管理。
UIでは、点検項目追加時に「点検項目名マスタ」からプルダウンで選択。

・ InspectionResultは「点検項目名」と「ステータス」を文字列で保存
InspectionResult は「点検項目ID」を持たず、点検時点の「点検項目名（varchar）」と「ステータス（varchar）」を直接保存。
これにより、後からマスタを変更しても過去データに影響なし。

■データモデルで構成されています：

1. Customer (顧客)
   カラム名 型 説明
   id INT 主キー
   name VARCHAR 顧客名

2.Device (機器): 顧客が保有する機器の情報
カラム名 型 説明
id INT 主キー
customer_id INT 外部キー (Customer)
name VARCHAR 機器名
model VARCHAR モデル
rack_no VARCHAR 設置ラックNo
unit_start INT ユニット開始位置
unit_end INT ユニット終了位置
device_type VARCHAR 機器種別
hardware_type VARCHAR ハードウェアタイプ

3.InspectionItemName (点検項目マスタ) : 各機器の点検項目
カラム名 型 説明
id INT 主キー
name VARCHAR 点検項目名（例: 電源ランプ確認）

4. InspectionItem (点検項目)
   カラム名 型 説明
   id INT 主キー
   device_id INT 外部キー (Device)
   item_name_id INT 外部キー (InspectionItemName)

5. Inspection (点検): 実施された点検の基本情報
   カラム名 型 説明
   id INT 主キー
   device_id INT 外部キー (Device)
   date DATE 点検日
   start_time DATETIME 開始時間
   end_time DATETIME 終了時間
   inspector_name VARCHAR 点検者名

6. InspectionResult (点検結果)
   カラム名 説明
   device_id 点検時の機器ID (番号)
   device_name 点検時の機器名 (文字列)
   inspection_date 点検日 (日付)
   start_time 開始時間 (datetime)
   end_time 終了時間 (datetime)
   inspector_name 点検者名 (文字列)

・Device (機器)の管理画面で一覧を表示します。
その画面で各項目の列例をクリックすると並び替えをできるようにしたいです。

・Customer (顧客)の管理画面で一覧を表示します。
その画面で各項目の列例をクリックすると並び替えをできるようにしたいです。

・Inspection (点検)管理画面で一覧を表示します。
その画面で各項目の列例をクリックすると並び替えをできるようにしたいです。
