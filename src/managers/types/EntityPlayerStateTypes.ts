/**
 * エンティティとプレイヤーの状態変化に関するログ詳細の型定義
 */

/**
 * ActionType.ENTITY_SPAWN の details
 */
export interface EntitySpawnDetails {
  entityId: string; // スポーンしたエンティティの一意なID
  entityType: string; // エンティティの種類 (e.g., "minecraft:zombie")
  location: { x: number; y: number; z: number }; // スポーンした座標
  dimension: string; // スポーンしたディメンションID
}

/**
 * ActionType.ENTITY_DEATH の details
 */
export interface EntityDeathDetails {
  entityId: string; // 死亡したエンティティの一意なID
  entityType: string; // エンティティの種類
  location: { x: number; y: number; z: number }; // 死亡した座標
  dimension: string; // 死亡したディメンションID
  cause?: string; // 死亡原因 (e.g., "player_attack", "fall", "lava", "entity_attack") - 取得可能な場合
  killerEntityId?: string | null; // 倒したエンティティのID (プレイヤーや他のエンティティ) - 取得可能な場合
  killerEntityType?: string | null; // 倒したエンティティのタイプ - 取得可能な場合
}

/**
 * ActionType.ENTITY_DESPAWN の details (デスポーンイベントが存在する場合)
 * 注意: 現在のAPIでは直接的なイベントがないため、実装は見送り
 */
export interface EntityDespawnDetails {
  entityId: string; // デスポーンしたエンティティの一意なID
  entityType: string; // エンティティの種類
  location: { x: number; y: number; z: number }; // デスポーン時の座標
  dimension: string; // デスポーンしたディメンションID
  reason?: string; // デスポーン理由 (e.g., "distance", "chunk_unload") - 取得可能な場合
}

/**
 * ActionType.PLAYER_HEALTH_CHANGE の details
 */
export interface PlayerHealthChangeDetails {
  previousValue: number; // 変化前の体力値
  currentValue: number; // 変化後の体力値
  maxValue: number; // 最大体力値 (HealthComponent から取得)
  cause?: string; // 体力変化の原因 (ダメージの場合 entityHurt イベントから取得) - ポーリング実装では取得困難な場合あり
  sourceEntityId?: string | null; // ダメージ源のエンティティID (取得可能な場合)
  sourceEntityType?: string | null; // ダメージ源のエンティティタイプ (取得可能な場合)
}

/**
 * ActionType.PLAYER_HUNGER_CHANGE の details
 */
export interface PlayerHungerChangeDetails {
  previousValue: number; // 変化前の空腹度 (FoodComponent.foodLevel)
  currentValue: number; // 変化後の空腹度
  maxValue: number; // 最大空腹度 (FoodComponent.maxFoodLevel)
  previousSaturation: number; // 変化前の隠し満腹度 (FoodComponent.saturationLevel)
  currentSaturation: number; // 変化後の隠し満腹度
}

/**
 * ActionType.PLAYER_EXPERIENCE_CHANGE の details
 */
export interface PlayerExperienceChangeDetails {
  previousLevel: number; // 変化前の経験値レベル
  currentLevel: number; // 変化後の経験値レベル
  previousProgress: number; // 変化前の次のレベルまでの進捗 (0.0-1.0)
  currentProgress: number; // 変化後の次のレベルまでの進捗
  totalExperience: number; // 現在の総経験値 (Player.getTotalXp())
}

/**
 * ActionType.PLAYER_EFFECT_ADDED の details
 */
export interface PlayerEffectAddedDetails {
  effectType: string; // 追加された効果のID (e.g., "minecraft:speed")
  amplifier: number; // 効果の強さ (0から始まる)
  duration: number; // 効果の持続時間 (tick単位)
}

/**
 * ActionType.PLAYER_EFFECT_REMOVED の details (除去イベントが存在する場合)
 */
export interface PlayerEffectRemovedDetails {
  effectType: string; // 除去された効果のID
  reason?: string; // 除去理由 (e.g., "expired", "milk") - 取得可能な場合
}

/**
 * PlayerStateChangeLogger でプレイヤーの状態を保持するためのインターフェース
 */
export interface PlayerStateSnapshot {
  health: number;
  foodLevel: number;
  saturationLevel: number;
  level: number;
  xpProgress: number;
  totalExperience: number;
  effects: Map<string, { amplifier: number; duration: number }>; // EffectTypeID -> {amplifier, duration}
}
