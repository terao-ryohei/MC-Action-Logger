# Action Logger ビルドガイド

## 目次

1. [開発環境のセットアップ](#開発環境のセットアップ)
2. [ビルド手順](#ビルド手順)
3. [パッケージング](#パッケージング)
4. [デバッグとテスト](#デバッグとテスト)
5. [配布準備](#配布準備)

## 開発環境のセットアップ

### 必要なツール

- Node.js (v16以降)
- TypeScript (v5.0.0以降)
- Visual Studio Code (推奨)
- Minecraft Bedrock Edition

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

3. VS Code拡張機能（推奨）
- Minecraft Bedrock Development
- TypeScript and JavaScript Language Features
- ESLint

## ビルド手順

### 開発用ビルド

1. TypeScriptのコンパイル
```bash
npm run build
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
npm run clean && npm run build
```

## パッケージング

### ファイル構造の準備

```
minecraft-action-logger/
├── behavior_pack/
│   ├── manifest.json
│   ├── scripts/
│   │   └── (コンパイルされたJSファイル)
│   └── pack_icon.png
└── resource_pack/
    ├── manifest.json
    └── pack_icon.png
```

### パッケージングスクリプト

1. MCPackの作成
```bash
npm run package
```

このコマンドは以下の処理を実行します：
- TypeScriptのビルド
- 必要なファイルのコピー
- .mcpackファイルの作成

### 成果物

- `dist/action-logger.mcpack`: 配布用パッケージ
- `dist/action-logger-debug.mcpack`: デバッグ用パッケージ

## 配布準備

### バージョン管理

1. バージョン番号の更新
- manifest.jsonの更新
- package.jsonの更新
- CHANGELOG.mdの更新

2. リリースタグの作成
```bash
npm run release
```

### 配布チェックリスト

- [ ] すべてのテストが通過
- [ ] バージョン番号が正しく更新
- [ ] マニフェストファイルが最新
- [ ] ドキュメントが更新済み
- [ ] CHANGELOG.mdが更新済み
- [ ] pack_icon.pngが含まれている
- [ ] ライセンス情報が正しい

## CI/CD設定

### GitHub Actions

```yaml
name: Build and Package

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Package
        run: npm run package
      - name: Upload artifact
        uses: actions/upload-artifact@v2
        with:
          name: action-logger-mcpack
          path: dist/action-logger.mcpack
```

### リリース自動化

1. バージョンバンプ
```bash
npm version patch|minor|major
```

2. リリースノート生成
```bash
npm run generate-notes
```

3. GitHub Releaseの作成
```bash
npm run create-release
```

## トラブルシューティング

### よくある問題

1. ビルドエラー
- TypeScriptバージョンの確認
- 依存関係の再インストール
- tsconfig.jsonの設定確認

2. パッケージングエラー
- ファイル構造の確認
- パーミッションの確認
- manifest.jsonの構文確認

3. テストエラー
- Minecraftバージョンの確認
- 実験的機能の有効化確認
- ログファイルの確認

### サポート

問題が解決しない場合は、以下を確認してください：
- GitHubのIssues
- プロジェクトのWiki
- コミュニティフォーラム

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
詳細は[LICENSE](../LICENSE)ファイルを参照してください。