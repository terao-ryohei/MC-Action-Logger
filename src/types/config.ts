/**
 * タイマー設定のインターフェース
 */
export interface ITimerConfig {
  /** ログ収集の間隔 (ミリ秒) */
  logCollectionInterval: number;
  /** イベント処理の遅延時間 (ミリ秒) */
  eventProcessDelay: number;
  /** 自動保存の間隔 (ミリ秒) */
  autoSaveInterval: number;
  /** タイムアウト時間 (ミリ秒) */
  timeout: number;
  /** バッチ処理の最大サイズ */
  batchSize: number;
}

/**
 * 入力管理設定のインターフェース
 */
export interface IInputConfig {
  /** キーバインドの設定 */
  keyBindings: {
    /** ログ表示のトグル */
    toggleLog: string;
    /** フィルター適用 */
    applyFilter: string;
    /** ログのクリア */
    clearLog: string;
  };
  /** スロットル時間 (ミリ秒) */
  throttleTime: number;
  /** デバウンス時間 (ミリ秒) */
  debounceTime: number;
}

/**
 * UI設定のインターフェース
 */
export interface IUIConfig {
  /** テーマ設定 */
  theme: {
    /** 背景色 */
    backgroundColor: string;
    /** テキスト色 */
    textColor: string;
    /** アクセント色 */
    accentColor: string;
  };
  /** フォントサイズ (px) */
  fontSize: number;
  /** ログ表示の最大行数 */
  maxLogLines: number;
  /** アニメーション有効/無効 */
  animations: boolean;
  /** タイムスタンプ表示形式 */
  timestampFormat: "none" | "short" | "full";
}

/**
 * 全体の設定インターフェース
 */
export interface ILoggerConfig {
  /** タイマー設定 */
  timer: ITimerConfig;
  /** 入力管理設定 */
  input: IInputConfig;
  /** UI設定 */
  ui: IUIConfig;
  /** デバッグモード */
  debug: boolean;
}
