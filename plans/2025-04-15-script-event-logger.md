# ScriptEvent Logger 改善設計書

## 概要

既存のscriptlog機能をscripteventベースに改善し、より柔軟で拡張性の高いログシステムを実現します。

## 変更点

1. イベントベースのログ記録システムへの移行
2. コマンドシステムの改善
3. 検索・フィルタリング機能の強化
4. UIインタラクションの改善

## 詳細設計

### 1. イベントの定義と型

```typescript
// ScriptEventTypes.ts
export interface ScriptLogEvent {
  type: ScriptLogEventType;
  timestamp: number;
  player: string;
  category: ScriptLogCategory;
  data: ScriptLogData;
}

export type ScriptLogEventType =
  | "log_show"
  | "log_history"
  | "log_stats"
  | "log_search"
  | "log_filter"
  | "log_time"
  | "log_player"
  | "log_pause"
  | "log_resume"
  | "log_clear";

export type ScriptLogCategory =
  | "craft"
  | "storage"
  | "smelt"
  | "enchant"
  | "repair"
  | "brew"
  | "block"
  | "move";

export interface ScriptLogData {
  keyword?: string;
  category?: ScriptLogCategory;
  timeRange?: {
    start: number;
    end: number;
  };
  playerName?: string;
}
```

### 2. ScriptEventLoggerの改善

```typescript
// IScriptEventLogger.ts
export interface IScriptEventLogger {
  // コマンド実行メソッド
  executeCommand(command: string, args: string[]): void;
  
  // ログ記録メソッド
  logEvent(event: ScriptLogEvent): void;
  
  // 検索・フィルタリングメソッド
  searchLogs(criteria: SearchCriteria): ScriptLogEvent[];
  
  // 管理メソッド
  pause(): void;
  resume(): void;
  clear(): void;
  reset(): void;
  dispose(): void;
}

// ScriptEventLogger.ts
export class ScriptEventLogger implements IScriptEventLogger {
  private readonly playerActionLogManger: PlayerActionLogManger;
  private readonly eventEmitter: world.events;
  private isEnabled: boolean = false;
  private logs: ScriptLogEvent[] = [];
  private readonly maxLogs: number = 1000;

  constructor(playerActionLogManger: PlayerActionLogManger) {
    this.playerActionLogManger = playerActionLogManger;
    this.initializeEventHandlers();
  }

  private initializeEventHandlers(): void {
    // scripteventイベントのリスナー設定
    world.events.scriptEvent.subscribe((event) => {
      if (!this.isEnabled) return;
      
      const [command, ...args] = event.id.split(" ");
      if (command === "scriptlog") {
        this.executeCommand(args[0], args.slice(1));
      }
    });
  }

  public executeCommand(command: string, args: string[]): void {
    switch (command) {
      case "show":
        this.showLatestLogs();
        break;
      case "history":
        this.showLogHistory();
        break;
      case "stats":
        this.showStats();
        break;
      // 他のコマンドハンドラー
    }
  }

  private showLatestLogs(): void {
    const latest = this.logs.slice(-10);
    this.displayLogs(latest);
  }

  private showLogHistory(): void {
    this.displayLogs(this.logs);
  }

  private showStats(): void {
    const stats = this.calculateStats();
    this.displayStats(stats);
  }
}
```

### 3. UIManagerとの統合

```typescript
// UIManager.ts
export class UIManager {
  private readonly mainManager: MainManager;
  private readonly actionForm: ActionFormData;

  public showLogUI(): void {
    const form = new ActionFormData()
      .title("ログビューアー")
      .button("最新のログを表示")
      .button("履歴を表示")
      .button("統計を表示")
      .button("検索")
      .button("フィルター");

    form.show(this.player).then((response) => {
      if (response.selection === 0) {
        this.mainManager.getScriptEventLogger().executeCommand("show", []);
      }
      // 他のUIハンドラー
    });
  }

  private displayLogs(logs: ScriptLogEvent[]): void {
    const form = new ActionFormData()
      .title("ログ表示");

    logs.forEach(log => {
      form.button(`${this.formatTimestamp(log.timestamp)}: ${this.formatLogEvent(log)}`);
    });

    form.show(this.player);
  }
}
```

## 実装手順

1. 基本構造の実装
   - [ ] ScriptEventTypes.tsの型定義
   - [ ] IScriptEventLogger.tsのインターフェース実装
   - [ ] ScriptEventLogger.tsのベース実装

2. コマンドシステムの実装
   - [ ] scripteventハンドラーの実装
   - [ ] 各コマンドの処理実装
   - [ ] 引数パーサーの実装

3. 検索・フィルタリング機能の実装
   - [ ] 検索ロジックの実装
   - [ ] フィルタリングシステムの実装
   - [ ] 時間範囲検索の実装

4. UIの実装
   - [ ] ログ表示UIの実装
   - [ ] 検索/フィルターフォームの実装
   - [ ] 統計表示UIの実装

5. テストと動作確認
   - [ ] 基本機能の動作確認
   - [ ] 各コマンドのテスト
   - [ ] エラーケースのテスト
   - [ ] パフォーマンステスト

## 注意事項

1. パフォーマンス
   - ログの最大件数制限の実装
   - 不要なイベント発火の防止
   - メモリ使用量の最適化

2. エラーハンドリング
   - コマンド実行時のバリデーション
   - 無効な引数のチェック
   - エラーメッセージの適切な表示

3. 拡張性
   - 新しいログカテゴリの追加容易性
   - フィルター条件の拡張性
   - UIのカスタマイズ性

## 期待される改善点

1. より柔軟なログ管理
   - scripteventによる統一的なイベント処理
   - カテゴリベースの整理
   - 効率的な検索・フィルタリング

2. 改善されたユーザー体験
   - 直感的なUIナビゲーション
   - リアルタイムの情報更新
   - カスタマイズ可能な表示オプション

3. 保守性の向上
   - 明確な型定義
   - モジュール化された構造
   - テスト容易性の向上