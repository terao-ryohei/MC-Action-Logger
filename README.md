# Minecraft Action Logger (マインクラフト行動ログ作成アドオン)

[English](#english) | [日本語](#japanese)

<a name="japanese"></a>

# 【日本語】マインクラフト行動ログ作成アドオン

## 概要

このアドオンは、Minecraftでのプレイヤーの行動を自動的に記録し、ゲーム内での活動を分かりやすく確認できるようにするツールです。時計アイテムによるゲーム管理と、詳細なログ記録機能を提供します。

## 主な機能

- ブロックの使用履歴の記録
- アイテムの作成・使用の追跡
- ゲーム内イベントのログ保存
- 活動の統計情報の表示
- ゲーム時間の管理と表示
- エンティティの状態変化の記録
- プレイヤーの状態変化の追跡

## 必要条件

- Minecraft 統合版 1.20.0以降
- ベースゲームバージョン: 1.20.60以降

## インストール方法

1. `.mcaddon`ファイルをダウンロード
2. ダブルクリックでMinecraftを開く
3. アドオンがインポートされることを確認
4. ワールドの設定で本アドオンを有効化

## 基本的な使い方

### ゲームの開始と終了

1. ゲームの開始:
   - 時計アイテムを入手
   - 右クリックでゲーム開始
   - 自動的にタイマーが開始
   - 画面下部に残り時間が表示

2. ゲームの終了:
   - タイマーが0になると自動終了

### アイテムの使用方法

- 時計アイテム:
  - 右クリック: ゲームの開始

- 紙アイテム（ログブック）:
  - 右クリック: ログの表示

## コマンド一覧

### 基本コマンド
```
/scriptevent scriptlog:show [件数]    - 最新のログを表示（デフォルト10件）
/scriptevent scriptlog:history        - 全てのログを表示
/scriptevent scriptlog:stats         - 統計情報を表示
```

### 検索・フィルター
```
/scriptevent scriptlog:search <キーワード>  - キーワード検索
/scriptevent scriptlog:filter <カテゴリ>   - カテゴリでフィルター
/scriptevent scriptlog:time <開始> <終了>  - 時間範囲で表示
/scriptevent scriptlog:player <名前>      - プレイヤーで絞り込み
```

### 管理コマンド
```
/scriptevent scriptlog:pause   - ログ記録を一時停止
/scriptevent scriptlog:resume  - ログ記録を再開
/scriptevent scriptlog:clear   - ログをクリア
```

## トラブルシューティング

### コマンドが機能しない場合
1. 実験的なゲームプレイが有効になっているか確認
2. アドオンが正しく適用されているか確認
3. クリエイター機能のコンテンツログの履歴を開き、エラーがないか確認

## 開発者向け情報

### サブモジュールとしての使用方法

1. プロジェクトに追加:
```bash
git submodule add https://github.com/yourusername/minecraft-action-logger ActionLogger
```

2. モジュールの初期化:
```typescript
import { ActionLoggerModule } from "./ActionLogger/src/ActionLoggerModule";

// モジュールの初期化
const logger = ActionLoggerModule.getInstance();
logger.initialize({
  gameTime: { maxDuration: 3600 },  // 1時間
  filters: {
    minLogLevel: "info",
    customFilters: ["block", "player"]
  }
});

// エクスポート機能の設定
logger.initializeExporter({
  format: "json",
  outputPath: "./logs",
  compression: true
});

// ゲーム開始
logger.start();
```

### 設定オプション

```typescript
interface LoggerConfiguration {
  gameTime: {
    maxDuration: number;      // 最大ゲーム時間（秒）
    warningTime?: number;     // 警告を表示する残り時間（秒）
  };
  filters: {
    minLogLevel: "debug" | "info" | "warn" | "error";
    customFilters?: string[];  // 有効にするフィルター
  };
}

interface ExportConfiguration {
  format: "json" | "csv";     // 出力形式
  outputPath: string;         // 出力先ディレクトリ
  compression?: boolean;      // 圧縮の有効/無効
  filename?: string;          // 出力ファイル名
}
```

### エクスポート機能の使用例

```typescript
// JSONフォーマットでエクスポート
await logger.exportLogs();

// 現在のログを取得
const currentLogs = logger.getLogs();

// 設定の更新
logger.updateConfig({
  filters: {
    minLogLevel: "warn"
  }
});

// ゲームの停止とリソース解放
logger.start();
logger.stop();
```

### 環境設定
1. `.env`ファイルをプロジェクトルートに作成:
```
WIN_OUTPUT_DIR=C:/Path/To/Your/Minecraft/development_behavior_packs
WIN_OUTPUT_DIR2=C:/Path/To/Your/Minecraft/development_resource_packs
```

### 注意事項
- 一度に1つのゲームのみ実行可能
- プレイヤーの退出時にデータは保持
- 全プレイヤーが退出するとゲームは自動的に終了
- 大量のログが記録される場合、パフォーマンスに影響する可能性あり

## ライセンス

MITライセンスで提供されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

---

<a name="english"></a>

# [English] Minecraft Action Logger

## Overview

This addon automatically records player actions in Minecraft, making it easy to review in-game activities. It provides game management with a clock item and detailed logging features.

## Key Features

- Record block usage history
- Track item crafting and usage
- Store in-game event logs
- Display activity statistics
- Manage and display game time
- Record entity state changes
- Track player state changes

## Requirements

- Minecraft Bedrock Edition 1.20.0 or later
- Base game version: 1.20.60 or later

## Installation

1. Download the `.mcaddon` file
2. Double-click to open Minecraft
3. Confirm the addon is imported
4. Enable the addon in world settings

## Basic Usage

### Starting and Ending a Game

1. Starting the game:
   - Obtain the clock item
   - Right-click to start the game
   - Timer starts automatically
   - Remaining time is displayed at the bottom of the screen

2. Ending the game:
   - The game ends automatically when the timer reaches 0

### Using Items

- Clock item:
  - Right-click: Start the game

- Paper item (Log book):
  - Right-click: Display logs

## Commands

### Basic Commands
```
/scriptevent scriptlog:show [count]    - Show recent logs (default 10)
/scriptevent scriptlog:history         - Show all logs
/scriptevent scriptlog:stats           - Show statistics
```

### Search & Filter
```
/scriptevent scriptlog:search <keyword>    - Search by keyword
/scriptevent scriptlog:filter <category>   - Filter by category
/scriptevent scriptlog:time <start> <end>  - Show logs by time range
/scriptevent scriptlog:player <name>       - Filter by player
```

### Management Commands
```
/scriptevent scriptlog:pause   - Pause log recording
/scriptevent scriptlog:resume  - Resume log recording
/scriptevent scriptlog:clear   - Clear logs
```

## Troubleshooting

### If Commands Are Not Working
1. Make sure experimental gameplay is enabled
2. Confirm the addon is properly applied
3. Open the Creator Content Log and check for errors

## Developer Information

### Using as a Submodule

1. Add as a submodule to your project:
```bash
git submodule add https://github.com/yourusername/minecraft-action-logger ActionLogger
```

2. Initialize the module:
```typescript
import { ActionLoggerModule } from "./ActionLogger/src/ActionLoggerModule";

// Initialize the module
const logger = ActionLoggerModule.getInstance();
logger.initialize({
  gameTime: { maxDuration: 3600 },  // 1 hour
  filters: {
    minLogLevel: "info",
    customFilters: ["block", "player"]
  }
});

// Set up export functionality
logger.initializeExporter({
  format: "json",
  outputPath: "./logs",
  compression: true
});

// Start the game
logger.start();
```

### Configuration Options

```typescript
interface LoggerConfiguration {
  gameTime: {
    maxDuration: number;      // Maximum game time (seconds)
    warningTime?: number;     // Time remaining to show warning (seconds)
  };
  filters: {
    minLogLevel: "debug" | "info" | "warn" | "error";
    customFilters?: string[];  // Enabled filters
  };
}

interface ExportConfiguration {
  format: "json" | "csv";     // Output format
  outputPath: string;         // Output directory
  compression?: boolean;      // Enable/disable compression
  filename?: string;          // Output file name
}
```

### Export Example

```typescript
// Export in JSON format
await logger.exportLogs();

// Get current logs
const currentLogs = logger.getLogs();

// Update configuration
logger.updateConfig({
  filters: {
    minLogLevel: "warn"
  }
});

// Stop the game and release resources
logger.start();
logger.stop();
```

### Environment Setup
1. Create a `.env` file in the project root:
```
WIN_OUTPUT_DIR=C:/Path/To/Your/Minecraft/development_behavior_packs
WIN_OUTPUT_DIR2=C:/Path/To/Your/Minecraft/development_resource_packs
```

### Important Notes
- Only one game can run at a time
- Data is retained when players leave
- The game automatically ends when all players exit
- Large amounts of logging may impact performance

## License

Available under the MIT License. See [LICENSE](LICENSE) file for details.