import type { LogFilter, PlayerAction } from "../../types";

/**
 * 複合フィルター
 * 複数のフィルターを組み合わせて使用
 */
export class CompositeLogFilter implements LogFilter {
  private filters: LogFilter[] = [];

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

  shouldDisplay(action: PlayerAction): boolean {
    // フィルターが設定されていない場合は全てのイベントを含める
    if (this.filters.length === 0) {
      return true;
    }

    // 全てのフィルターを満たす場合のみtrue
    return this.filters.every((filter) => filter.shouldDisplay(action));
  }
}
