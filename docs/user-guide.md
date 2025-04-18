# @terao-ryohei/mc-action-logger ユーザーガイド

## 1. はじめに

このライブラリは、TypeScriptアプリケーションのための柔軟で拡張性の高いロギングソリューションです。特にMinecraftのスクリプト開発向けに最適化されていますが、一般的なアプリケーションでも利用可能です。

主な機能：
- イベントベースのログ記録
- 柔軟なフィルタリング機能
- JSON/CSVエクスポート
- メタデータサポート
- 自動エクスポート機能

## 2. インストールと設定

### インストール
```bash
npm install @terao-ryohei/mc-action-logger
```

### 基本設定
```typescript
import { CoreLogger, LogLevel } from '@terao-ryohei/mc-action-logger';

const logger = new CoreLogger({
  defaultLevel: LogLevel.INFO,
  bufferSize: 1000,
  autoExport: {
    format: "json",
    interval: 60000, // 1分ごとに自動エクスポート
    path: "./logs"
  }
});
```

## 3. イベントの記録

### 基本的なイベント記録
```typescript
// 一般的なイベントの記録
logger.log({
  type: "app.general",
  level: LogLevel.INFO,
  details: {
    action: "startup",
    version: "1.0.0"
  }
});

// エラーの記録
logger.log({
  type: "app.error",
  level: LogLevel.ERROR,
  details: {
    message: "接続エラー",
    code: "E_CONN_FAILED"
  },
  metadata: {
    stack: new Error().stack
  }
});

// 詳細な情報の記録
logger.log({
  type: "app.debug",
  level: LogLevel.DEBUG,
  details: {
    function: "processData",
    input: { /* 入力データ */ },
    output: { /* 出力データ */ }
  }
});
```

## 4. イベントの取得とフィルタリング

### 基本的なイベント取得
```typescript
// 全てのイベントを取得
const allEvents = logger.getEvents();

// 最新の10件を取得
const recentEvents = logger.getEvents({ limit: 10 });

// 特定のレベルのイベントを取得
const errorEvents = logger.getEvents({
  level: LogLevel.ERROR
});
```

### フィルターの使用
```typescript
import {
  TimeRangeFilter,
  LogLevelFilter,
  EventTypeFilter
} from '@terao-ryohei/mc-action-logger';

// 複数のフィルターを組み合わせる
logger.addFilter(new TimeRangeFilter(
  Date.now() - 3600000,
  Date.now()
));
logger.addFilter(new LogLevelFilter(LogLevel.WARN));
logger.addFilter(new EventTypeFilter(['app.error']));

// フィルター適用後のイベント取得
const filteredEvents = logger.getEvents();
```

### カスタムフィルターの作成
```typescript
import { BaseFilter } from '@terao-ryohei/mc-action-logger';

// カスタムフィルターの実装
class CustomFilter extends BaseFilter {
  constructor(private pattern: RegExp) {
    super();
  }

  apply(event: LogEvent): boolean {
    return this.pattern.test(event.type);
  }
}

// カスタムフィルターの使用
const customFilter = new CustomFilter(/^app\./);
logger.addFilter(customFilter);
```

## 5. エクスポート機能

### 基本的なエクスポート
```typescript
// JSONエクスポート
const jsonData = await logger.export({ format: "json" });

// CSVエクスポート
const csvData = await logger.export({ format: "csv" });
```

### 自動エクスポート設定
```typescript
const logger = new CoreLogger({
  autoExport: {
    format: "json",
    interval: 60000, // 1分ごと
    path: "./logs",
    filename: "app-{date}-{index}.json"
  }
});
```

### カスタムエクスポート
```typescript
const customData = await logger.export({
  format: "custom",
  config: {
    transform: (event) => ({
      timestamp: new Date(event.timestamp).toISOString(),
      message: `${event.type}: ${JSON.stringify(event.details)}`,
      level: event.level
    }),
    format: (events) => JSON.stringify(events, null, 2)
  }
});
```

## 6. 詳細な設定オプション

### タイマー設定

タイマー設定では、ログの収集やイベント処理のタイミングを制御します：

