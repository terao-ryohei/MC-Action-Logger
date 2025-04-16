import type { LogEvent } from "../../types/core";

export interface ExporterOptions {
  config?: Record<string, unknown>;
}

export interface IExporter {
  export(events: LogEvent[], options: ExporterOptions): Promise<string>;
}

/**
 * JSONエクスポーター
 */
export class JsonExporter implements IExporter {
  async export(events: LogEvent[], _options: ExporterOptions): Promise<string> {
    return JSON.stringify(events, null, 2);
  }
}

/**
 * CSVエクスポーター
 */
export class CsvExporter implements IExporter {
  async export(events: LogEvent[], options: ExporterOptions): Promise<string> {
    const separator = (options.config?.separator as string) ?? ",";
    const includeHeaders = options.config?.includeHeaders ?? true;

    // ヘッダー行を作成
    let csv = "";
    if (includeHeaders) {
      csv = `id${separator}type${separator}timestamp${separator}level${separator}details${separator}metadata\n`;
    }

    // データ行を作成
    const rows = events.map((event) => {
      const details =
        typeof event.details === "object"
          ? JSON.stringify(event.details)
          : String(event.details);
      const metadata = event.metadata ? JSON.stringify(event.metadata) : "";

      return [
        event.id,
        event.type,
        event.timestamp,
        event.level,
        `"${details.replace(/"/g, '""')}"`,
        `"${metadata.replace(/"/g, '""')}"`,
      ].join(separator);
    });

    return csv + rows.join("\n");
  }
}

/**
 * エクスポーターのファクトリー関数
 */
export function createExporter(format: "json" | "csv"): IExporter {
  switch (format) {
    case "json":
      return new JsonExporter();
    case "csv":
      return new CsvExporter();
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
