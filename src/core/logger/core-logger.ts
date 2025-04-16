import { v4 as uuidv4 } from "uuid";
import fs from "node:fs";
import path from "node:path";
import type {
  ILogger,
  LogEvent,
  LogFilter,
  LoggerOptions,
  ExportOptions,
} from "../../types/core";
import { LogLevel } from "../../types/core";
import { CompositeFilter } from "../filter/base-filters";
import { createExporter } from "../export";

type NodeJSTimeout = ReturnType<typeof setTimeout>;

/**
 * コアロガーの実装クラス
 */
export class CoreLogger implements ILogger {
  private readonly events: LogEvent[] = [];
  private readonly filter: CompositeFilter;
  private readonly options: Required<LoggerOptions>;
  private autoExportInterval?: NodeJSTimeout;

  constructor(options: LoggerOptions = {}) {
    // デフォルトオプションとマージ
    this.options = {
      defaultLevel: options.defaultLevel ?? LogLevel.INFO,
      filters: options.filters ?? [],
      bufferSize: options.bufferSize ?? 1000,
      autoExport: options.autoExport ?? {
        format: "json",
        interval: 60000, // 1分
        path: "./logs",
      },
    };

    // フィルターの初期化
    this.filter = new CompositeFilter();
    for (const filter of this.options.filters) {
      this.filter.addFilter(filter);
    }

    // 自動エクスポートの設定
    if (this.options.autoExport) {
      this.startAutoExport();
    }
  }

  /**
   * イベントを記録
   */
  log(event: Omit<LogEvent, "id" | "timestamp">): void {
    const fullEvent: LogEvent = {
      ...event,
      id: uuidv4(),
      timestamp: Date.now(),
    };

    this.events.push(fullEvent);

    // バッファサイズを超えた場合、古いイベントを削除
    if (this.events.length > this.options.bufferSize) {
      this.events.shift();
    }
  }

  /**
   * フィルターを追加
   */
  addFilter(filter: LogFilter): void {
    this.filter.addFilter(filter);
  }

  /**
   * イベントをエクスポート
   */
  async export({ format, filter, config }: ExportOptions): Promise<string> {
    const events = this.getEvents(filter);
    const exporter = createExporter(format === "custom" ? "json" : format);

    if (format === "custom") {
      if (
        !config?.exportFunction ||
        typeof config.exportFunction !== "function"
      ) {
        throw new Error("Custom export requires an exportFunction in config");
      }
      return config.exportFunction(events);
    }

    return exporter.export(events, { config });
  }

  /**
   * 記録されたイベントを取得
   */
  getEvents(additionalFilter?: LogFilter): LogEvent[] {
    let filteredEvents = this.events;

    // 基本フィルターを適用
    filteredEvents = filteredEvents.filter((event) =>
      this.filter.shouldInclude(event),
    );

    // 追加のフィルターがある場合は適用
    if (additionalFilter) {
      filteredEvents = filteredEvents.filter((event) =>
        additionalFilter.shouldInclude(event),
      );
    }

    return filteredEvents;
  }

  /**
   * ロガーのリソースを解放
   */
  dispose(): void {
    this.stopAutoExport();
    this.events.length = 0;
  }

  /**
   * 自動エクスポートを開始
   */
  private startAutoExport(): void {
    if (this.autoExportInterval) {
      return;
    }

    this.autoExportInterval = setInterval(async () => {
      try {
        const exportData = await this.export({
          format: this.options.autoExport.format,
        });

        // Node.jsの場合
        if (
          typeof process !== "undefined" &&
          process.versions &&
          process.versions.node
        ) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const filePath = path.join(
            this.options.autoExport.path,
            `log-${timestamp}.${this.options.autoExport.format}`,
          );

          fs.mkdirSync(this.options.autoExport.path, { recursive: true });
          fs.writeFileSync(filePath, exportData);
        }
        // ブラウザの場合は何もしない（必要に応じて実装を追加）
      } catch (error) {
        console.error("Auto export failed:", error);
      }
    }, this.options.autoExport.interval);
  }

  /**
   * 自動エクスポートを停止
   */
  private stopAutoExport(): void {
    if (this.autoExportInterval) {
      clearInterval(this.autoExportInterval);
      this.autoExportInterval = undefined;
    }
  }
}
