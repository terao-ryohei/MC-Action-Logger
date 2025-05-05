# ワールド内時間表示機能の設計

## 1. 概要

ログの時間表示を「〇分〇秒前」から「n日目 HH:MM 午前/午後」形式のワールド内時刻表示に変更する機能を設計する。

## 2. 変更点

### 2.1 TimerManager クラスの拡張

```typescript
export class TimerManager {
  // 新規追加：ゲーム開始時のタイムスタンプ
  private gameStartTime: number = 0;
  
  // 新規追加：ゲーム内時間の取得
  public getGameTime(): { day: number; hour: number; minute: number; isAM: boolean } {
    const currentGameSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
    const totalMinutes = Math.floor(currentGameSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    
    return {
      day: Math.floor(totalHours / 24) + 1, // 1日目から開始
      hour: totalHours % 24,
      minute: totalMinutes % 60,
      isAM: (totalHours % 24) < 12
    };
  }
  
  // start()メソッドの修正
  public start(): void {
    this.gameStartTime = Date.now();
    // ... 既存のコード ...
  }
}
```

### 2.2 UIManager クラスの変更

```typescript
export class UIManager {
  // formatTimeAgo()の置き換え
  private formatGameTime(timestamp: number): string {
    // ゲーム内の相対時間を計算
    const gameTime = this.mainManager.getTimerManager().getGameTime();
    
    // 12時間制の時刻に変換
    const hour12 = gameTime.hour % 12 || 12; // 0時を12時として表示
    
    return `${gameTime.day}日目 ${hour12.toString().padStart(2, '0')}:${
      gameTime.minute.toString().padStart(2, '0')} ${gameTime.isAM ? '午前' : '午後'}`;
  }
  
  // formatPlayerLog()の修正
  private formatPlayerLog(log: PlayerLog, startIndex: number, endIndex: number): string {
    // ... 既存のコード ...
    for (const action of actions) {
      try {
        const timeText = this.formatGameTime(action.timestamp);
        const actionText = this.formatAction(action);
        lines.push(`§7[${timeText}]§r: ${actionText}`);
      } catch (error) {
        console.error("ログエントリの整形中にエラーが発生しました:", error);
      }
    }
    // ... 既存のコード ...
  }
}
```

## 3. 動作確認項目

- [ ] ゲーム開始時にタイムスタンプが正しく記録されること
- [ ] 日数が1日目から正しくカウントされること
- [ ] 12時間制の時刻が正しく表示されること（12:00 AM → 11:59 PM）
- [ ] 午前/午後の表示が正しく切り替わること
- [ ] 時刻表示が「n日目 HH:MM 午前/午後」形式で表示されること
- [ ] ログの各アクションに時刻が正しく表示されること
- [ ] 日付が変わる際に正しく切り替わること
- [ ] ゲームの一時停止/再開時に時間表示が適切に動作すること

## 4. 制限事項・注意点

1. タイムスタンプの保存
   - ゲーム開始時のタイムスタンプはメモリ上にのみ保存
   - ゲーム再起動時は新しい時間から開始

2. 時間表示の整合性
   - 全てのプレイヤーで同じ時間が表示される
   - サーバー時間を基準とする
   - 日付は1日目から開始

3. パフォーマンス
   - 時間計算は表示時のみ行う
   - キャッシュは使用しない（毎回計算）

4. 表示形式
   - 12時間制（午前/午後）を採用
   - 日付は「n日目」形式で表示
   - 時刻は「HH:MM」形式で表示（00-12時）

## 5. 将来の拡張性

1. 保存機能（優先度：高）
   - ゲーム開始時刻の永続化
   - セッション間での時間の継続
   - ワールドデータとの連携

2. 時間速度調整（優先度：中）
   - ゲーム内時間の進行速度を調整可能に
   - 昼夜サイクルとの同期オプション

3. イベントシステム連携（優先度：低）
   - 特定の時間でのイベントトリガー
   - 定期的なイベントのスケジューリング

## 6. エラー処理

1. タイムスタンプエラー
   - 不正な時間値の場合はデフォルト値（1日目 00:00 午前）を使用
   - エラーログを出力し、プレイヤーに通知

2. 日付切り替えエラー
   - 日付切り替え時の整合性チェック
   - エラー発生時は強制的に日付を修正

3. 表示エラー
   - フォーマットエラー時は代替表示を使用
   - デバッグ情報の記録