```typescript
const logger = new CoreLogger({
  timer: {
    // ログ収集の間隔（ミリ秒）
    logCollectionInterval: 1000,    // 1秒ごとにログを収集
    
    // イベント処理の遅延時間（ミリ秒）
    eventProcessDelay: 100,         // イベントの処理を100ms遅延
    
    // 自動保存の間隔（ミリ秒）
    autoSaveInterval: 5000,         // 5秒ごとに自動保存
    
    // タイムアウト時間（ミリ秒）
    timeout: 30000,                 // 30秒でタイムアウト
    
    // バッチ処理の最大サイズ
    batchSize: 100                  // 一度に処理する最大イベント数
  }
});
```

各設定の推奨値：
- logCollectionInterval: 500-2000ms（負荷と即時性のバランス）
- eventProcessDelay: 50-200ms（UI応答性とバッチ処理効率のバランス）
- autoSaveInterval: 5000-60000ms（データ保護と書き込み頻度のバランス）

### 入力管理設定

キーバインドとイベントの制御を設定します：

```typescript
const logger = new CoreLogger({
  input: {
    // キーバインドの設定
    keyBindings: {
      toggleLog: "ctrl+l",     // ログ表示の切り替え
      applyFilter: "ctrl+f",   // フィルターの適用
      clearLog: "ctrl+k"       // ログのクリア
    },
    
    // イベント制御
    throttleTime: 250,         // イベントの制限（ミリ秒）
    debounceTime: 300         // イベントの待機（ミリ秒）
  }
});
```

キーバインドのカスタマイズ例：
- toggleLog: "alt+l", "cmd+l"
- applyFilter: "alt+f", "cmd+f"
- clearLog: "alt+k", "cmd+k"

### UI設定

表示とスタイルをカスタマイズします：

```typescript
const logger = new CoreLogger({
  ui: {
    // テーマ設定
    theme: {
      backgroundColor: "#1e1e1e",  // 背景色
      textColor: "#ffffff",        // テキスト色
      accentColor: "#007acc"       // アクセント色
    },
    
    // 表示設定
    fontSize: 14,                  // フォントサイズ（px）
    maxLogLines: 1000,            // 最大表示行数
    animations: true,             // アニメーション有効/無効
    timestampFormat: "short"      // タイムスタンプ形式
  }
});
```

## 7. UIカスタマイズガイド

### テーマのカスタマイズ

1. ダークテーマ
```typescript
logger.updateConfig({
  ui: {
    theme: {
      backgroundColor: "#2d2d2d",
      textColor: "#e0e0e0",
      accentColor: "#0078d4"
    }
  }
});
```

2. ライトテーマ
```typescript
logger.updateConfig({
  ui: {
    theme: {
      backgroundColor: "#ffffff",
      textColor: "#000000",
      accentColor: "#0066cc"
    }
  }
});
```

### 表示のカスタマイズ

1. 高解像度ディスプレイ向け
```typescript
logger.updateConfig({
  ui: {
    fontSize: 16,
    maxLogLines: 2000,
    animations: true
  }
});
```

2. パフォーマンス重視
```typescript
logger.updateConfig({
  ui: {
    fontSize: 12,
    maxLogLines: 500,
    animations: false
  }
});
```

### タイムスタンプ形式

```typescript
// 詳細な時刻表示
logger.updateConfig({
  ui: {
    timestampFormat: "full"  // 例: "2025-04-18 10:45:30.123"
  }
});

// 短い形式
logger.updateConfig({
  ui: {
    timestampFormat: "short"  // 例: "10:45:30"
  }
});
```

## 8. タイマーと入力管理の設定

### パフォーマンス最適化

1. 高性能環境向け
```typescript
logger.updateConfig({
  timer: {
    logCollectionInterval: 500,
    eventProcessDelay: 50,
    batchSize: 200
  }
});
```

2. 低負荷設定
```typescript
logger.updateConfig({
  timer: {
    logCollectionInterval: 2000,
    eventProcessDelay: 200,
    batchSize: 50
  }
});
```

### イベント制御の最適化

