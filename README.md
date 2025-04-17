# @minecraft-script/action-logger

[English](./docs/en/README.md) | 日本語

TypeScriptで書かれた柔軟で拡張性の高いロギングライブラリです。イベントベースのログ記録、強力なフィルタリング機能、多様なエクスポート形式をサポートし、特にMinecraftのスクリプト開発に最適化されています。

## 特徴

- 💡 6段階のログレベル（DEBUG、VERBOSE、INFO、WARN、ERROR、FATAL）
- 🔍 柔軟なフィルタリングシステム
- 📤 JSON/CSVエクスポート対応
- 🔄 自動エクスポート機能
- 🎯 メタデータサポート
- 🛠️ カスタマイズ可能なフィルターとエクスポーター
- 🎮 Minecraft Script APIとの統合

## インストール

npmを使用してインストール：

```bash
npm install @minecraft-script/action-logger
```

Yarnを使用してインストール：

```bash
yarn add @minecraft-script/action-logger
```

## 基本的な使い方

```typescript
import { CoreLogger, LogLevel } from '@minecraft-script/action-logger';

// ロガーのインスタンスを作成
const logger = new CoreLogger({
  defaultLevel: LogLevel.INFO,
  bufferSize: 1000,
  autoExport: {
    format: "json",
    interval: 60000, // 1分ごとに自動エクスポート
    path: "./logs"
  }
});

// Minecraftのシステムイベントを記録
logger.log({
  type: "minecraft.system",
  level: LogLevel.INFO,
  details: {
    event: "worldInitialize",
    dimension: "overworld"
  },
  metadata: {
    gameMode: "creative",
    serverVersion: "1.20.0"
  }
});

// プレイヤーのアクションを記録
logger.log({
  type: "minecraft.player",
  level: LogLevel.INFO,
  details: {
    action: "blockPlace",
    player: "Steve",
    block: "minecraft:stone"
  }
});

// フィルターを使用してイベントを取得
const events = logger.getEvents({
  type: "minecraft.player",
  level: LogLevel.INFO
});

// イベントをJSONとしてエクスポート
const jsonData = await logger.export({ format: "json" });

// CSVとしてエクスポート
const csvData = await logger.export({ format: "csv" });

// 使用終了時にリソースを解放
logger.dispose();
```

## 高度な使用例

フィルターの使用：

```typescript
import { TimeRangeFilter, LogLevelFilter, EventTypeFilter } from '@minecraft/action-logger';

// 時間範囲フィルター
const timeFilter = new TimeRangeFilter(
  Date.now() - 3600000, // 1時間前
  Date.now()
);

// ログレベルフィルター
const levelFilter = new LogLevelFilter(LogLevel.WARN);

// イベントタイプフィルター
const typeFilter = new EventTypeFilter(['user_action', 'system_event']);

// フィルターを追加
logger.addFilter(timeFilter);
logger.addFilter(levelFilter);
logger.addFilter(typeFilter);
```

スコアボードフィルター：

```typescript
import { ScoreboardFilterManager, ScoreboardEventTypeFilter } from '@minecraft/action-logger';

// スコアボードフィルターマネージャーを初期化
const filterManager = new ScoreboardFilterManager();
await filterManager.initializeScoreboards();

// イベントタイプフィルターをスコアボード制御下に置く
const blockFilter = new ScoreboardEventTypeFilter(
  "block",  // スコアボード上での識別子
  ["block_broken", "block_placed"]
);

// フィルターを登録
logger.addFilter(blockFilter);

// ゲーム内でフィルターを制御
// /scoreboard players set block log_filters 1  # 有効化
// /scoreboard players set block log_filters 0  # 無効化
```

カスタムエクスポート：

```typescript
const customExport = await logger.export({
  format: "custom",
  config: {
    exportFunction: (events) => {
      // カスタムフォーマットでイベントを変換
      return events.map(e => `${e.timestamp}: ${e.type} - ${e.details}`).join('\n');
    }
  }
});
```

## API ドキュメント

詳細なAPIドキュメントは[こちら](./docs/api.md)をご覧ください。

## 使用例とサンプルコード

より詳細な使用例とサンプルコードは[こちら](./docs/examples.md)をご覧ください。

## ライセンス

MITライセンスの下で公開されています。詳細は[LICENSE](./LICENSE)ファイルをご覧ください。