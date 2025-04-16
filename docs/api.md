# API リファレンス

[English](./en/api.md) | 日本語

## 目次

- [API リファレンス](#api-リファレンス)
  - [目次](#目次)
  - [コアインターフェース](#コアインターフェース)
    - [ILogger](#ilogger)
      - [メソッド](#メソッド)
    - [LogEvent](#logevent)
    - [LogFilter](#logfilter)
    - [LoggerOptions](#loggeroptions)
  - [ログレベル](#ログレベル)
  - [フィルター](#フィルター)
    - [TimeRangeFilter](#timerangefilter)
    - [LogLevelFilter](#loglevelfilter)
    - [EventTypeFilter](#eventtypefilter)
    - [MetadataFilter](#metadatafilter)
    - [CompositeFilter](#compositefilter)
    - [CustomFilter](#customfilter)
  - [エクスポート](#エクスポート)
    - [ExportOptions](#exportoptions)
    - [エクスポーター](#エクスポーター)
      - [JSONエクスポーター](#jsonエクスポーター)
      - [CSVエクスポーター](#csvエクスポーター)
      - [カスタムエクスポーター](#カスタムエクスポーター)

## コアインターフェース

### ILogger

ロガーの主要な機能を定義するインターフェース。

```typescript
interface ILogger {
  log(event: LogEvent): void;
  addFilter(filter: LogFilter): void;
  export(options: ExportOptions): Promise<string>;
  getEvents(filter?: LogFilter): LogEvent[];
  dispose(): void;
}
```

#### メソッド

- `log(event: LogEvent)`: イベントを記録します
- `addFilter(filter: LogFilter)`: フィルターを追加します
- `export(options: ExportOptions)`: イベントをエクスポートします
- `getEvents(filter?: LogFilter)`: 記録されたイベントを取得します
- `dispose()`: ロガーのリソースを解放します

### LogEvent

ログイベントの構造を定義するインターフェース。

```typescript
interface LogEvent {
  id: string;              // イベントの一意のID
  type: string;           // イベントの種類
  timestamp: number;      // イベントの発生時刻（UNIXタイムスタンプ）
  level: LogLevel;        // ログレベル
  details: unknown;       // イベントの詳細情報
  metadata?: Record<string, unknown>; // 追加のメタデータ
}
```

### LogFilter

ログフィルターのインターフェース。

```typescript
interface LogFilter {
  shouldInclude(event: LogEvent): boolean;
}
```

### LoggerOptions

ロガーの設定オプション。

```typescript
interface LoggerOptions {
  defaultLevel?: LogLevel;      // デフォルトのログレベル
  filters?: LogFilter[];        // 初期フィルター
  bufferSize?: number;         // バッファサイズ（イベントの最大保持数）
  autoExport?: {               // 自動エクスポートの設定
    format: "json" | "csv" | "custom";
    interval: number;          // エクスポートの間隔（ミリ秒）
    path: string;             // エクスポート先のパス
  };
}
```

## ログレベル

```typescript
enum LogLevel {
  DEBUG = 0,    // デバッグ情報
  VERBOSE = 1,  // 詳細な情報
  INFO = 2,     // 一般的な情報
  WARN = 3,     // 警告
  ERROR = 4,    // エラー
  FATAL = 5     // 致命的なエラー
}
```

## フィルター

### TimeRangeFilter

指定した時間範囲内のイベントのみを含めるフィルター。

```typescript
constructor(startTime: number, endTime: number)
```

### LogLevelFilter

指定したログレベル以上のイベントのみを含めるフィルター。

```typescript
constructor(minLevel: LogLevel)
```

### EventTypeFilter

指定したイベントタイプのみを含めるフィルター。

```typescript
constructor(types: string[])
```

### MetadataFilter

メタデータの内容でフィルタリングするフィルター。

```typescript
constructor(key: string, value: unknown)
```

### CompositeFilter

複数のフィルターを組み合わせて使用するフィルター。

```typescript
class CompositeFilter {
  addFilter(filter: LogFilter): void;
  clearFilters(): void;
}
```

### CustomFilter

カスタムの判定関数でフィルタリングするフィルター。

```typescript
constructor(predicate: (event: LogEvent) => boolean)
```

## エクスポート

### ExportOptions

エクスポートのオプション設定。

```typescript
interface ExportOptions {
  format: "json" | "csv" | "custom";
  filter?: LogFilter;
  config?: {
    separator?: string;           // CSV区切り文字
    includeHeaders?: boolean;     // CSVヘッダー include/exclude
    exportFunction?: (events: LogEvent[]) => string;  // カスタムエクスポート関数
  };
}
```

### エクスポーター

#### JSONエクスポーター

イベントをJSON形式でエクスポート。

```typescript
format: "json"
```

#### CSVエクスポーター

イベントをCSV形式でエクスポート。

```typescript
format: "csv"
config: {
  separator: ",",          // 区切り文字（デフォルト: カンマ）
  includeHeaders: true     // ヘッダー行を含める（デフォルト: true）
}
```

#### カスタムエクスポーター

独自の形式でイベントをエクスポート。

```typescript
format: "custom"
config: {
  exportFunction: (events) => string  // カスタム変換関数
}