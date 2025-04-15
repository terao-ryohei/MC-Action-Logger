/**
 * ブロックインタラクションに関する型定義
 */

/**
 * ブロックの位置を表す型
 */
export interface BlockPosition {
  x: number;
  y: number;
  z: number;
}

/**
 * ブロックアクションの種類
 */
export type BlockActionType =
  | "use"
  | "open"
  | "close"
  | "deposit"
  | "withdraw"
  | "process";

/**
 * アイテム情報の型
 */
export interface ItemInfo {
  name: string;
  amount: number;
  state?: string;
  quality?: number;
}

/**
 * 進捗情報の型
 */
export interface ProgressInfo {
  current: number;
  processedCount: number;
  totalCount: number;
  remainingTime?: number;
}

/**
 * タイミング情報の型
 */
export interface TimingInfo {
  startTime: number;
  endTime?: number;
  duration?: number;
}

/**
 * ブロックアクションの情報
 */
export interface BlockAction {
  type: BlockActionType;
  successful: boolean;
}

/**
 * 拡張されたブロックアクション情報
 */
export interface ExtendedBlockAction extends BlockAction {
  purpose?: string;
  items?: ItemInfo[];
  progress?: ProgressInfo;
  result?: {
    success: boolean;
    reason?: string;
    output?: ItemInfo;
  };
  timing: TimingInfo;
}

/**
 * ブロックインタラクションの情報
 */
export interface BlockInteraction {
  /**
   * ブロックのID（例: minecraft:chest）
   */
  blockId: string;

  /**
   * ブロックの表示名
   */
  displayName: string;

  /**
   * 実行されたアクション
   */
  action: ExtendedBlockAction;

  /**
   * インタラクションが発生した時のタイムスタンプ
   */
  timestamp: number;

  /**
   * ブロックの位置
   */
  position: BlockPosition;
}

/**
 * ブロック状態の型
 */
export interface BlockState {
  id: string;
  status: "idle" | "in_use" | "processing";
  currentAction?: {
    type: string;
    startTime: number;
    items: ItemInfo[];
    progress?: ProgressInfo;
  };
  inventory?: {
    input: ItemInfo[];
    output: ItemInfo[];
    fuel?: ItemInfo & { remainingTime?: number };
  };
  timing: {
    lastInteraction: number;
    sessionStart?: number;
    totalSessionTime: number;
  };
}

/**
 * ブロックの定義情報
 */
export interface BlockDefinition {
  /**
   * ブロックのID（例: minecraft:chest）
   */
  id: string;

  /**
   * ブロックの表示名
   */
  displayName: string;

  /**
   * デフォルトのアクションタイプ
   */
  defaultAction: BlockActionType;
}

/**
 * メッセージフォーマット用の値の型
 */
export type MessageValue = string | number | boolean | null | undefined;

/**
 * メッセージテンプレート定義
 */
export interface MessageTemplate {
  template: string;
  variables: string[];
  conditions?: {
    [key: string]: (action: ExtendedBlockAction) => boolean;
  };
  formatters?: {
    [key: string]: (value: MessageValue) => string;
  };
}
