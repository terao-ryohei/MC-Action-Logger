# Action Logger ビルドガイド

## 目次

1. [開発環境のセットアップ](#開発環境のセットアップ)
2. [ビルド手順](#ビルド手順)
3. [パッケージング](#パッケージング)
4. [デバッグとテスト](#デバッグとテスト)
5. [配布準備](#配布準備)

## 開発環境のセットアップ

### 必要なツール

- Node.js (v16.0.0以降)
- TypeScript (v5.8.0以降)
- Visual Studio Code (推奨)
- Minecraft Bedrock Edition (v1.20.0以降)

### 初期セットアップ

1. リポジトリのクローン
```bash
git clone https://github.com/terao-ryohei/minecraft-action-logger.git
cd minecraft-action-logger
```

2. 依存関係のインストール
```bash
npm install
```

3. 環境変数の設定
```bash
cp .env.example .env
```
.envファイルを作成し、以下の設定を行います：
```
MINECRAFT_DIR=<Minecraftのアドオン導入先ディレクトリパス>
DEV_DIR=<開発用のディレクトリパス>
```
※ パスは絶対パスで指定してください

4. VS Code拡張機能（推奨）
- Minecraft Bedrock Development
- TypeScript and JavaScript Language Features
- ESLint
- Biome

## ビルド手順

### 開発用ビルド

1. TypeScriptのコンパイルと継続的な監視
```bash
npm run watch
```

2. 継続的なビルド（開発時）
```bash
npm run dev
```

### クリーンビルド

1. ビルドディレクトリのクリーンアップ
```bash
npm run clean
```

2. フルビルド
```bash
npm run build
```

## パッケージング

### ファイル構造

```
minecraft-action-logger/
├── src/
│   ├── managers/         # 各種マネージャーモジュール
│   ├── types.ts         # 型定義
│   └── main.ts         # メインエントリーポイント
├── scripts/            # ビルドスクリプト
│   ├── build.mjs
│   ├── makeZip.mjs
│   └── makeMcaddon.mjs
└── docs/              # ドキュメント
```

### パッケージング手順

1. ZIPファイルの作成
```bash
npm run make-zip
```

2. MCAddonの作成
```bash
npm run make-mcaddon
```

### 成果物

- `scripts.zip`: スクリプトファイル
- `.mcaddon`: Minecraft用アドオンパッケージ

## 配布準備

### バージョン管理

1. バージョン番号の更新
- manifest.jsonの更新
- package.jsonの更新
- CHANGELOG.mdの更新

2. リリースの作成
- GitHubのリリースページから新規リリースを作成
- タグを付与
- ビルド済みの.mcaddonファイルを添付

### 配布チェックリスト

- [ ] すべてのビルドが成功
- [ ] バージョン番号が正しく更新
- [ ] マニフェストファイルが最新
- [ ] ドキュメントが更新済み
- [ ] pack_icon.pngが含まれている
- [ ] 依存関係が正しく設定されている
- [ ] .envが正しく設定されている

## トラブルシューティング

### よくある問題

1. ビルドエラー
- TypeScriptバージョンの確認（v5.8.0以降が必要）
- 依存関係の再インストール
- tsconfig.jsonの設定確認
- .envファイルの設定確認

2. パッケージングエラー
- scriptsディレクトリの存在確認
- 必要なファイルの配置確認
- manifest.jsonの構文確認
- 環境変数（MINECRAFT_DIR, DEV_DIR）の設定確認

3. Minecraft関連の問題
- Minecraftバージョンの確認（v1.20.0以降が必要）
- @minecraft/server, @minecraft/server-uiパッケージのバージョン確認
- 実験的機能の有効化確認
- Minecraftディレクトリのパス設定確認

### サポート

問題が解決しない場合は、以下を確認してください：
- GitHubのIssues
- プロジェクトのWiki
- Minecraft Bedrock開発者フォーラム

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
詳細は[LICENSE](../LICENSE)ファイルを参照してください。