import { world } from "@minecraft/server";
import {
  type LogFilter,
  type PlayerAction,
  LogLevel,
  type ActionType,
} from "../../types";

const SCOREBOARD_OBJECTIVE = "log_filters";

/**
 * スコアボードで制御可能なフィルターのインターフェース
 */
export interface IScoreboardControlledFilter {
  readonly filterName: string;
  enable(): void;
  disable(): void;
  getStatus(): boolean;
}

/**
 * スコアボードでフィルターを管理するためのマネージャークラス
 */
export class ScoreboardFilterManager {
  private filterScores: Map<string, number> = new Map();
  private filters: Map<string, IScoreboardControlledFilter & LogFilter> =
    new Map();

  /**
   * スコアボードを初期化
   */
  async initializeScoreboards(): Promise<void> {
    try {
      // スコアボードが存在しない場合は作成
      const objective = world.scoreboard.getObjective(SCOREBOARD_OBJECTIVE);
      if (!objective) {
        world.scoreboard.addObjective(SCOREBOARD_OBJECTIVE, "Log Filters");
      }

      // 既存のフィルター設定を読み込み
      this.syncWithScoreboard();
    } catch (error) {
      console.error(`Failed to initialize scoreboard: ${error}`);
    }
  }

  /**
   * スコアボードの値を監視し、変更があれば反映
   */
  private syncWithScoreboard(): void {
    const objective = world.scoreboard.getObjective(SCOREBOARD_OBJECTIVE);
    if (!objective) return;

    // 登録されているフィルターのスコアを取得
    for (const [filterName] of this.filters) {
      try {
        const score = objective.getScore(filterName) ?? 1; // デフォルトは有効
        this.filterScores.set(filterName, score);

        // フィルターの状態を更新
        if (score > 0) {
          this.filters.get(filterName)?.enable();
        } else {
          this.filters.get(filterName)?.disable();
        }
      } catch (error) {
        console.warn(`Failed to get score for ${filterName}: ${error}`);
      }
    }
  }

  /**
   * フィルターを登録
   * @param filter 登録するフィルター
   */
  registerFilter(filter: IScoreboardControlledFilter & LogFilter): void {
    this.filters.set(filter.filterName, filter);

    // 初期スコアを設定（デフォルトは有効=1）
    const objective = world.scoreboard.getObjective(SCOREBOARD_OBJECTIVE);
    if (objective && !this.filterScores.has(filter.filterName)) {
      try {
        objective.setScore(filter.filterName, 1);
        this.filterScores.set(filter.filterName, 1);
      } catch (error) {
        console.error(
          `Failed to set initial score for ${filter.filterName}: ${error}`,
        );
      }
    }
  }

  /**
   * フィルターの状態を更新
   */
  updateFilters(): void {
    this.syncWithScoreboard();
  }

  /**
   * フィルターのON/OFF切り替え
   * @param filterName フィルター名
   * @param enabled 有効にする場合はtrue
   */
  toggleFilter(filterName: string, enabled: boolean): void {
    const objective = world.scoreboard.getObjective(SCOREBOARD_OBJECTIVE);
    if (!objective) return;

    try {
      objective.setScore(filterName, enabled ? 1 : 0);
      this.filterScores.set(filterName, enabled ? 1 : 0);

      const filter = this.filters.get(filterName);
      if (filter) {
        if (enabled) {
          filter.enable();
        } else {
          filter.disable();
        }
      }
    } catch (error) {
      console.error(`Failed to toggle filter ${filterName}: ${error}`);
    }
  }

  /**
   * フィルターの状態を取得
   * @param filterName フィルター名
   * @returns フィルターが有効な場合はtrue
   */
  getFilterStatus(filterName: string): boolean {
    return this.filterScores.get(filterName) === 1;
  }
}

/**
 * スコアボードで制御可能な基本フィルタークラス
 */
export abstract class BaseScoreboardFilter
  implements IScoreboardControlledFilter, LogFilter
{
  private enabled = true;

  constructor(readonly filterName: string) {}

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  getStatus(): boolean {
    return this.enabled;
  }

  shouldDisplay(action: PlayerAction): boolean {
    if (!this.enabled) {
      return false;
    }
    return this.filterLogic(action);
  }

  /**
   * 具体的なフィルタリングロジックを実装するメソッド
   * @param action プレイヤーアクション
   * @returns イベントを含める場合はtrue
   */
  protected abstract filterLogic(action: PlayerAction): boolean;
}

/**
 * イベントタイプ用のスコアボード制御フィルター
 */
export class ScoreboardEventTypeFilter extends BaseScoreboardFilter {
  constructor(
    filterName: string,
    private readonly types: string[],
  ) {
    super(filterName);
  }

  protected filterLogic(action: PlayerAction): boolean {
    // 型安全性を確保
    return this.types.includes(action.type as ActionType);
  }
}
