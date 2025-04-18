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

## 設定とUIの実装例

### 基本的な設定例

```typescript
import { CoreLogger, LogLevel } from '@minecraft/action-logger';

// 開発環境向け設定
const devLogger = new CoreLogger({
  timer: {
    logCollectionInterval: 500,    // 高頻度のログ収集
    eventProcessDelay: 50,         // 最小限の遅延
    autoSaveInterval: 30000        // 30秒ごとの自動保存
  },
  input: {
    throttleTime: 100,            // 短い制限時間
    debounceTime: 150             // 短い待機時間
  },
  ui: {
    fontSize: 14,
    maxLogLines: 2000,
    animations: true
  },
  debug: true                     // デバッグモード有効
});

// 本番環境向け設定
const prodLogger = new CoreLogger({
  timer: {
    logCollectionInterval: 2000,   // 低頻度のログ収集
    eventProcessDelay: 200,        // 長めの遅延
    autoSaveInterval: 300000       // 5分ごとの自動保存
  },
  input: {
    throttleTime: 500,            // 長めの制限時間
    debounceTime: 600             // 長めの待機時間
  },
  ui: {
    fontSize: 12,
    maxLogLines: 1000,
    animations: false
  },
  debug: false                    // デバッグモード無効
});
```

### UIカスタマイズの実装例

```typescript
import { CoreLogger, UIManager } from '@minecraft/action-logger';

// UIマネージャーの設定とイベントハンドリング
const logger = new CoreLogger();
const ui = new UIManager({
  theme: {
    backgroundColor: "#2d2d2d",
    textColor: "#e0e0e0",
    accentColor: "#0078d4"
  },
  fontSize: 14,
  maxLogLines: 1000,
  animations: true,
  timestampFormat: "short"
});

// イベントリスナーの設定
ui.on("logToggle", (event) => {
  const { isVisible } = event.detail;
  console.log(`ログ表示: ${isVisible ? "表示" : "非表示"}`);
});

ui.on("filterApply", (event) => {
  const { filter } = event.detail;
  logger.applyFilter(filter);
});

ui.on("themeChange", (event) => {
  const { theme } = event.detail;
  saveUserPreferences({ theme });
});

// テーマの動的更新
function updateThemeForTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 18 || hour < 6) {
    // 夜間テーマ
    ui.updateTheme({
      backgroundColor: "#1a1a1a",
      textColor: "#d4d4d4",
      accentColor: "#565656"
    });
  } else {
    // 日中テーマ
    ui.updateTheme({
      backgroundColor: "#ffffff",
      textColor: "#000000",
      accentColor: "#0066cc"
    });
  }
}
```

### タイマーとログ表示の連携例

```typescript
import { CoreLogger, LogLevel } from '@minecraft/action-logger';

class GameLogger {
  private logger: CoreLogger;
  private updateInterval: number;
  
  constructor() {
    this.logger = new CoreLogger({
      timer: {
        logCollectionInterval: 1000,
        eventProcessDelay: 100
      },
      ui: {
        maxLogLines: 1000,
        animations: true
      }
    });
    
    this.setupPerformanceMonitoring();
    this.setupAutoExport();
  }
  
  // パフォーマンスモニタリングの設定
  private setupPerformanceMonitoring() {
    this.updateInterval = setInterval(() => {
      const stats = this.getGameStats();
      this.logger.log({
        type: "performance",
        level: LogLevel.INFO,
        details: {
          fps: stats.fps,
          memory: stats.memoryUsage,
          entities: stats.activeEntities
        }
      });
      
      // パフォーマンス警告の設定
      if (stats.fps < 30) {
        this.logger.log({
          type: "performance_warning",
          level: LogLevel.WARN,
          details: {
            message: "FPSが低下しています",
            currentFps: stats.fps
          }
        });
      }
    }, 5000); // 5秒ごとに更新
  }
  
  // 自動エクスポートの設定
  private setupAutoExport() {
    const exportInterval = setInterval(async () => {
      try {
        // パフォーマンスログのエクスポート
        await this.logger.export({
          format: "json",
          filename: `performance-${Date.now()}.json`,
          filter: {
            type: "performance"
          }
        });
        
        // 警告ログのエクスポート
        await this.logger.export({
          format: "csv",
          filename: `warnings-${Date.now()}.csv`,
          filter: {
            level: LogLevel.WARN
          }
        });
      } catch (error) {
        console.error("ログエクスポートエラー:", error);
      }
    }, 300000); // 5分ごとにエクスポート
  }
  
  // リソースのクリーンアップ
  public dispose() {
    clearInterval(this.updateInterval);
    this.logger.dispose();
  }
  
  // ゲーム統計の取得（実装例）
  private getGameStats() {
    return {
      fps: 60, // 実際のFPS測定を実装
      memoryUsage: 500, // メモリ使用量（MB）
      activeEntities: 100 // アクティブなエンティティ数
    };
  }
}

// 使用例
const gameLogger = new GameLogger();

// ゲーム終了時
window.addEventListener('beforeunload', () => {
  gameLogger.dispose();
});
```

これらの実装例は、ActionLoggerの高度な機能を活用する方法を示しています。実際の使用時には、アプリケーションの要件に応じてこれらの例を参考に、最適な実装を検討してください。