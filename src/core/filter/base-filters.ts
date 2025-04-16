import type { LogEvent, LogFilter, LogLevel } from "../../types/core";

/**
 * 時間範囲フィルター
 * 指定した時間範囲内のイベントのみを含める
 */
export class TimeRangeFilter implements LogFilter {
  constructor(
    private readonly startTime: number,
    private readonly endTime: number,
  ) {}

  shouldInclude(event: LogEvent): boolean {
    return event.timestamp >= this.startTime && event.timestamp <= this.endTime;
  }
}

/**
 * ログレベルフィルター
 * 指定したログレベル以上のイベントのみを含める
 */
export class LogLevelFilter implements LogFilter {
  constructor(private readonly minLevel: LogLevel) {}

  shouldInclude(event: LogEvent): boolean {
    return event.level >= this.minLevel;
  }
}

/**
 * イベントタイプフィルター
 * 指定したイベントタイプのみを含める
 */
export class EventTypeFilter implements LogFilter {
  constructor(private readonly types: string[]) {}

  shouldInclude(event: LogEvent): boolean {
    return this.types.includes(event.type);
  }
}

/**
 * 複合フィルター
 * 複数のフィルターを組み合わせて使用
 */
export class CompositeFilter implements LogFilter {
  private readonly filters: LogFilter[] = [];

  /**
   * フィルターを追加
   * @param filter 追加するフィルター
   */
  addFilter(filter: LogFilter): void {
    this.filters.push(filter);
  }

  /**
   * フィルターをクリア
   */
  clearFilters(): void {
    this.filters.length = 0;
  }

  shouldInclude(event: LogEvent): boolean {
    // フィルターが設定されていない場合は全てのイベントを含める
    if (this.filters.length === 0) {
      return true;
    }

    // 全てのフィルターを満たす場合のみtrue
    return this.filters.every((filter) => filter.shouldInclude(event));
  }
}

/**
 * メタデータフィルター
 * メタデータの内容でフィルタリング
 */
export class MetadataFilter implements LogFilter {
  constructor(
    private readonly key: string,
    private readonly value: unknown,
  ) {}

  shouldInclude(event: LogEvent): boolean {
    return event.metadata?.[this.key] === this.value;
  }
}

/**
 * カスタムフィルター
 * カスタムの判定関数でフィルタリング
 */
export class CustomFilter implements LogFilter {
  constructor(private readonly predicate: (event: LogEvent) => boolean) {}

  shouldInclude(event: LogEvent): boolean {
    return this.predicate(event);
  }
}
