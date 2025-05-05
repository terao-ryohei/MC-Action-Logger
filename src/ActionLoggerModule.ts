import { MainManager } from "./managers/MainManager";
import type { PlayerActionLogManger } from "./managers/PlayerActionLogManager";
import type { TimerManager } from "./managers/TimerManager";
import type { UIManager } from "./managers/UIManager";
import { ConfigManager } from "./config/ConfigManager";
import { LogExporter } from "./export/LogExporter";
import type {
  LoggerConfiguration,
  ExportConfiguration,
  PlayerLog,
} from "./types/types";

/**
 * ActionLoggerのメインモジュールクラス
 */
export class ActionLoggerModule {
  private static instance: ActionLoggerModule | null = null;
  private configManager: ConfigManager;
  private logExporter: LogExporter | null = null;
  private mainManager: MainManager;
  private playerActionLogManger: PlayerActionLogManger;
  private timerManager: TimerManager;
  private uiManager: UIManager;
  private eventHandlers = new Set<() => void>();

  private constructor() {
    this.configManager = ConfigManager.getInstance();
    this.mainManager = MainManager.getInstance();
    this.playerActionLogManger = this.mainManager.getPlayerActionLogManger();
    this.timerManager = this.mainManager.getTimerManager();
    this.uiManager = this.mainManager.getUIManager();
  }

  /**
   * モジュールのインスタンスを取得
   */
  public static getInstance(): ActionLoggerModule {
    if (!ActionLoggerModule.instance) {
      ActionLoggerModule.instance = new ActionLoggerModule();
    }
    return ActionLoggerModule.instance;
  }

  /**
   * モジュールの初期化
   */
  public initialize(initialConfig?: Partial<LoggerConfiguration>): void {
    try {
      // 設定の初期化
      if (initialConfig) {
        this.configManager.updateConfig(initialConfig);
      }

      this.initializeEventHandlers();

      const currentConfig = this.configManager.getConfig();

      this.playerActionLogManger.updateSettings({
        defaultLevel: currentConfig.filters.minLogLevel,
        displayLevel: currentConfig.filters.minLogLevel,
        filters: currentConfig.filters.customFilters,
      });

      this.timerManager.updateGameTimeConfig(currentConfig.gameTime);

      console.log("ActionLoggerModuleの初期化が完了しました");
    } catch (error) {
      console.error(
        "ActionLoggerModuleの初期化中にエラーが発生しました:",
        error,
      );
      throw error;
    }
  }

  /**
   * 設定の更新
   */
  public updateConfig(config: Partial<LoggerConfiguration>): void {
    try {
      this.configManager.updateConfig(config);
      const currentConfig = this.configManager.getConfig();

      // 各マネージャーの設定を更新
      this.timerManager.updateGameTimeConfig(currentConfig.gameTime);
      this.playerActionLogManger.updateSettings({
        defaultLevel: currentConfig.filters.minLogLevel,
        displayLevel: currentConfig.filters.minLogLevel,
        filters: currentConfig.filters.customFilters,
      });
    } catch (error) {
      console.error("設定の更新中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * エクスポーター設定の初期化
   */
  public initializeExporter(config: ExportConfiguration): void {
    try {
      this.logExporter = new LogExporter(config);
    } catch (error) {
      console.error("エクスポーターの初期化中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * ログのエクスポート
   */
  public async exportLogs(): Promise<void> {
    if (!this.logExporter) {
      throw new Error("エクスポーターが初期化されていません");
    }

    try {
      const logs = this.playerActionLogManger.getAllLogs();
      await this.logExporter.exportLogs(logs);
    } catch (error) {
      console.error("ログのエクスポート中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * 全ログの取得
   */
  public getLogs(): PlayerLog[] {
    return this.playerActionLogManger.getAllLogs();
  }

  /**
   * 現在の設定を取得
   */
  public getConfig(): LoggerConfiguration {
    return this.configManager.getConfig();
  }

  /**
   * ロガーの起動（外部からの起動向け）
   * @throws Error 起動に失敗した場合
   */
  public start(): void {
    try {
      this.mainManager.startGame();

      console.log("ActionLoggerModuleを起動しました");
    } catch (error) {
      console.error("ActionLoggerModuleの起動中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * ロガーの停止（外部からの起動向け）
   * @throws Error 停止に失敗した場合
   */
  public stop(): void {
    try {
      // イベントハンドラの解除
      this.removeAllEventHandlers();

      this.mainManager.endGame();

      console.log("ActionLoggerModuleを停止しました");
    } catch (error) {
      console.error("ActionLoggerModuleの停止中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * イベントハンドラの登録
   * @param handler イベントハンドラ関数
   * @throws Error ハンドラの登録に失敗した場合
   */
  public registerEventHandler(handler: () => void): void {
    try {
      if (!handler) {
        throw new Error("ハンドラが指定されていません");
      }

      this.eventHandlers.add(handler);
      if (this.isActive()) {
        try {
          handler(); // 既に起動している場合は即座に実行
        } catch (error) {
          throw new Error(
            `ハンドラの実行に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    } catch (error) {
      console.error("イベントハンドラの登録中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * イベントハンドラの解除
   * @param handler イベントハンドラ関数
   * @throws Error ハンドラの解除に失敗した場合
   */
  public removeEventHandler(handler: () => void): void {
    try {
      if (!handler) {
        throw new Error("ハンドラが指定されていません");
      }

      this.eventHandlers.delete(handler);
    } catch (error) {
      console.error("イベントハンドラの解除中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * 全イベントハンドラの解除
   * @throws Error ハンドラの解除に失敗した場合
   */
  private removeAllEventHandlers(): void {
    try {
      this.eventHandlers.clear();
    } catch (error) {
      console.error("全イベントハンドラの解除中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * イベントハンドラの初期化
   * @throws Error ハンドラの初期化に失敗した場合
   */
  private initializeEventHandlers(): void {
    try {
      for (const handler of this.eventHandlers) {
        try {
          handler();
        } catch (error) {
          throw new Error(
            `ハンドラの実行に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    } catch (error) {
      console.error("イベントハンドラの初期化中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * 実行状態の取得
   * @returns ロガーが実行中かどうか
   * @throws Error 状態の取得に失敗した場合
   */
  public isActive(): boolean {
    try {
      return this.mainManager.getGameState().isRunning;
    } catch (error) {
      console.error("実行状態の取得中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * リソースの解放
   * @throws Error リソース解放に失敗した場合
   */
  public dispose(): void {
    try {
      if (this.isActive()) {
        this.stop();
      }

      // 各マネージャーのリソースを解放
      this.mainManager.dispose();
      this.playerActionLogManger.dispose();
      this.timerManager.dispose();
      this.uiManager.dispose();
      ConfigManager.dispose();

      // インスタンスをクリア
      ActionLoggerModule.instance = null;
      this.logExporter = null;
      this.eventHandlers.clear();

      console.log("ActionLoggerModuleのリソースを解放しました");
    } catch (error) {
      console.error("リソース解放中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * インスタンスの破棄
   * @throws Error インスタンスの破棄に失敗した場合
   */
  public static dispose(): void {
    try {
      if (ActionLoggerModule.instance) {
        ActionLoggerModule.instance.dispose();
      }
    } catch (error) {
      console.error("インスタンスの破棄中にエラーが発生しました:", error);
      throw error;
    }
  }
}
