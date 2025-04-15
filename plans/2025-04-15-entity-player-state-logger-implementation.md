# EntityLifecycleLogger と PlayerStateChangeLogger の実装計画

## 1. ファイル構成

### 1.1 必要なファイル
1. `src/types.ts`
   - ActionType enumへの新規タイプの追加
   - 既存のファイルの修正

2. `src/managers/types/EntityPlayerStateTypes.ts`
   - エンティティとプレイヤー状態変化関連のインターフェース定義
   - 設計書で定義された各種interfaceの実装

3. `src/managers/EntityLifecycleLogger.ts`
   - エンティティのスポーン、死亡イベントを記録するロガー
   - LogManagerとの連携実装

4. `src/managers/PlayerStateChangeLogger.ts`
   - プレイヤーの状態変化を記録するロガー
   - 定期的なポーリング処理の実装
   - LogManagerとの連携実装

5. `src/managers/GameManager.ts`
   - 新規ロガーの統合
   - LogManagerインスタンスの注入

## 2. 実装順序

### 2.1 型定義の追加
1. ActionTypeの追加（`src/types.ts`）
   - `ENTITY_SPAWN`
   - `ENTITY_DEATH`
   - `ENTITY_DESPAWN`
   - `PLAYER_HEALTH_CHANGE`
   - `PLAYER_HUNGER_CHANGE`
   - `PLAYER_EXPERIENCE_CHANGE`
   - `PLAYER_EFFECT_ADDED`
   - `PLAYER_EFFECT_REMOVED`

2. インターフェース定義（`src/managers/types/EntityPlayerStateTypes.ts`）
   - EntitySpawnDetails
   - EntityDeathDetails
   - EntityDespawnDetails
   - PlayerHealthChangeDetails
   - PlayerHungerChangeDetails
   - PlayerExperienceChangeDetails
   - PlayerEffectAddedDetails
   - PlayerEffectRemovedDetails

### 2.2 EntityLifecycleLoggerの実装
1. エンティティスポーンの検知と記録
2. エンティティ死亡の検知と記録
3. プレイヤーエンティティの除外処理
4. LogManagerとの連携実装

### 2.3 PlayerStateChangeLoggerの実装
1. プレイヤー状態の監視機能実装
   - 体力値の監視
   - 空腹度の監視
   - 経験値の監視
   - ステータス効果の監視
2. ポーリング処理の実装
3. 前回の状態保持機能の実装
4. LogManagerとの連携実装

### 2.4 GameManagerへの統合
1. 新規ロガーのインスタンス作成
2. LogManagerの注入
3. ゲーム状態との連携

## 3. 動作確認手順

### 3.1 EntityLifecycleLoggerの動作確認
- [ ] エンティティの自然スポーン時のログ記録
- [ ] スポーンエッグ使用時のログ記録
- [ ] プレイヤーによるエンティティ討伐時のログ記録
- [ ] エンティティの落下死時のログ記録
- [ ] エンティティの環境ダメージ死時のログ記録
- [ ] プレイヤーイベントの除外確認
- [ ] ログフォーマットの確認

### 3.2 PlayerStateChangeLoggerの動作確認
- [ ] プレイヤーの体力変化記録
- [ ] プレイヤーの体力回復記録
- [ ] 空腹度減少の記録
- [ ] 食事による空腹度回復の記録
- [ ] 経験値獲得の記録
- [ ] 経験値消費の記録
- [ ] ステータス効果追加の記録
- [ ] ステータス効果除去の記録
- [ ] ゲーム停止時のポーリング停止確認
- [ ] ログフォーマットの確認

### 3.3 統合テスト
- [ ] LogManagerのフィルター設定の動作確認
- [ ] LogManagerのログレベル設定の動作確認
- [ ] 複数プレイヤーでの同時動作確認
- [ ] パフォーマンス影響の確認

## 4. 追加考慮事項

1. パフォーマンス監視
   - ポーリング間隔の適正値確認
   - 多数のエンティティ存在時の挙動確認
   - 多数のプレイヤー接続時の挙動確認

2. エラーハンドリング
   - イベント購読失敗時の対応
   - ポーリング処理失敗時の対応
   - LogManager連携失敗時の対応

3. デバッグ支援
   - 適切なデバッグログの出力
   - 異常値検知時の警告出力
   - パフォーマンス指標の記録