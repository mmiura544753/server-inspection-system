# サーバー点検システム

サーバーの点検作業を記録・管理するためのシステムです。

## プロジェクト構成

このプロジェクトは以下の2つの部分で構成されています：

- `client/`: Reactフロントエンド
- `server/`: Node.js/Express APIサーバー

## 開発環境のセットアップ

### 必要な環境

- Node.js v18以上
- npm
- MariaDB

### サーバー側のセットアップ

```bash
cd server
npm install
npm run db:setup:dev  # 開発用データベースを作成・初期化
```

### クライアント側のセットアップ

```bash
cd client
npm install
```

## アプリケーションの起動

### サーバーの起動

```bash
cd server
npm run dev
```

サーバーはデフォルトで `http://localhost:5000` で起動します。

### クライアントの起動

```bash
cd client
npm start
```

クライアントはデフォルトで `http://localhost:3000` で起動します。

## テスト実行

テストを実行するには、プロジェクトのルートディレクトリから以下のコマンドを実行します：

```bash
./run-tests.sh
```

または、個別に実行することもできます：

### サーバー側テスト

```bash
cd server
npm test
```

### クライアント側テスト

```bash
cd client
npm test
```

## テストの種類

### サーバー側

- 単体テスト: コントローラーなどの個別の機能をテスト
- 統合テスト: APIエンドポイントの動作を検証

### クライアント側

- 単体テスト: 個別のコンポーネントの動作を検証
- API統合テスト: APIとの連携を検証