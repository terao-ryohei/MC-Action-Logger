# ActionLogger

[English](./docs/en/README.md) | 日本語

ActionLoggerは、柔軟で拡張性の高いロギングライブラリです。イベントベースのログ記録、強力なフィルタリング機能、多様なエクスポート形式をサポートしています。

## 特徴

- 💡 6段階のログレベル（DEBUG、VERBOSE、INFO、WARN、ERROR、FATAL）
- 🔍 柔軟なフィルタリングシステム
- 📤 JSON/CSVエクスポート対応
- 🔄 自動エクスポート機能
- 🎯 メタデータサポート
- 🛠️ カスタマイズ可能なフィルターとエクスポーター

## インストール

npmを使用してインストール：

```bash
npm install @minecraft/action-logger
```

Yarnを使用してインストール：

```bash
yarn add @minecraft/action-logger
```

## 基本的な使い方

```typescript
import { CoreLogger, LogLevel } from '@minecraft/action-logger';

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

// イベントを記録
logger.log({
  type: "user_action",
  level: LogLevel.INFO,
  details: {
    action: "login",
    userId: "12345"
  },
  metadata: {
    browser: "Chrome",
    version: "89.0.4389.82"
  }
});

// フィルターを使用してイベントを取得
const events = logger.getEvents();

// イベントをエクスポート
const jsonData = await logger.export({ format: "json" });

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