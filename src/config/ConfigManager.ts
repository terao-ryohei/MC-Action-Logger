import {
  type LoggerConfiguration,
  type LoggerDisplayConfig,
  type LoggerFilterConfig,
  type GameTimeConfig,
  type StartItemConfig,
  type EventHandlingConfig,
  LogLevel,
  CLOCK_ITEM_ID,
} from "../types/types";

/**
 * デフォルトの表示設定
 */
const DEFAULT_DISPLAY_CONFIG: LoggerDisplayConfig = {
  showTimestamp: true,
  showPlayerName: true,
  showActionType: true,
  showDetails: true,
};

/**
 * デフォルトのイベントハンドリング設定
 */
const DEFAULT_EVENT_HANDLING_CONFIG: EventHandlingConfig = {
  enabled: true,
  customHandlers: false,
};

/**
 * デフォルトのフィルタ設定
 */
const DEFAULT_FILTER_CONFIG: LoggerFilterConfig = {
  minLogLevel: LogLevel.INFO,
  includedActionTypes: [],
  excludedActionTypes: [],
  customFilters: [],
};

/**
 * デフォルトのログ回収時間設定
 */
const DEFAULT_GAME_TIME_CONFIG: GameTimeConfig = {
  initialTime: 0,
  timeScale: 1,
  dayLength: 24 * 60 * 60 * 1000, // 24時間（ミリ秒）
};

/**
 * デフォルトの開始アイテム設定
 */
const DEFAULT_START_ITEMS: StartItemConfig[] = [
  {
    itemId: CLOCK_ITEM_ID,
    displayName: "ログ記録開始アイテム",
    canBeUsedByNonOp: false,
  },
];

/**
 * ロガーの設定を管理するクラス
 */
export class ConfigManager {
  private static instance: ConfigManager | null = null;
  private config: LoggerConfiguration;

  private constructor() {
    // デフォルト設定の初期化
    this.config = {
      displayItems: { ...DEFAULT_DISPLAY_CONFIG },
      filters: { ...DEFAULT_FILTER_CONFIG },
      gameTime: { ...DEFAULT_GAME_TIME_CONFIG },
      startItems: [...DEFAULT_START_ITEMS],
      eventHandling: { ...DEFAULT_EVENT_HANDLING_CONFIG },
    };
  }

  /**
   * ConfigManagerのインスタンスを取得
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 現在の設定を取得
   */
  public getConfig(): LoggerConfiguration {
    return {
      displayItems: { ...this.config.displayItems },
      filters: { ...this.config.filters },
      gameTime: { ...this.config.gameTime },
      startItems: [...this.config.startItems],
      eventHandling: { ...this.config.eventHandling },
    };
  }

  /**
   * イベントハンドリング設定を更新
   */
  public updateEventHandlingConfig(config: Partial<EventHandlingConfig>): void {
    this.config.eventHandling = {
      ...this.config.eventHandling,
      ...config,
    };
  }

  /**
   * 表示設定を更新
   */
  public updateDisplayConfig(config: Partial<LoggerDisplayConfig>): void {
    this.config.displayItems = {
      ...this.config.displayItems,
      ...config,
    };
  }

  /**
   * フィルタ設定を更新
   */
  public updateFilterConfig(config: Partial<LoggerFilterConfig>): void {
    this.config.filters = {
      ...this.config.filters,
      ...config,
    };
  }

  /**
   * ログ回収時間設定を更新
   */
  public updateGameTimeConfig(config: Partial<GameTimeConfig>): void {
    this.config.gameTime = {
      ...this.config.gameTime,
      ...config,
    };
  }

  /**
   * 開始アイテムを追加
   */
  public addStartItem(item: StartItemConfig): void {
    if (!this.config.startItems.some((i) => i.itemId === item.itemId)) {
      this.config.startItems.push({ ...item });
    }
  }

  /**
   * 開始アイテムを削除
   */
  public removeStartItem(itemId: string): void {
    this.config.startItems = this.config.startItems.filter(
      (item) => item.itemId !== itemId,
    );
  }

  /**
   * 設定全体を更新
   */
  public updateConfig(config: Partial<LoggerConfiguration>): void {
    if (config.displayItems) {
      this.updateDisplayConfig(config.displayItems);
    }
    if (config.filters) {
      this.updateFilterConfig(config.filters);
    }
    if (config.gameTime) {
      this.updateGameTimeConfig(config.gameTime);
    }
    if (config.startItems) {
      this.config.startItems = [...config.startItems];
    }
    if (config.eventHandling) {
      this.updateEventHandlingConfig(config.eventHandling);
    }
  }

  /**
   * 設定をデフォルトにリセット
   */
  public resetToDefault(): void {
    this.config = {
      displayItems: { ...DEFAULT_DISPLAY_CONFIG },
      filters: { ...DEFAULT_FILTER_CONFIG },
      gameTime: { ...DEFAULT_GAME_TIME_CONFIG },
      startItems: [...DEFAULT_START_ITEMS],
      eventHandling: { ...DEFAULT_EVENT_HANDLING_CONFIG },
    };
  }

  /**
   * インスタンスの破棄
   */
  public static dispose(): void {
    ConfigManager.instance = null;
  }
}
