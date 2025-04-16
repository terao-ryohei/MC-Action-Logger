/**
 * ログレベルを表すenum
 * 汎用的なログレベルを定義
 */
export enum LogLevel {
  DEBUG = 0, // デバッグ情報
  VERBOSE = 1, // 詳細な情報
  INFO = 2, // 一般的な情報
  WARN = 3, // 警告
  ERROR = 4, // エラー
  FATAL = 5, // 致命的なエラー
}

/**
 * ログイベントの基本インターフェース
 */
export interface LogEvent {
  /** イベントの一意のID */
  id: string;

  /** イベントの種類 */
  type: string;

  /** イベントの発生時刻（UNIXタイムスタンプ） */
  timestamp: number;

  /** ログレベル */
  level: LogLevel;

  /** イベントの詳細情報 */
  details: unknown;

  /** 追加のメタデータ */
  metadata?: Record<string, unknown>;
}

/**
 * ログフィルターのインターフェース
 */
export interface LogFilter {
  /**
   * イベントを含めるかどうかを判定
   * @param event 判定対象のログイベント
   * @returns 含める場合はtrue、除外する場合はfalse
   */
  shouldInclude(event: LogEvent): boolean;
}

/**
 * エクスポート形式の定義
 */
export type ExportFormat = "json" | "csv" | "custom";

/**
 * エクスポートオプションのインターフェース
 */
export interface ExportOptions {
  /** エクスポート形式 */
  format: ExportFormat;

  /** フィルター（オプション） */
  filter?: LogFilter;

  /** カスタム設定（形式に応じたオプション） */
  config?: Record<string, unknown>;
}

/**
 * コアロガーのインターフェース
 */
export interface ILogger {
  /**
   * イベントを記録
   * @param event 記録するイベント
   */
  log(event: LogEvent): void;

  /**
   * フィルターを追加
   * @param filter 追加するフィルター
   */
  addFilter(filter: LogFilter): void;

  /**
   * 記録されたイベントをエクスポート
   * @param options エクスポートオプション
   */
  export(options: ExportOptions): Promise<string>;

  /**
   * 記録されたイベントを取得
   * @param filter フィルター（オプション）
   */
  getEvents(filter?: LogFilter): LogEvent[];

  /**
   * ロガーのリソースを解放
   */
  dispose(): void;
}

/**
 * ロガーの設定オプション
 */
export interface LoggerOptions {
  /** デフォルトのログレベル */
  defaultLevel?: LogLevel;

  /** 初期フィルター */
  filters?: LogFilter[];

  /** バッファサイズ（イベントの最大保持数） */
  bufferSize?: number;

  /** 自動エクスポートの設定 */
  autoExport?: {
    /** エクスポート形式 */
    format: ExportFormat;
    /** エクスポートの間隔（ミリ秒） */
    interval: number;
    /** エクスポート先のパス */
    path: string;
  };
}
