import { ActionType } from "../types";
import type { LogManager } from "./LogManager";
import type { GameManager } from "./GameManager";
import type {
  IScriptEventLogger,
  ScriptEventLoggerOptions,
} from "./interfaces/IScriptEventLogger";
import type {
  ScriptEventData,
  ScriptEventRecord,
  EventDefinition,
  EventState,
  EventCategory,
  ParameterValue,
} from "./types/ScriptEventTypes";

/**
 * スクリプトイベントを管理するクラス
 */
export class ScriptEventLogger implements IScriptEventLogger {
  private readonly logManager: LogManager;
  private readonly gameManager: GameManager;
  private readonly options: Required<ScriptEventLoggerOptions>;
  private readonly eventDefinitions = new Map<string, EventDefinition>();
  private readonly eventStates = new Map<string, EventState>();
  private readonly eventHistory: ScriptEventRecord[] = [];
  private isEnabled = false;
  private isPaused = false;

  constructor(
    logManager: LogManager,
    gameManager: GameManager,
    options?: ScriptEventLoggerOptions,
  ) {
    this.logManager = logManager;
    this.gameManager = gameManager;
    this.options = {
      maxHistorySize: options?.maxHistorySize ?? 1000,
      maxStateAge: options?.maxStateAge ?? 3600000, // 1時間
      defaultFormatters: options?.defaultFormatters ?? {},
    };
    this.isEnabled = this.gameManager.getGameState().isRunning;
  }

  /**
   * イベントを記録
   */
  public logScriptEvent(event: ScriptEventData): void {
    try {
      if (!this.isEnabled) {
        console.warn(
          "ゲームが実行中でないため、イベントは記録されません:",
          event.eventId,
        );
        return;
      }

      const definition = this.eventDefinitions.get(event.eventId);
      if (!definition) {
        console.warn("未定義のイベント:", event.eventId);
        return;
      }

      // パラメータのバリデーション
      if (!this.validateEventParameters(event, definition)) {
        return;
      }

      // イベント状態の更新
      this.updateEventState(event.eventId, {
        status: "active",
        lastUpdate: event.timestamp,
        currentOperation: {
          type: event.eventId,
          startTime: event.timestamp,
          parameters: event.parameters,
        },
      });

      // メッセージの生成
      const formattedMessage = this.generateEventMessage(event, definition);

      // イベントレコードの作成
      const record: ScriptEventRecord = {
        eventData: event,
        formattedMessage,
        category: definition.category,
      };

      // 履歴の保存（サイズ制限を考慮）
      if (this.eventHistory.length >= this.options.maxHistorySize) {
        this.eventHistory.shift();
      }
      this.eventHistory.push(record);

      // LogManagerにイベントを記録
      this.logManager.logAction(event.source.id, ActionType.INTERACT, {
        eventId: event.eventId,
        category: definition.category,
        parameters: Object.fromEntries(event.parameters),
        position: event.position,
        result: event.result,
        details: formattedMessage,
      });
    } catch (error) {
      console.error("イベント記録エラー:", error);
      throw error;
    }
  }

  /**
   * イベント定義を登録
   */
  public registerEventDefinition(definition: EventDefinition): void {
    try {
      if (this.eventDefinitions.has(definition.id)) {
        throw new Error(`イベント ${definition.id} は既に定義されています`);
      }

      if (definition.defaultState) {
        this.eventStates.set(definition.id, {
          ...definition.defaultState,
          lastUpdate: Date.now(),
        });
      }

      this.eventDefinitions.set(definition.id, definition);
    } catch (error) {
      console.error("イベント定義登録エラー:", error);
      throw error;
    }
  }

  /**
   * イベント定義を取得
   */
  public getEventDefinition(eventId: string): EventDefinition | undefined {
    return this.eventDefinitions.get(eventId);
  }

  /**
   * カテゴリー別のイベント取得
   */
  public getEventsByCategory(category: EventCategory): ScriptEventRecord[] {
    try {
      return this.eventHistory.filter((record) => record.category === category);
    } catch (error) {
      console.error("カテゴリー別イベント取得エラー:", error);
      return [];
    }
  }

  /**
   * 時間範囲でのイベント取得
   */
  public getEventsByTimeRange(
    startTime: number,
    endTime: number,
  ): ScriptEventRecord[] {
    try {
      return this.eventHistory.filter(
        (record) =>
          record.eventData.timestamp >= startTime &&
          record.eventData.timestamp <= endTime,
      );
    } catch (error) {
      console.error("時間範囲別イベント取得エラー:", error);
      return [];
    }
  }

  /**
   * イベントの状態取得
   */
  public getEventState(eventId: string): EventState | undefined {
    return this.eventStates.get(eventId);
  }

