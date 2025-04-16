# 使用例とサンプルコード

[English](./en/examples.md) | 日本語

## 目次

- [基本的な使用例](#基本的な使用例)
- [フィルターの活用](#フィルターの活用)
- [エクスポート機能の活用](#エクスポート機能の活用)
- [実践的なシナリオ](#実践的なシナリオ)

## 基本的な使用例

### シンプルなログ記録

```typescript
import { CoreLogger, LogLevel } from '@minecraft/action-logger';

// 基本的なロガーの設定
const logger = new CoreLogger();

// 情報レベルのログを記録
logger.log({
  type: "app_status",
  level: LogLevel.INFO,
  details: "アプリケーションが起動しました"
});

// 警告レベルのログを記録
logger.log({
  type: "system_warning",
  level: LogLevel.WARN,
  details: "メモリ使用率が80%を超えています",
  metadata: {
    memoryUsage: 82,
    timestamp: Date.now()
  }
});
```

### 自動エクスポート設定

```typescript
const logger = new CoreLogger({
  defaultLevel: LogLevel.INFO,
  bufferSize: 5000,
  autoExport: {
    format: "json",
    interval: 300000, // 5分ごと
    path: "./logs/auto-export"
  }
});
```

## フィルターの活用

### 複数フィルターの組み合わせ

```typescript
import {
  CoreLogger,
  LogLevel,
  TimeRangeFilter,
  LogLevelFilter,
  EventTypeFilter
} from '@minecraft/action-logger';

const logger = new CoreLogger();

// 過去1時間のエラーログのみを表示するフィルター
const hourAgo = Date.now() - 3600000;
logger.addFilter(new TimeRangeFilter(hourAgo, Date.now()));
logger.addFilter(new LogLevelFilter(LogLevel.ERROR));

// 特定のイベントタイプのみを表示
logger.addFilter(new EventTypeFilter(['user_error', 'system_error']));

// フィルター適用後のイベント取得
const errorEvents = logger.getEvents();
```

### カスタムフィルターの作成

```typescript
import { CustomFilter } from '@minecraft/action-logger';

// ユーザーIDに基づくフィルター
const userFilter = new CustomFilter((event) => {
  if (event.metadata?.userId) {
    return event.metadata.userId === "12345";
  }
  return false;
});

logger.addFilter(userFilter);
```

## エクスポート機能の活用

### JSON形式でのエクスポート

```typescript
// 全イベントをJSONとしてエクスポート
const jsonData = await logger.export({ format: "json" });

// ファイルに保存
import { writeFileSync } from 'fs';
writeFileSync('./logs/export.json', jsonData);
```

### CSV形式でのエクスポート

```typescript
// カスタム区切り文字を使用したCSVエクスポート
const csvData = await logger.export({
  format: "csv",
  config: {
    separator: ";",
    includeHeaders: true
  }
});
```

### カスタムフォーマットでのエクスポート

```typescript
// マークダウン形式への変換
const markdownExport = await logger.export({
  format: "custom",
  config: {
    exportFunction: (events) => {
      return events.map(e => {
        const level = `[${LogLevel[e.level]}]`.padEnd(8);
        return `- ${level} ${new Date(e.timestamp).toISOString()} - ${e.type}\n  ${JSON.stringify(e.details)}`;
      }).join('\n');
    }
  }
});
```

## 実践的なシナリオ

### ユーザーアクティビティの追跡

```typescript
import { CoreLogger, LogLevel, MetadataFilter } from '@minecraft/action-logger';

// アクティビティロガーの設定
const activityLogger = new CoreLogger({
  defaultLevel: LogLevel.INFO,
  autoExport: {
    format: "json",
    interval: 3600000, // 1時間ごと
    path: "./logs/user-activity"
  }
});

// ユーザーアクションを記録
function logUserAction(userId: string, action: string, details: any) {
  activityLogger.log({
    type: "user_action",
    level: LogLevel.INFO,
    details: {
      action,
      ...details
    },
    metadata: {
      userId,
      timestamp: new Date().toISOString()
    }
  });
}

// 特定ユーザーのアクティビティを取得
const userFilter = new MetadataFilter("userId", "12345");
const userActivity = activityLogger.getEvents(userFilter);
```

### エラー監視システム

```typescript
import { CoreLogger, LogLevel, CustomFilter } from '@minecraft/action-logger';

// エラー監視ロガーの設定
const errorLogger = new CoreLogger({
  defaultLevel: LogLevel.ERROR,
  autoExport: {
    format: "json",
    interval: 60000, // 1分ごと
    path: "./logs/errors"
  }
});

// エラーハンドラーの設定
window.onerror = (message, source, lineno, colno, error) => {
  errorLogger.log({
    type: "unhandled_error",
    level: LogLevel.ERROR,
    details: {
      message,
      source,
      lineno,
      colno,
      stack: error?.stack
    },
    metadata: {
      browser: navigator.userAgent,
      timestamp: Date.now()
    }
  });
};

// 重大なエラーの監視
const criticalErrorFilter = new CustomFilter((event) => {
  return event.level === LogLevel.ERROR &&
         event.details?.stack?.includes("api.critical");
});

// 監視処理
setInterval(() => {
  const criticalErrors = errorLogger.getEvents(criticalErrorFilter);
  if (criticalErrors.length > 0) {
    notifyTeam(criticalErrors); // 通知処理
  }
}, 300000); // 5分ごとにチェック
```

### パフォーマンスモニタリング

```typescript
import { CoreLogger, LogLevel, TimeRangeFilter } from '@minecraft/action-logger';

// パフォーマンスモニタリングロガーの設定
const performanceLogger = new CoreLogger({
  defaultLevel: LogLevel.INFO,
  bufferSize: 10000
});

// パフォーマンスデータの記録
function logPerformanceMetric(metric: string, value: number) {
  performanceLogger.log({
    type: "performance_metric",
    level: LogLevel.INFO,
    details: {
      metric,
      value
    },
    metadata: {
      timestamp: Date.now()
    }
  });
}

// パフォーマンス分析
function analyzePerformance(startTime: number, endTime: number) {
  const timeFilter = new TimeRangeFilter(startTime, endTime);
  const metrics = performanceLogger.getEvents(timeFilter);
  
  // メトリクスの集計
  const analysis = metrics.reduce((acc, event) => {
    const { metric, value } = event.details as any;
    if (!acc[metric]) {
      acc[metric] = {
        count: 0,
        total: 0,
        min: value,
        max: value
      };
    }
    
    acc[metric].count++;
    acc[metric].total += value;
    acc[metric].min = Math.min(acc[metric].min, value);
    acc[metric].max = Math.max(acc[metric].max, value);
    
    return acc;
  }, {});
  
  return analysis;
}
```

これらの例は、ActionLoggerの主要な機能の使用方法を示しています。実際の使用時には、アプリケーションの要件に応じてこれらの例を組み合わせたり、カスタマイズしたりすることができます。