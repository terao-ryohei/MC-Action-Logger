import type {
  ScriptEventData,
  ScriptEventRecord,
  EventDefinition,
  EventState,
  EventCategory,
} from "../types/ScriptEventTypes";

/**
 * ScriptEventLoggerのインターフェース
 */
export interface IScriptEventLogger {
  /**
   * スクリプトイベントを記録
   * @param event イベントデータ
   */
  logScriptEvent(event: ScriptEventData): void;

  /**
   * イベント定義を登録
   * @param definition イベント定義
   */
  registerEventDefinition(definition: EventDefinition): void;

  /**
   * イベント定義を取得
   * @param eventId イベントID
   */
  getEventDefinition(eventId: string): EventDefinition | undefined;

  /**
   * カテゴリー別のイベント取得
   * @param category イベントカテゴリー
   */
  getEventsByCategory(category: EventCategory): ScriptEventRecord[];

  /**
   * 時間範囲でのイベント取得
   * @param startTime 開始時間
   * @param endTime 終了時間
   */
  getEventsByTimeRange(startTime: number, endTime: number): ScriptEventRecord[];

  /**
   * イベントの状態取得
   * @param eventId イベントID
   */
  getEventState(eventId: string): EventState | undefined;

  /**
   * イベントの状態更新
   * @param eventId イベントID
   * @param state 更新する状態
   */
  updateEventState(eventId: string, state: Partial<EventState>): void;

  /**
   * 特定の時間以上更新のないイベント状態をクリーンアップ
   * @param maxAge 最大経過時間（ミリ秒）
   */
  cleanupStaleStates(maxAge: number): void;

  /**
   * scriptlogコマンドを実行
   * @param command コマンド名
   * @param args コマンド引数
   */
  executeScriptLogCommand(command: string, args: string[]): void;

  /**
   * ログを検索
   * @param keyword 検索キーワード
   */
  searchLogs(keyword: string): ScriptEventRecord[];

  /**
   * ログをカテゴリでフィルタリング
   * @param category フィルタリングするカテゴリ
   */
  filterLogsByCategory(category: string): ScriptEventRecord[];

  /**
   * プレイヤーでログをフィルタリング
   * @param playerName プレイヤー名
   */
  filterLogsByPlayer(playerName: string): ScriptEventRecord[];

  /**
   * ログの記録を一時停止
   */
  pause(): void;

  /**
   * ログの記録を再開
   */
  resume(): void;

  /**
   * 統計情報の取得
   */
  getStats(): Record<string, number>;

  /**
   * 全てのイベント記録をリセット
   */
  reset(): void;

  /**
   * リソースの解放
   */
  dispose(): void;
}

/**
 * スクリプトイベントロガーのオプション
 */
export interface ScriptEventLoggerOptions {
  /**
   * 履歴の最大サイズ
   */
  maxHistorySize?: number;

  /**
   * イベント状態の最大保持時間（ミリ秒）
   */
  maxStateAge?: number;

  /**
   * デフォルトのメッセージフォーマッタ
   */
  defaultFormatters?: {
    [key: string]: (value: unknown) => string;
  };
}
