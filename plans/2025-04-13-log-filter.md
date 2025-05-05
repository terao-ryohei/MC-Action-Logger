# ログ表示制御の設計

## 概要
UIManagerでのログ表示制御の仕組みを導入し、一か所のコード変更でログの表示/非表示を制御できるようにする。

## 設計方針

### 1. LogLevelの導入

```typescript
export enum LogLevel {
  DEBUG = 0,    // デバッグ用の詳細なログ
  ACTIVITY = 1, // 通常のゲーム内アクティビティ
  INFO = 2,     // 重要な情報ログ
  WARN = 3,     // 警告
  ERROR = 4     // エラー
}
```

### 2. PlayerActionLogMangerの拡張

#### 2.1 LogSettingsの導入

```typescript
export interface LogSettings {
  defaultLevel: LogLevel;            // デフォルトのログレベル
  displayLevel: LogLevel;            // 表示するログレベルの閾値
  actionTypeSettings: Map<ActionType, LogLevel>; // アクション種別ごとのログレベル設定
  filters: LogFilter[];             // カスタムフィルター
}
```

#### 2.2 PlayerActionの拡張

```typescript
export interface PlayerAction {
  type: ActionType;
  timestamp: number;
  details: unknown;
  level: LogLevel;  // 追加: ログレベル
}
```

#### 2.3 LogFilterインターフェース

```typescript
export interface LogFilter {
  shouldDisplay(action: PlayerAction): boolean;
}

// 複合フィルター
export class CompositeLogFilter implements LogFilter {
  private filters: LogFilter[] = [];
  
  addFilter(filter: LogFilter): void {
    this.filters.push(filter);
  }

  shouldDisplay(action: PlayerAction): boolean {
    return this.filters.every(filter => filter.shouldDisplay(action));
  }
}

// フィルター実装例
export class TimeRangeFilter implements LogFilter {
  constructor(private startTime: number, private endTime: number) {}
  
  shouldDisplay(action: PlayerAction): boolean {
    return action.timestamp >= this.startTime && action.timestamp <= this.endTime;
  }
}

export class ActionTypeFilter implements LogFilter {
  constructor(private types: ActionType[]) {}
  
  shouldDisplay(action: PlayerAction): boolean {
    return this.types.includes(action.type);
  }
}
```

### 3. 実装詳細

#### 3.1 PlayerActionLogMangerの修正

```typescript
export class PlayerActionLogManger {
  private settings: LogSettings;
  private compositeFilter: CompositeLogFilter;

  constructor(mainManager: MainManager) {
    this.compositeFilter = new CompositeLogFilter();
    this.settings = {
      defaultLevel: LogLevel.INFO,
      displayLevel: LogLevel.ACTIVITY,
      actionTypeSettings: new Map([
        [ActionType.MOVE, LogLevel.ACTIVITY],    // 移動は通常アクティビティ
        [ActionType.JUMP, LogLevel.ACTIVITY],    // ジャンプは通常アクティビティ
        [ActionType.ATTACK, LogLevel.INFO],      // 攻撃は重要情報
        [ActionType.INTERACT, LogLevel.INFO],    // インタラクトは重要情報
      ]),
      filters: []
    };
  }

  // フィルターの追加
  public addFilter(filter: LogFilter): void {
    this.compositeFilter.addFilter(filter);
  }

  // ログ設定の更新
  public updateSettings(settings: Partial<LogSettings>): void {
    this.settings = {
      ...this.settings,
      ...settings
    };
  }

  // ログレベルの取得
  private getLogLevel(type: ActionType): LogLevel {
    return this.settings.actionTypeSettings.get(type) ?? this.settings.defaultLevel;
  }

  // アクションのフィルタリングチェック
  private shouldDisplayAction(action: PlayerAction): boolean {
    const levelCheck = action.level >= this.settings.displayLevel;
    const filterCheck = this.settings.filters.length === 0 || 
      this.compositeFilter.shouldDisplay(action);
    return levelCheck && filterCheck;
  }

  // フィルタリング済みのログ取得
  public getFilteredPlayerLog(playerId: string): PlayerLog {
    const log = this.getPlayerLog(playerId);
    return {
      ...log,
      actions: log.actions.filter(action => this.shouldDisplayAction(action))
    };
  }

  // フィルタリング済みの全ログ取得
  public getFilteredAllLogs(): PlayerLog[] {
    return this.getAllLogs().map(log => ({
      ...log,
      actions: log.actions.filter(action => this.shouldDisplayAction(action))
    }));
  }
}
```

#### 3.2 UIManagerの修正

```typescript
export class UIManager {
  private async showLogUI(player: Player): Promise<void> {
    // フィルタリング済みのログを使用
    const logs = this.mainManager.getLogManager().getFilteredAllLogs();
    // ... 以下既存の処理
  }

  private async showPlayerLogUI(player: Player, log: PlayerLog, page: number): Promise<void> {
    // フィルタリング済みのログを使用
    const filteredLog = this.mainManager.getLogManager().getFilteredPlayerLog(log.playerId);
    // ... 以下既存の処理
  }
}
```

### 4. 使用例

```typescript
// ログレベルの変更
playerActionLogManger.updateSettings({
  displayLevel: LogLevel.DEBUG  // すべてのログを表示
});

// 特定の時間帯のログのみを表示
const timeFilter = new TimeRangeFilter(startTime, endTime);
playerActionLogManger.addFilter(timeFilter);

// 特定のアクションタイプのみを表示
const actionFilter = new ActionTypeFilter([ActionType.ATTACK, ActionType.INTERACT]);
playerActionLogManger.addFilter(actionFilter);
```

## 影響範囲

### 修正が必要なファイル
1. `src/types.ts`
   - LogLevelの定義追加
   - PlayerAction interfaceの修正
   - LogFilter interfaceの追加

2. `src/managers/PlayerActionLogManger.ts`
   - LogSettingsの実装
   - フィルタリングメソッドの追加
   - 既存のlogAction()メソッドにログレベル処理追加
   - CompositeLogFilterの実装

3. `src/managers/UIManager.ts`
   - フィルタリング済みログの使用に変更
   - 表示メソッドの微修正

### 影響を受けないファイル
1. `src/managers/MainManager.ts`
   - 変更の必要なし

2. `src/managers/TimerManager.ts`
   - 変更の必要なし

### 既存機能への影響
- デフォルトのログレベル設定により、既存の動作は維持される
- ACTIVITYレベルの導入により、よりきめ細かなログ制御が可能に
- UIの表示レイアウトは変更なし

## 動作確認項目

- [ ] デフォルト設定での既存機能の動作確認
- [ ] ログレベル変更時の表示制御確認
- [ ] アクション種別ごとのログレベル設定確認
- [ ] フィルタリング機能の動作確認
- [ ] カスタムフィルターの動作確認
- [ ] エラー発生時のログ表示確認
- [ ] パフォーマンスへの影響確認

## 追加検討事項

1. コマンドによるログレベル設定の実装
2. ゲーム内UIでのログレベル設定機能
3. ログレベルの永続化対応
4. プレイヤーごとの表示設定
5. フィルター設定のUI実装
6. フィルター設定の永続化対応
7. フィルターの組み合わせパターンのプリセット機能

## 性能に関する考慮事項

1. フィルタリング処理の最適化
   - キャッシュの活用
   - 不要なフィルター実行の回避
   - フィルター結果の一時保存

2. メモリ使用量の最適化
   - 不要なログの定期的なクリーンアップ
   - フィルター結果のキャッシュサイズ制限

3. UIレスポンスの維持
   - 非同期フィルタリング処理の検討
   - 表示更新の最適化