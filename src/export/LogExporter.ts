import type {
  PlayerLog,
  PlayerAction,
  ExportConfiguration,
  ExportData,
  ExportMetadata,
  GameTimeStamp,
} from "../types/types";

/**
 * ログデータをエクスポートするクラス
 */
export class LogExporter {
  private config: ExportConfiguration;
  private readonly VERSION = "1.0.0";

  constructor(config: ExportConfiguration) {
    this.config = config;
  }

  /**
   * ログのエクスポート
   */
  public async exportLogs(logs: PlayerLog[]): Promise<void> {
    try {
      const formattedData = this.formatData(logs);

      switch (this.config.format) {
        case "json":
          await this.exportAsJson(formattedData);
          break;
        case "csv":
          await this.exportAsCsv(formattedData.logs);
          break;
        case "txt":
          await this.exportAsTxt(formattedData.logs);
          break;
        default:
          throw new Error(`Unsupported format: ${this.config.format}`);
      }
    } catch (error) {
      console.error("ログのエクスポート中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * メタデータを含むデータの整形
   */
  private formatData(logs: PlayerLog[]): ExportData {
    const data: ExportData = {
      logs: [...logs],
    };

    if (this.config.includeMetadata) {
      data.metadata = {
        exportTime: new Date().toISOString(),
        format: this.config.format,
        recordCount: logs.reduce((acc, log) => acc + log.actions.length, 0),
        version: this.VERSION,
      };
    }

    return data;
  }

  /**
   * JSONフォーマットでのエクスポート
   */
  private async exportAsJson(data: ExportData): Promise<void> {
    const json = JSON.stringify(data, null, 2);
    await this.writeToFile(json, "json");
  }

  /**
   * CSVフォーマットでのエクスポート
   */
  private async exportAsCsv(logs: PlayerLog[]): Promise<void> {
    const headers = ["PlayerId", "Timestamp", "ActionType", "Level", "Details"];
    const rows = [headers.join(",")];

    for (const log of logs) {
      for (const action of log.actions) {
        const timestamp = this.formatTimestamp(action.timestamp);
        const details = JSON.stringify(action.details).replace(/"/g, '""');

        rows.push(
          [
            log.playerId,
            timestamp,
            action.type,
            action.level,
            `"${details}"`,
          ].join(","),
        );
      }
    }

    await this.writeToFile(rows.join("\n"), "csv");
  }

  /**
   * テキストフォーマットでのエクスポート
   */
  private async exportAsTxt(logs: PlayerLog[]): Promise<void> {
    const lines: string[] = [];

    for (const log of logs) {
      lines.push(`=== Player: ${log.playerId} ===`);

      for (const action of log.actions) {
        const timestamp = this.formatTimestamp(action.timestamp);
        lines.push(
          `[${timestamp}] ${action.type} (Level: ${action.level})`,
          `Details: ${JSON.stringify(action.details, null, 2)}`,
          "---",
        );
      }

      lines.push(""); // Empty line between players
    }

    await this.writeToFile(lines.join("\n"), "txt");
  }

  /**
   * タイムスタンプのフォーマット
   */
  private formatTimestamp(timestamp: GameTimeStamp): string {
    const date = new Date(timestamp.realTime);
    const gameTime = `[${timestamp.gameTime.hour.toString().padStart(2, "0")}:${timestamp.gameTime.minute.toString().padStart(2, "0")}]`;
    switch (this.config.timestampFormat) {
      case "ISO":
        return `${gameTime} (${date.toISOString()})`;
      case "LOCAL":
        return `${gameTime} (${date.toLocaleString()})`;
      case "UNIX":
        return `${gameTime} (${timestamp.realTime})`;
      default:
        return `${gameTime} (${date.toISOString()})`;
    }
  }

  /**
   * ファイルへの書き込み
   */
  private async writeToFile(content: string, extension: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `actionlog_${timestamp}.${extension}`;
    const path = `${this.config.outputPath}/${filename}`;

    // ここでファイル書き込みの実装
    // MinecraftのAdd-onの制約上、実際のファイル書き込みは
    // 別のメカニズム（例：WebSocket経由でのホストアプリケーションへの送信）
    // を使用する必要があります。

    // この実装は仮のものです
    console.log(`Exporting to ${path}`);
    console.log(content);
  }

  /**
   * エクスポート設定の更新
   */
  public updateConfig(config: Partial<ExportConfiguration>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}
