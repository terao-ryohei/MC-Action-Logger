import type {
  ILoggerConfig,
  ITimerConfig,
  IInputConfig,
  IUIConfig,
} from "../../types/config";

/**
 * デフォルトのタイマー設定
 */
const DEFAULT_TIMER_CONFIG: ITimerConfig = {
  logCollectionInterval: 1000,
  eventProcessDelay: 100,
  autoSaveInterval: 5000,
  timeout: 30000,
  batchSize: 100,
};

/**
 * デフォルトの入力設定
 */
const DEFAULT_INPUT_CONFIG: IInputConfig = {
  keyBindings: {
    toggleLog: "ctrl+l",
    applyFilter: "ctrl+f",
    clearLog: "ctrl+k",
  },
  throttleTime: 250,
  debounceTime: 300,
};

/**
 * デフォルトのUI設定
 */
const DEFAULT_UI_CONFIG: IUIConfig = {
  theme: {
    backgroundColor: "#1e1e1e",
    textColor: "#ffffff",
    accentColor: "#007acc",
  },
  fontSize: 14,
  maxLogLines: 1000,
  animations: true,
  timestampFormat: "short",
};

/**
 * デフォルトのロガー設定
 */
export const DEFAULT_LOGGER_CONFIG: ILoggerConfig = {
  timer: DEFAULT_TIMER_CONFIG,
  input: DEFAULT_INPUT_CONFIG,
  ui: DEFAULT_UI_CONFIG,
  debug: false,
};

/**
 * 設定が有効な数値であることを確認
 */
const isValidNumber = (value: number, min: number, max: number): boolean => {
  return (
    typeof value === "number" &&
    !Number.isNaN(value) &&
    value >= min &&
    value <= max
  );
};

/**
 * タイマー設定の検証
 */
const validateTimerConfig = (config: Partial<ITimerConfig>): string[] => {
  const errors: string[] = [];

  if (
    config.logCollectionInterval !== undefined &&
    !isValidNumber(config.logCollectionInterval, 100, 10000)
  ) {
    errors.push("logCollectionInterval must be between 100 and 10000ms");
  }

  if (
    config.eventProcessDelay !== undefined &&
    !isValidNumber(config.eventProcessDelay, 0, 1000)
  ) {
    errors.push("eventProcessDelay must be between 0 and 1000ms");
  }

  return errors;
};

/**
 * UI設定の検証
 */
const validateUIConfig = (config: Partial<IUIConfig>): string[] => {
  const errors: string[] = [];

  if (config.fontSize !== undefined && !isValidNumber(config.fontSize, 8, 32)) {
    errors.push("fontSize must be between 8 and 32px");
  }

  if (
    config.maxLogLines !== undefined &&
    !isValidNumber(config.maxLogLines, 100, 10000)
  ) {
    errors.push("maxLogLines must be between 100 and 10000");
  }

  return errors;
};

/**
 * 設定マネージャークラス
 */
export class ConfigManager {
  private config: ILoggerConfig;

  constructor(userConfig: Partial<ILoggerConfig> = {}) {
    this.config = this.initializeConfig(userConfig);
  }

  /**
   * 設定の初期化
   */
  private initializeConfig(userConfig: Partial<ILoggerConfig>): ILoggerConfig {
    const config = {
      ...DEFAULT_LOGGER_CONFIG,
      ...userConfig,
      timer: { ...DEFAULT_TIMER_CONFIG, ...userConfig.timer },
      input: { ...DEFAULT_INPUT_CONFIG, ...userConfig.input },
      ui: {
        ...DEFAULT_UI_CONFIG,
        ...userConfig.ui,
        theme: { ...DEFAULT_UI_CONFIG.theme, ...userConfig?.ui?.theme },
      },
    };

    const errors = this.validateConfig(config);
    if (errors.length > 0) {
      throw new Error(`Invalid configuration: ${errors.join(", ")}`);
    }

    return config;
  }

  /**
   * 設定全体の検証
   */
  private validateConfig(config: ILoggerConfig): string[] {
    return [
      ...validateTimerConfig(config.timer),
      ...validateUIConfig(config.ui),
    ];
  }

  /**
   * 設定の更新
   */
  public updateConfig(newConfig: Partial<ILoggerConfig>): void {
    this.config = this.initializeConfig({
      ...this.config,
      ...newConfig,
    });
  }

  /**
   * 現在の設定を取得
   */
  public getConfig(): Readonly<ILoggerConfig> {
    return { ...this.config };
  }

  /**
   * 特定のセクションの設定を取得
   */
  public getTimerConfig(): Readonly<ITimerConfig> {
    return { ...this.config.timer };
  }

  public getInputConfig(): Readonly<IInputConfig> {
    return { ...this.config.input };
  }

  public getUIConfig(): Readonly<IUIConfig> {
    return { ...this.config.ui };
  }
}
