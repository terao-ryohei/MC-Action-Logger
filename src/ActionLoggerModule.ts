import { GameManager } from "./managers/GameManager";
import type { LogManager } from "./managers/LogManager";
import type { TimerManager } from "./managers/TimerManager";
import type { UIManager } from "./managers/UIManager";
import { ConfigManager } from "./config/ConfigManager";
import { LogExporter } from "./export/LogExporter";
import type {
  LoggerConfiguration,
  ExportConfiguration,
  PlayerLog,
} from "./types";

/**
 * ActionLoggerのメインモジュールクラス
 */
export class ActionLoggerModule {
  private static instance: ActionLoggerModule | null = null;
  private configManager: ConfigManager;
  private logExporter: LogExporter | null = null;
  private gameManager: GameManager;
  private logManager: LogManager;
  private timerManager: TimerManager;
  private uiManager: UIManager;
  private isInitialized = false;

  private constructor() {
    this.configManager = ConfigManager.getInstance();
    this.gameManager = GameManager.getInstance();
    this.logManager = this.gameManager.getLogManager();
    this.timerManager = this.gameManager.getTimerManager();
    this.uiManager = this.gameManager.getUIManager();
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
  public initialize(config?: Partial<LoggerConfiguration>): void {
    if (this.isInitialized) {
      console.warn("ActionLoggerModuleは既に初期化されています");
      return;
    }

    try {
      // 設定の初期化
      if (config) {
        this.configManager.updateConfig(config);
      }

      // 各マネージャーの初期化
      const currentConfig = this.configManager.getConfig();

      // ゲーム時間の設定を反映
      this.timerManager.updateGameTimeConfig(currentConfig.gameTime);

      // フィルター設定を反映
      this.logManager.updateSettings({
        defaultLevel: currentConfig.filters.minLogLevel,
        displayLevel: currentConfig.filters.minLogLevel,
        filters: currentConfig.filters.customFilters,
      });

      this.isInitialized = true;
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
      this.logManager.updateSettings({
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
      const logs = this.logManager.getAllLogs();
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
    return this.logManager.getAllLogs();
  }

  /**
   * 現在の設定を取得
   */
  public getConfig(): LoggerConfiguration {
    return this.configManager.getConfig();
  }

  /**
   * ゲームの開始
   */
  public startGame(): void {
    if (!this.isInitialized) {
      throw new Error("モジュールが初期化されていません");
    }

    // ゲーム開始時の処理
    this.timerManager.start();
  }

  /**
   * ゲームの停止
   */
  public stopGame(): void {
    this.timerManager.stop();
  }

  /**
   * リソースの解放
   */
  public dispose(): void {
    this.gameManager.dispose();
    this.logManager.dispose();
    this.timerManager.dispose();
    this.uiManager.dispose();
    ConfigManager.dispose();
    ActionLoggerModule.instance = null;
  }

  /**
   * インスタンスの破棄
   */
  public static dispose(): void {
    if (ActionLoggerModule.instance) {
      ActionLoggerModule.instance.dispose();
    }
  }
}
