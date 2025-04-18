# @terao-ryohei/mc-action-logger

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
- ⚙️ 包括的な設定システム
- 🎨 カスタマイズ可能なUI
- ⏲️ 高度なタイマーと入力管理

## 設定システム

ActionLoggerは柔軟な設定システムを提供し、アプリケーションのニーズに合わせて動作をカスタマイズできます：

```typescript
import { CoreLogger } from '@terao-ryohei/mc-action-logger';

const logger = new CoreLogger({
  // タイマー設定
  timer: {
    logCollectionInterval: 1000,  // ログ収集間隔（ミリ秒）
    eventProcessDelay: 100,      // イベント処理の遅延（ミリ秒）
    autoSaveInterval: 5000       // 自動保存間隔（ミリ秒）
  },
  // 入力管理設定
  input: {
    keyBindings: {
      toggleLog: "ctrl+l",      // ログ表示切り替え
      applyFilter: "ctrl+f"     // フィルター適用
    }
  },
  // UI設定
  ui: {
    theme: {
      backgroundColor: "#1e1e1e",
      textColor: "#ffffff",
      accentColor: "#007acc"
    },
    fontSize: 14,
    maxLogLines: 1000,
    animations: true
  }
});
```

## UIカスタマイズ

ActionLoggerのUIは完全にカスタマイズ可能です：

- 🎨 テーマカラーの変更（背景色、テキスト色、アクセント色）
- 📏 フォントサイズの調整
- 📋 ログ表示行数の制限設定
- ⚡ アニメーション制御
- 🕒 タイムスタンプ表示形式の選択

```typescript
// UIテーマのカスタマイズ例
logger.updateConfig({
  ui: {
    theme: {
      backgroundColor: "#2d2d2d",
      textColor: "#e0e0e0",
      accentColor: "#0078d4"
    },
    fontSize: 16,
    maxLogLines: 2000,
    animations: true,
    timestampFormat: "short"
  }
});
```

## タイマーと入力管理

タイマーと入力の設定をカスタマイズすることで、パフォーマンスと使用感を最適化できます：

```typescript
// タイマーと入力の設定例
logger.updateConfig({
  timer: {
    logCollectionInterval: 1000,  // 1秒ごとにログを収集
    eventProcessDelay: 50,        // イベント処理を50ms遅延
    autoSaveInterval: 300000,     // 5分ごとに自動保存
    timeout: 30000,               // 30秒でタイムアウト
    batchSize: 100               // バッチ処理の最大サイズ
  },
  input: {
    keyBindings: {
      toggleLog: "ctrl+l",
      applyFilter: "ctrl+f",
      clearLog: "ctrl+k"
    },
    throttleTime: 250,          // 入力の制限時間（ミリ秒）
    debounceTime: 300           // 入力の待機時間（ミリ秒）
  }
});
```

## インストール

npmを使用してインストール：

```bash
npm install @terao-ryohei/mc-action-logger
```

Yarnを使用してインストール：

```bash
yarn add @terao-ryohei/mc-action-logger
```

## 基本的な使い方

```typescript
import { CoreLogger, LogLevel } from '@terao-ryohei/mc-action-logger';

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