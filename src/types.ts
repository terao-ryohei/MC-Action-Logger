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
  // --- プレイヤーアクション ---
  MOVE = "move",
  JUMP = "jump",
  ATTACK = "attack",
  INTERACT = "interact",

  // --- ブロック操作 ---
  BLOCK_BROKEN = "block_broken",
  BLOCK_PLACED = "block_placed",

  // --- スクリプトイベント ---
  SCRIPT_EVENT = "script_event",

  // --- エンティティライフサイクル ---
  ENTITY_SPAWN = "entity_spawn",
  ENTITY_DEATH = "entity_death",
  ENTITY_DESPAWN = "entity_despawn",

  // --- プレイヤー状態変更 ---
  PLAYER_HEALTH_CHANGE = "player_health_change",
  PLAYER_HUNGER_CHANGE = "player_hunger_change",
  PLAYER_EXPERIENCE_CHANGE = "player_experience_change",
  PLAYER_EFFECT_ADDED = "player_effect_added",
  PLAYER_EFFECT_REMOVED = "player_effect_removed",

  // --- システム操作 ---
  SYSTEM_RESUME = "system_resume",
  SYSTEM_PAUSE = "system_pause",
  SYSTEM_CONFIG_CHANGE = "system_config_change",
  SYSTEM_EXPORT = "system_export",
}

/**
 * ゲーム内時刻を表すインターフェース
 */
export interface GameTime {
  day: number; // ゲーム内の日付
  hour: number; // 時 (0-23)
  minute: number; // 分 (0-59)
}

/**
 * タイムスタンプ情報を表すインターフェース
 */
export interface GameTimeStamp {
  realTime: number; // 実時間（Unix timestamp）
  gameTime: GameTime; // ゲーム内時刻
}

/**
 * プレイヤーの1つのアクションを表すインターフェース
 */
export interface PlayerAction {
  type: ActionType;
  timestamp: GameTimeStamp; // タイムスタンプを GameTimeStamp に変更
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
  actionType?: ActionType; // フィルターの対象アクションタイプ（任意）
}

/**
 * ログ設定を表すインターフェース
 */
export interface LogSettings {
  defaultLevel: LogLevel; // デフォルトのログレベル
  displayLevel: LogLevel; // 表示するログレベルの閾値
  actionTypeSettings: Map<ActionType, LogLevel>; // アクション種別ごとのログレベル設定
  filters: LogFilter[]; // カスタムフィルター
  movementCheckInterval?: number; // 移動チェックの間隔（ticks）
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
      action.timestamp.realTime >= this.startTime &&
      action.timestamp.realTime <= this.endTime
    );
  }
}

/**
 * アクション種別フィルタークラス
 */
export class ActionTypeFilter implements LogFilter {
  constructor(private types: ActionType[]) {
    this.actionType = types[0]; // 最初のアクションタイプをフィルターのタイプとして設定
  }

  actionType?: ActionType;

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
 * ロガーの表示設定インターフェース
 */
export interface LoggerDisplayConfig {
  showTimestamp: boolean;
  showPlayerName: boolean;
  showActionType: boolean;
  showDetails: boolean;
}

/**
 * ロガーのフィルタ設定インターフェース
 */
export interface LoggerFilterConfig {
  minLogLevel: LogLevel;
  includedActionTypes?: ActionType[]; // オプショナルに変更
  excludedActionTypes?: ActionType[]; // オプショナルに変更
  customFilters?: LogFilter[]; // オプショナルに変更
}

/**
 * ゲーム時間設定インターフェース
 */
export interface GameTimeConfig {
  initialTime: number; // ミリ秒
  timeScale: number; // 実時間に対する倍率
  dayLength: number; // 1日の長さ（ミリ秒）
}

/**
 * 開始アイテム設定インターフェース
 */
export interface StartItemConfig {
  itemId: string;
  displayName: string;
  canBeUsedByNonOp: boolean;
}

/**
 * ロガーモジュールの設定インターフェース
 */
export interface LoggerConfiguration {
  displayItems: LoggerDisplayConfig;
  filters: LoggerFilterConfig;
  gameTime: GameTimeConfig;
  startItems: StartItemConfig[];
}

/**
 * エクスポート設定インターフェース
 */
export interface ExportConfiguration {
  format: "json" | "csv" | "txt";
  includeMetadata: boolean;
  timestampFormat: string;
  outputPath: string;
}

/**
 * エクスポートメタデータインターフェース
 */
export interface ExportMetadata {
  exportTime: string;
  format: string;
  recordCount: number;
  version: string;
}

/**
 * エクスポートデータインターフェース
 */
export interface ExportData {
  metadata?: ExportMetadata;
  logs: PlayerLog[];
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
  GAME_DURATION: 200, // 3分（秒）
  TICKS_PER_SECOND: 20, // 1秒あたりのティック数
  MAX_ACTIONS_PER_PAGE: 10, // UIでの1ページあたりのアクション表示数
} as const;
