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

4. データベースをセットアップ
```bash
# データベースを作成、マイグレーション実行、初期データを投入（一括実行）
npm run db:setup

# または個別に実行する場合
npm run db:create     # データベースの作成
npm run migrate       # マイグレーションの実行
npm run seed          # 初期データの投入
```

5. サーバーを起動
```bash
# 開発モード（ファイル変更の監視）
npm run dev

# 本番モード
npm start
```

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