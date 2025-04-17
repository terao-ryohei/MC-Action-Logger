# @minecraft-script/action-logger ユーザーガイド

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
npm install @minecraft-script/action-logger
```

### 基本設定
```typescript
import { CoreLogger, LogLevel } from '@minecraft-script/action-logger';

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
} from '@minecraft-script/action-logger';

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
import { BaseFilter } from '@minecraft-script/action-logger';

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

## 6. よくある質問

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
