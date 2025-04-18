# @terao-ryohei/mc-action-logger ビルドガイド

## 目次

1. [開発環境のセットアップ](#開発環境のセットアップ)
2. [ビルド手順](#ビルド手順)
3. [パッケージング](#パッケージング)
4. [デバッグとテスト](#デバッグとテスト)
5. [配布準備](#配布準備)

## 開発環境のセットアップ

### 必要な環境

- Node.js (v18.0.0以降)
- TypeScript (v5.8.0以降)
- Git
- Visual Studio Code (推奨)

### 初期セットアップ

1. リポジトリのクローン
```bash
git clone https://github.com/minecraft-script/action-logger.git
cd action-logger
```

2. 依存関係のインストール
```bash
npm install
```

3. VS Code拡張機能（推奨）
- TypeScript and JavaScript Language Features
- ESLint
- Biome
- Jest Runner

## 開発とビルド

### 開発用ビルド

1. TypeScriptのコンパイルと監視
```bash
npm run watch
```

2. 単体テストの実行（監視モード）
```bash
npm run test:watch
```

### 本番用ビルド

1. ビルドの実行
```bash
npm run build
```

2. テストの実行
```bash
npm run test
```

3. Lint チェック
```bash
npm run lint
```

## パッケージの公開

### ファイル構造

```
action-logger/
├── src/
│   ├── core/          # コアロギング機能
│   ├── filters/       # フィルター実装
│   ├── exporters/     # エクスポーター実装
│   └── types.ts      # 型定義
├── test/            # テストファイル
├── docs/           # ドキュメント
└── examples/      # 使用例
```

### 公開準備

1. バージョン番号の更新
```bash
npm version patch  # パッチバージョンの更新
# または
npm version minor  # マイナーバージョンの更新
# または
npm version major  # メジャーバージョンの更新
```

2. チェンジログの更新
```bash
# CHANGELOG.mdを編集
git add CHANGELOG.md
git commit -m "docs: update changelog for version x.x.x"
```

3. パッケージの公開
```bash
npm publish --access public
```

### 公開チェックリスト

- [ ] すべてのテストが成功していること
- [ ] Lintチェックが通過していること
- [ ] バージョン番号が適切に更新されていること
- [ ] CHANGELOGが更新されていること
- [ ] README.mdが最新であること
- [ ] パッケージ内容が正しいこと（package.jsonのfilesフィールド）
- [ ] TypeScriptの型定義が正しく生成されていること
- [ ] 不要なファイルが含まれていないこと（.gitignore、tsconfig.tsbuildinfo等）

## トラブルシューティング

### よくある問題

1. ビルドエラー
- TypeScriptバージョンの確認
- 依存関係の再インストール
- tsconfig.jsonの設定確認
- Node.jsバージョンの確認

2. テストエラー
- Jest設定の確認
- テストカバレッジの確認
- モックの設定確認

3. 公開エラー
- npmログイン状態の確認
- パッケージ名の重複確認
- アクセス権限の確認

### サポート

問題が解決しない場合は、以下を確認してください：
- GitHubのIssues
- プロジェクトのWiki
- npmのドキュメント

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
詳細は[LICENSE](./LICENSE)ファイルを参照してください。