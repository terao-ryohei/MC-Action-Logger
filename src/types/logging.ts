import { LogLevel, type LogFilter } from "./core";

/**
 * アクションの種類を定義するenum
 */
export enum ActionType {
  MOVE = "move",
  JUMP = "jump",
  ATTACK = "attack",
  INTERACT = "interact",
}

/**
 * プレイヤーのアクションを表す型
 */
export interface PlayerAction {
  type: ActionType;
  timestamp: number;
  details: unknown;
  level: LogLevel;
}

/**
 * プレイヤーのログを表す型
 */
export interface PlayerLog {
  playerId: string;
  actions: PlayerAction[];
}

/**
 * ロガーの設定を表す型
 */
export interface LogSettings {
  /** デフォルトのログレベル */
  defaultLevel: LogLevel;
  /** 表示するログレベルの閾値 */
  displayLevel: LogLevel;
  /** アクションタイプごとのログレベル設定 */
  actionTypeSettings: Map<ActionType, LogLevel>;
  /** 適用するフィルター */
  filters: LogFilter[];
}

// ACTIVITYレベルはLogLevel.VERBOSEと同じ値を使用
export const ACTIVITY_LEVEL = LogLevel.VERBOSE;
