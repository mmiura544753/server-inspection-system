# サーバー点検システム バックエンド

## 概要
サーバー点検システムのバックエンドAPIサーバーです。Express.jsとSequelizeを使用しています。

## 環境構築

### 必要条件
- Node.js 14以上
- MariaDB 10.5以上

### インストール手順

1. リポジトリをクローン
```bash
git clone <repository-url>
cd server-inspection-system/server
```

2. 依存パッケージをインストール
```bash
npm install
```

3. 環境設定
```bash
cp .env.example .env
```
`.env`ファイルを編集して、データベース接続情報などを設定してください。

4. データベースをセットアップ（環境ごとに別々のDBを使用）
```bash
# 開発環境用データベースをセットアップ
npm run db:setup:dev

# テスト環境用データベースをセットアップ
npm run db:setup:test

# 本番環境用データベースをセットアップ
npm run db:setup:prod

# または明示的な環境名を指定せずに現在のNODE_ENV値に基づいてセットアップ
npm run db:setup
```

5. サーバーを起動（環境ごと）
```bash
# 開発環境で起動（開発用DB使用）
npm run start:dev

# 本番環境で起動（本番用DB使用）
npm run start:prod

# または現在の環境設定で起動
npm run dev  # 開発モード（ファイル変更の監視）
npm start    # 本番モード
```

### 環境とデータベースの切り替え

アプリケーションは環境（NODE_ENV）に基づいて適切なデータベースを自動的に選択します：

- `development`: `DEV_DB_NAME` (`server_inspection_dev_db`)
- `test`: `TEST_DB_NAME` (`server_inspection_test_db`)
- `production`: `PROD_DB_NAME` (`server_inspection_db`)

特定のデータベースを強制的に使用したい場合は、`.env`ファイルの`DB_NAME`変数を設定します：

```
# 環境に関わらず常に特定のDBを使用
DB_NAME=my_custom_database
```

この設定は環境別のデータベース設定よりも優先されます。

## データベース管理

### マイグレーション
データベースの構造変更はマイグレーションファイルで管理されます。

```bash
# マイグレーションの実行
npm run migrate

# 直前のマイグレーションの取り消し
npm run migrate:undo

# すべてのマイグレーションの取り消し
npm run migrate:undo:all
```

### シードデータ
初期データはシードファイルで管理されます。

```bash
# シードデータの投入
npm run seed

# シードデータの削除
npm run seed:undo
```

### 新しいマイグレーションの作成
新しいマイグレーションを作成するには、以下のコマンドを実行します：

```bash
npx sequelize-cli migration:generate --name migration-name
```

## API ドキュメント

主要なエンドポイント:

- `GET /api/customers` - 顧客一覧を取得
- `GET /api/devices` - 機器一覧を取得
- `GET /api/inspection-items` - 点検項目一覧を取得
- `GET /api/inspections` - 点検一覧を取得

詳細なAPI仕様は[API仕様書](docs/api.md)を参照してください。