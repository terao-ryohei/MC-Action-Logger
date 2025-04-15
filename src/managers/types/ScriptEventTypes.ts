import type { Vector3 } from "@minecraft/server";

/**
 * パラメータ値の型定義
 */
export type ParameterValue = string | number | boolean | Vector3 | null;

/**
 * イベントカテゴリーの定義
 */
export enum EventCategory {
  DOOR = "door",
  REDSTONE = "redstone",
  MECHANISM = "mechanism",
  GAME_RULE = "game_rule",
  PLAYER_ACTION = "player",
  SYSTEM = "system",
  SCRIPTLOG = "scriptlog",
}

/**
 * Scriptlogコマンドのイベントタイプ定義
 */
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

/**
 * Scriptlogのカテゴリ定義
 */
export type ScriptLogCategory =
  | "craft"
  | "storage"
  | "smelt"
  | "enchant"
  | "repair"
  | "brew"
  | "block"
  | "move";

/**
 * Scriptlogのイベントデータ
 */
export interface ScriptLogData {
  keyword?: string;
  category?: ScriptLogCategory;
  timeRange?: {
    start: number;
    end: number;
  };
  playerName?: string;
  result?: {
    success: boolean;
    message?: string;
  };
}

/**
 * Scriptlogイベント
 */
export interface ScriptLogEvent {
  type: ScriptLogEventType;
  timestamp: number;
  player: string;
  category: ScriptLogCategory;
  data: ScriptLogData;
}

/**
 * イベント状態の定義
 */
export interface EventState {
  status: "active" | "inactive" | "processing";
  lastUpdate: number;
  currentOperation?: {
    type: string;
    startTime: number;
    parameters: Map<string, ParameterValue>;
  };
  metadata: {
    activationCount: number;
    totalActiveTime: number;
    lastActivation?: number;
  };
}

/**
 * イベントソースの定義
 */
export interface EventSource {
  type: "player" | "block" | "entity" | "system";
  id: string;
}

/**
 * パラメータ定義
 */
export interface Parameter {
  name: string;
  type: "string" | "number" | "boolean" | "vector";
  required: boolean;
  description: string;
  validation?: (value: ParameterValue) => boolean;
}

/**
 * スクリプトイベントのメッセージテンプレート定義
 */
export interface ScriptEventMessageTemplate {
  template: string;
  variables: string[];
  conditions?: {
    [key: string]: (data: ScriptEventData) => boolean;
  };
  formatters?: {
    [key: string]: (value: ParameterValue) => string;
  };
}

/**
 * イベント定義
 */
export interface EventDefinition {
  id: string;
  category: EventCategory;
  displayName: string;
  parameters: Parameter[];
  defaultState?: EventState;
  messageTemplate: ScriptEventMessageTemplate;
  conditions?: {
    [key: string]: (data: ScriptEventData) => boolean;
  };
}

/**
 * イベント出力の型定義
 */
export interface EventOutput {
  value: ParameterValue;
  metadata?: Record<string, ParameterValue>;
}

/**
 * イベントデータ
 */
export interface ScriptEventData {
  eventId: string;
  timestamp: number;
  parameters: Map<string, ParameterValue>;
  source: EventSource;
  position: Vector3;
  result?: {
    success: boolean;
    reason?: string;
    output?: EventOutput;
  };
  timing: {
    duration?: number;
    sequence?: number;
  };
}

/**
 * イベントログレコード
 */
export interface ScriptEventRecord {
  eventData: ScriptEventData;
  formattedMessage: string;
  category: string;
}

/**
 * パラメータ値を文字列に変換する型
 */
export type ParameterFormatter = (value: ParameterValue) => string;

/**
 * パラメータデータの型
 */
export type ParameterData = Record<string, ParameterValue>;