1. リアルタイム処理向け
```typescript
logger.updateConfig({
  input: {
    throttleTime: 100,
    debounceTime: 150
  }
});
```

2. バッチ処理向け
```typescript
logger.updateConfig({
  input: {
    throttleTime: 500,
    debounceTime: 600
  }
});
```

## 9. ログエクスポートの使用例

### 自動エクスポート設定

1. 頻繁な自動保存
```typescript
logger.updateConfig({
  timer: {
    autoSaveInterval: 60000  // 1分ごと
  }
});
```

2. 定期的なバックアップ
```typescript
logger.updateConfig({
  timer: {
    autoSaveInterval: 3600000  // 1時間ごと
  }
});
```

## 10. よくある質問

Q: ログは自動的に保存されますか？
A: `autoExport` オプションを設定することで、指定した間隔で自動的にログを保存できます。

Q: 過去のログを取得できますか？
A: はい、`getEvents()` メソッドにフィルターを適用することで、過去のログを取得できます。`TimeRangeFilter`を使用すると、特定の期間のログを取得できます。

Q: イベントの詳細な情報は記録できますか？
A: はい、`details`フィールドと`metadata`フィールドを使用して、任意の詳細情報を記録できます。

Q: ログの容量制限はありますか？
A: `bufferSize`オプションで指定した件数までメモリに保持され、それを超えると古いログは自動的に削除されます。ただし、エクスポートされたログはこの制限の影響を受けません。

Q: フィルターを使用するとパフォーマンスに影響がありますか？
A: フィルターは効率的に実装されており、通常のログ記録には大きな影響を与えません。ただし、複雑なフィルターを多数使用する場合は、パフォーマンスに影響を与える可能性があります。

Q: フィルター設定は保存されますか？
A: フィルター設定はメモリ上で管理されます。永続化が必要な場合は、ロガーの初期化時に再度フィルターを設定する必要があります。

Q: カスタムのログ形式を定義できますか？
A: はい、`export`メソッドの`format: "custom"`オプションを使用して、独自のフォーマットを定義できます。

## 7. トラブルシューティング

### ログが記録されない場合
1. ログレベルの設定を確認する（デフォルトレベル以上のログのみ記録される）
2. フィルターの設定を確認する
3. バッファサイズの設定を確認する

### エクスポートが失敗する場合
1. 出力先ディレクトリの書き込み権限を確認
2. ディスク容量を確認
3. ファイル名に使用できない文字が含まれていないか確認

### メモリ使用量が増加する場合
1. `bufferSize`の設定を見直す
2. 定期的なエクスポートを設定する
3. 不要なフィルターを削除する

## 8. ビルド手順

### 環境変数の設定

1. プロジェクトのルートディレクトリに `.env` ファイルを作成します。

2. 以下の環境変数を設定します：

```
WIN_OUTPUT_DIR=C:/Path/To/Your/Minecraft/development_behavior_packs
WIN_OUTPUT_DIR2=C:/Path/To/Your/Minecraft/development_resource_packs
```

必要な環境変数の説明：
- `WIN_OUTPUT_DIR`: ビヘイビアパックの出力先ディレクトリ
- `WIN_OUTPUT_DIR2`: リソースパックの出力先ディレクトリ

設定例：
```
WIN_OUTPUT_DIR=C:/Users/YourName/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_behavior_packs
WIN_OUTPUT_DIR2=C:/Users/YourName/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_resource_packs
```

### 環境変数設定のトラブルシューティング

1. .envファイルが認識されない場合：
   - ファイル名が正確に `.env` であることを確認（.env.txtではない）
   - ファイルがプロジェクトのルートディレクトリにあることを確認
   - ファイルを一度開いて保存し直す

2. パスが正しく認識されない場合：
   - パスの区切り文字が正しいことを確認（Windowsでも / を使用）
   - パスの最後にスラッシュを付けない
   - パスに日本語や特殊文字が含まれていないことを確認

3. ビルドエラーが発生する場合：
   - 指定したディレクトリが実際に存在することを確認
   - 指定したディレクトリへの書き込み権限があることを確認
   - Minecraftが実行中の場合は一度終了してから再試行