  /**
   * イベントの状態更新
   */
  public updateEventState(eventId: string, state: Partial<EventState>): void {
    try {
      const currentState = this.eventStates.get(eventId);
      if (!currentState) {
        const definition = this.eventDefinitions.get(eventId);
        if (!definition?.defaultState) {
          throw new Error(`イベント ${eventId} の状態が見つかりません`);
        }
        this.eventStates.set(eventId, {
          ...definition.defaultState,
          ...state,
          lastUpdate: Date.now(),
        });
        return;
      }

      this.eventStates.set(eventId, {
        ...currentState,
        ...state,
        lastUpdate: Date.now(),
      });
    } catch (error) {
      console.error("イベント状態更新エラー:", error);
      throw error;
    }
  }

  /**
   * 古いイベント状態のクリーンアップ
   */
  public cleanupStaleStates(maxAge: number): void {
    const now = Date.now();
    for (const [eventId, state] of this.eventStates.entries()) {
      if (now - state.lastUpdate > maxAge) {
        this.eventStates.delete(eventId);
      }
    }
  }

  /**
   * 全てのイベント記録をリセット
   */
  public reset(): void {
    this.eventHistory.length = 0;
    this.eventStates.clear();
    this.isEnabled = this.gameManager.getGameState().isRunning;
  }

  /**
   * リソースの解放
   */
  public dispose(): void {
    this.reset();
    this.eventDefinitions.clear();
  }

  /**
   * scriptlogコマンドを実行
   */
  public executeScriptLogCommand(command: string, args: string[]): void {
    try {
      if (this.isPaused && !["resume", "clear"].includes(command)) {
        console.warn("ログ記録が一時停止中です");
        return;
      }

      switch (command) {
        case "show": {
          // 最新のログを取得（デフォルト10件）
          const limit = args[0] ? Number.parseInt(args[0], 10) : 10;
          const events = this.getLatestEvents(limit);
          this.logManager.logAction("system", ActionType.INTERACT, {
            eventId: "scriptlog_show",
            details: `最新の${limit}件のログを表示`,
            result: { success: true, output: { value: events.length } },
          });
          break;
        }
        case "history": {
          const events = this.getAllEvents();
          this.logManager.logAction("system", ActionType.INTERACT, {
            eventId: "scriptlog_history",
            details: "全ログ履歴を表示",
            result: { success: true, output: { value: events.length } },
          });
          break;
        }
        case "stats": {
          const stats = this.getStats();
          this.logManager.logAction("system", ActionType.INTERACT, {
            eventId: "scriptlog_stats",
            details: "統計情報を表示",
            result: { success: true, output: { value: stats } },
          });
          break;
        }
        case "search": {
          const keyword = args[0] || "";
          const events = this.searchLogs(keyword);
          this.logManager.logAction("system", ActionType.INTERACT, {
            eventId: "scriptlog_search",
            details: `キーワード "${keyword}" で検索`,
            result: { success: true, output: { value: events.length } },
          });
          break;
        }
        case "filter": {
          const category = args[0] || "";
          const events = this.filterLogsByCategory(category);
          this.logManager.logAction("system", ActionType.INTERACT, {
            eventId: "scriptlog_filter",
            details: `カテゴリー "${category}" でフィルター`,
            result: { success: true, output: { value: events.length } },
          });
          break;
        }
        case "time": {
          const startTime = args[0] ? Number.parseInt(args[0], 10) : 0;
          const endTime = args[1] ? Number.parseInt(args[1], 10) : Date.now();
          const events = this.getEventsByTimeRange(startTime, endTime);
          this.logManager.logAction("system", ActionType.INTERACT, {
            eventId: "scriptlog_time",
            details: `期間 ${startTime} から ${endTime} までのログを表示`,
            result: { success: true, output: { value: events.length } },
          });
          break;
        }
        case "player": {
          const playerName = args[0] || "";
          const events = this.filterLogsByPlayer(playerName);
          this.logManager.logAction("system", ActionType.INTERACT, {
            eventId: "scriptlog_player",
            details: `プレイヤー "${playerName}" のログを表示`,
            result: { success: true, output: { value: events.length } },
          });
          break;
        }
        case "pause": {
          this.pause();
          this.logManager.logAction("system", ActionType.INTERACT, {
            eventId: "scriptlog_pause",
            details: "ログ記録を一時停止",
            result: { success: true },
          });
          break;
        }
        case "resume": {
          this.resume();
          this.logManager.logAction("system", ActionType.INTERACT, {
            eventId: "scriptlog_resume",
            details: "ログ記録を再開",
            result: { success: true },
          });
          break;
        }
        case "clear": {
          this.reset();
          this.logManager.logAction("system", ActionType.INTERACT, {
            eventId: "scriptlog_clear",
            details: "ログをクリア",
            result: { success: true },
          });
          break;
        }
        default:
          console.warn(`不明なコマンド: ${command}`);
          break;
      }
    } catch (error) {
      console.error("コマンド実行エラー:", error);
      throw error;
    }
  }

