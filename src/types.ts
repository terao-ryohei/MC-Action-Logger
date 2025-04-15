/**
 * ゲームの状態を管理するインターフェース
 */
export interface GameState {
  isRunning: boolean;
  startTime: number;
  remainingTime: number;
}

/**
 * ログレベルを表すenum
 */
export enum LogLevel {
  DEBUG = 0, // デバッグ用の詳細なログ
  ACTIVITY = 1, // 通常のゲーム内アクティビティ
  INFO = 2, // 重要な情報ログ
  WARN = 3, // 警告
  ERROR = 4, // エラー
}

/**
 * プレイヤーのアクション種別
 */
export enum ActionType {
  MOVE = "move",
  JUMP = "jump",
  ATTACK = "attack",
  INTERACT = "interact",
  BLOCK_BROKEN = "block_broken", // BlockInteractionLogger で使用想定
  BLOCK_PLACED = "block_placed", // BlockInteractionLogger で使用想定
  SCRIPT_EVENT = "script_event", // ScriptEventLogger で使用

  // --- Entity Lifecycle ---
  ENTITY_SPAWN = "entity_spawn",
  ENTITY_DEATH = "entity_death",
  ENTITY_DESPAWN = "entity_despawn", // デスポーンを検知できる場合

  // --- Player State Changes ---
  PLAYER_HEALTH_CHANGE = "player_health_change",
  PLAYER_HUNGER_CHANGE = "player_hunger_change",
  PLAYER_EXPERIENCE_CHANGE = "player_experience_change",
  PLAYER_EFFECT_ADDED = "player_effect_added",
  PLAYER_EFFECT_REMOVED = "player_effect_removed", // 効果除去を検知できる場合
}

/**
 * プレイヤーの1つのアクションを表すインターフェース
 */
export interface PlayerAction {
  type: ActionType;
  timestamp: number;
  details: unknown;
  level: LogLevel; // ログレベル
}

/**
 * プレイヤーのログを表すインターフェース
 */
export interface PlayerLog {
  playerId: string;
  actions: PlayerAction[];
}

/**
 * ログのフィルタリングを行うインターフェース
 */
export interface LogFilter {
  shouldDisplay(action: PlayerAction): boolean;
}

/**
 * ログ設定を表すインターフェース
 */
export interface LogSettings {
  defaultLevel: LogLevel; // デフォルトのログレベル
  displayLevel: LogLevel; // 表示するログレベルの閾値
  actionTypeSettings: Map<ActionType, LogLevel>; // アクション種別ごとのログレベル設定
  filters: LogFilter[]; // カスタムフィルター
}

/**
 * 複合フィルタークラス
 */
export class CompositeLogFilter implements LogFilter {
  private filters: LogFilter[] = [];

  addFilter(filter: LogFilter): void {
    this.filters.push(filter);
  }

  shouldDisplay(action: PlayerAction): boolean {
    return this.filters.every((filter) => filter.shouldDisplay(action));
  }
}

/**
 * 時間範囲フィルタークラス
 */
export class TimeRangeFilter implements LogFilter {
  constructor(
    private startTime: number,
    private endTime: number,
  ) {}

  shouldDisplay(action: PlayerAction): boolean {
    return (
      action.timestamp >= this.startTime && action.timestamp <= this.endTime
    );
  }
}

/**
 * アクション種別フィルタークラス
 */
export class ActionTypeFilter implements LogFilter {
  constructor(private types: ActionType[]) {}

  shouldDisplay(action: PlayerAction): boolean {
    return this.types.includes(action.type);
  }
}

/**
 * UI状態を管理するインターフェース
 */
export interface UIState {
  isOpen: boolean;
  currentPlayerId: string;
  pageIndex: number;
}

/**
 * 時計アイテムのID
 */
export const CLOCK_ITEM_ID = "minecraft:clock";

/**
 * 紙アイテムのID
 */
export const PAPER_ITEM_ID = "minecraft:paper";

/**
 * ゲームの定数
 */
export const GAME_CONSTANTS = {
  GAME_DURATION: 30, // 3分（秒）
  TICKS_PER_SECOND: 20, // 1秒あたりのティック数
  MAX_ACTIONS_PER_PAGE: 10, // UIでの1ページあたりのアクション表示数
} as const;
