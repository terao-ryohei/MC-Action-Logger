# LogManager イベントハンドラ最適化設計

## 概要

LogManagerのinitializeEventHandlers()メソッドを改善し、フィルタリング状況に応じて必要なハンドラのみを有効化する設計を提案します。また、移動チェックの頻度を設定可能にします。

## 設計詳細

### 1. ログ設定の拡張

```typescript
interface LogSettings {
  // 既存の設定
  defaultLevel: LogLevel;
  displayLevel: LogLevel;
  actionTypeSettings: Map<ActionType, LogLevel>;
  filters: LogFilter[];
  
  // 追加する設定
  movementCheckInterval: number; // ticks単位（デフォルト: 2 = 0.1秒）
}

private readonly DEFAULT_MOVEMENT_CHECK_INTERVAL = 2;
```

### 2. ハンドラ状態の管理

```typescript
interface HandlerState {
  movement: boolean;  // 移動チェック用
  attack: boolean;    // 攻撃イベント用
  interact: boolean;  // インタラクション用
}

private handlerState: HandlerState = {
  movement: false,
  attack: false,
  interact: false,
};

private subscriptions = {
  attack: null as null | { unsubscribe: () => void },
  interact: null as null | { unsubscribe: () => void }
};
```

### 3. フィルター評価ロジック

```typescript
private evaluateRequiredHandlers(): HandlerState {
  const actionTypes = new Set(this.settings.filters
    .map(filter => filter.actionType)
    .filter(Boolean));

  return {
    movement: actionTypes.size === 0 || actionTypes.has(ActionType.MOVE) || actionTypes.has(ActionType.JUMP),
    attack: actionTypes.size === 0 || actionTypes.has(ActionType.ATTACK),
    interact: actionTypes.size === 0 || actionTypes.has(ActionType.INTERACT)
  };
}
```

### 4. ハンドラの動的管理

```typescript
private updateEventHandlers(): void {
  const requiredState = this.evaluateRequiredHandlers();
  
  // 移動チェック
  if (requiredState.movement && !this.handlerState.movement) {
    this.startMovementCheck();
  } else if (!requiredState.movement && this.handlerState.movement) {
    this.stopMovementCheck();
  } else if (requiredState.movement && this.handlerState.movement) {
    // インターバルが変更された場合の再起動
    this.restartMovementCheck();
  }

  // 攻撃イベント
  if (requiredState.attack && !this.handlerState.attack) {
    this.subscriptions.attack = world.afterEvents.entityHurt.subscribe(
      this.handleAttack.bind(this)
    );
  } else if (!requiredState.attack && this.handlerState.attack) {
    this.subscriptions.attack?.unsubscribe();
    this.subscriptions.attack = null;
  }

  // インタラクションイベント
  if (requiredState.interact && !this.handlerState.interact) {
    this.subscriptions.interact = world.afterEvents.playerInteractWithBlock.subscribe(
      this.handleInteract.bind(this)
    );
  } else if (!requiredState.interact && this.handlerState.interact) {
    this.subscriptions.interact?.unsubscribe();
    this.subscriptions.interact = null;
  }

  this.handlerState = requiredState;
}

private startMovementCheck(): void {
  try {
    this.movementCheckRunId = system.runInterval(() => {
      try {
        if (!this.gameManager.getGameState().isRunning) return;

        const players = world.getAllPlayers();
        for (const player of players) {
          this.checkPlayerMovement(player);
        }
      } catch (error) {
        console.error("移動チェック中にエラーが発生しました:", error);
      }
    }, this.settings.movementCheckInterval ?? this.DEFAULT_MOVEMENT_CHECK_INTERVAL);
  } catch (error) {
    console.error("移動チェックの開始に失敗しました:", error);
    throw error;
  }
}

private stopMovementCheck(): void {
  if (this.movementCheckRunId !== undefined) {
    system.clearRun(this.movementCheckRunId);
    this.movementCheckRunId = undefined;
  }
}

private restartMovementCheck(): void {
  this.stopMovementCheck();
  this.startMovementCheck();
}
```

### 5. 設定更新時の処理

```typescript
public updateSettings(settings: Partial<LogSettings>): void {
  const oldSettings = { ...this.settings };
  this.settings = {
    ...this.settings,
    ...settings,
  };
  
  // フィルター設定が変更された場合、ハンドラを再評価
  if ('filters' in settings) {
    this.updateEventHandlers();
  }
  // 移動チェック間隔が変更された場合、移動チェックを再起動
  else if ('movementCheckInterval' in settings && 
           oldSettings.movementCheckInterval !== settings.movementCheckInterval && 
           this.handlerState.movement) {
    this.restartMovementCheck();
  }
}
```

## 期待される効果

1. パフォーマンスの向上
   - 不要なシステムタイマーの削減
   - イベントリスナーの最適化
   - 移動チェック頻度の柔軟な調整

2. リソースの効率的な管理
   - 必要なハンドラのみを有効化
   - 不要になったハンドラの適切な解放
   - システムタイマーの適切な管理

3. 動的なフィルター対応
   - フィルター設定変更時の自動調整
   - システムの柔軟性向上
   - パフォーマンス設定のカスタマイズ

4. 拡張性の確保
   - 新しいアクションタイプの追加が容易
   - ハンドラ管理の一元化
   - 設定項目の拡張性

## 動作確認チェックリスト

- [ ] フィルター未設定時に全てのハンドラが有効化
- [ ] 移動/ジャンプのフィルターのみ設定時にMovementCheckが有効化
- [ ] 攻撃フィルターのみ設定時に攻撃イベントハンドラのみ有効化
- [ ] インタラクトフィルターのみ設定時にインタラクトイベントハンドラのみ有効化
- [ ] フィルター設定変更時のハンドラ適切な追加/削除
- [ ] 移動チェック間隔の変更時に適切に再起動
- [ ] dispose()時の全ハンドラの適切な解放
- [ ] カスタム移動チェック間隔での動作確認

## 実装手順

1. LogSettings インターフェースの拡張
2. HandlerState インターフェースと初期状態の実装
3. フィルター評価ロジックの実装
4. ハンドラ管理メソッドの実装
5. 移動チェック関連メソッドの実装
6. 設定更新処理の修正
7. 動作確認の実施

## 注意事項

- フィルター設定変更時は必ずハンドラの再評価を行う
- 移動チェック間隔の変更時は適切に再起動を行う
- ハンドラの解放は確実に行う
- エラーハンドリングを適切に実装する
- パフォーマンスへの影響を考慮した適切な間隔設定を推奨する

## パフォーマンスへの影響

1. 移動チェック間隔の設定による影響
   - 短い間隔: より精密なログ記録が可能だが、システム負荷が増加
   - 長い間隔: システム負荷は減少するが、ログの精度が低下
   - 推奨: 用途に応じて2〜20 ticks (0.1秒〜1秒) の範囲で調整

2. フィルターの組み合わせによる影響
   - 全フィルター無効: 最小限のシステム負荷
   - 特定のフィルターのみ有効: 必要な監視のみを実行
   - 全フィルター有効: 完全な機能を維持しつつ、設定可能な間隔で最適化