  /**
   * 最新のイベントを取得
   */
  private getLatestEvents(limit: number): ScriptEventRecord[] {
    return this.eventHistory.slice(-limit);
  }

  /**
   * 全てのイベントを取得
   */
  private getAllEvents(): ScriptEventRecord[] {
    return [...this.eventHistory];
  }

  /**
   * ログを検索
   */
  public searchLogs(keyword: string): ScriptEventRecord[] {
    if (!keyword) return [];
    return this.eventHistory.filter(
      (record) =>
        record.formattedMessage.toLowerCase().includes(keyword.toLowerCase()) ||
        record.eventData.eventId.toLowerCase().includes(keyword.toLowerCase()),
    );
  }

  /**
   * ログをカテゴリでフィルタリング
   */
  public filterLogsByCategory(category: string): ScriptEventRecord[] {
    if (!category) return [];
    return this.eventHistory.filter(
      (record) => record.category.toLowerCase() === category.toLowerCase(),
    );
  }

  /**
   * プレイヤーでログをフィルタリング
   */
  public filterLogsByPlayer(playerName: string): ScriptEventRecord[] {
    if (!playerName) return [];
    return this.eventHistory.filter(
      (record) =>
        record.eventData.source.id.toLowerCase() === playerName.toLowerCase(),
    );
  }

  /**
   * ログの記録を一時停止
   */
  public pause(): void {
    this.isPaused = true;
    console.log("ログ記録を一時停止しました");
  }

  /**
   * ログの記録を再開
   */
  public resume(): void {
    this.isPaused = false;
    console.log("ログ記録を再開しました");
  }

  /**
   * 統計情報の取得
   */
  public getStats(): Record<string, number> {
    const stats: Record<string, number> = {
      totalEvents: this.eventHistory.length,
      activeEvents: 0,
      categoryCounts: 0,
      playerCounts: 0,
    };

    // アクティブなイベントをカウント
    for (const state of this.eventStates.values()) {
      if (state.status === "active") {
        stats.activeEvents++;
      }
    }

    // カテゴリごとのイベント数をカウント
    const categories = new Set(
      this.eventHistory.map((record) => record.category),
    );
    stats.categoryCounts = categories.size;

    // プレイヤーごとのイベント数をカウント
    const players = new Set(
      this.eventHistory.map((record) => record.eventData.source.id),
    );
    stats.playerCounts = players.size;

    return stats;
  }

  /**
   * パラメータのバリデーション
   */
  private validateEventParameters(
    event: ScriptEventData,
    definition: EventDefinition,
  ): boolean {
    try {
      for (const param of definition.parameters) {
        if (param.required && !event.parameters.has(param.name)) {
          console.error(`必須パラメータ ${param.name} が不足しています`);
          return false;
        }

        const value = event.parameters.get(param.name);
        if (value !== undefined) {
          if (!this.validateParameterType(value, param.type)) {
            console.error(
              `パラメータ ${param.name} の型が不正です: expected ${param.type}, got ${typeof value}`,
            );
            return false;
          }

          if (param.validation && !param.validation(value)) {
            console.error(
              `パラメータ ${param.name} のバリデーションに失敗しました`,
            );
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      console.error("パラメータバリデーションエラー:", error);
      return false;
    }
  }

  /**
   * パラメータの型チェック
   */
  private validateParameterType(value: ParameterValue, type: string): boolean {
    if (value === null) return true;

    switch (type) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number";
      case "boolean":
        return typeof value === "boolean";
      case "vector":
        return (
          typeof value === "object" &&
          "x" in value &&
          "y" in value &&
          "z" in value
        );
      default:
        return false;
    }
  }

  /**
   * イベントメッセージの生成
   */
  private generateEventMessage(
    event: ScriptEventData,
    definition: EventDefinition,
  ): string {
    try {
      let template = definition.messageTemplate.template;

      if (definition.messageTemplate.conditions) {
        for (const [condition, check] of Object.entries(
          definition.messageTemplate.conditions,
        )) {
          if (check(event)) {
            template = condition;
            break;
          }
        }
      }

      return template.replace(/\${(\w+)}/g, (_, key) => {
        const value = event.parameters.get(key);
        if (value === undefined) return "";

        const formatter =
          definition.messageTemplate.formatters?.[key] ??
          this.options.defaultFormatters[key];
        return formatter ? formatter(value) : String(value);
      });
    } catch (error) {
      console.error("メッセージ生成エラー:", error);
      return `${definition.displayName} イベントが発生`;
    }
  }
}
