import type { Player, Vector3 } from "@minecraft/server"; // Player, Vector3 をインポート
import type {
  BlockInteraction,
  BlockState,
  ExtendedBlockAction,
  MessageTemplate,
  BlockActionType,
} from "../types/BlockInteractionTypes";

/**
 * ブロックインタラクションのログを管理するインターフェース
 */
export interface IBlockInteractionLogger {
  /**
   * ブロックとのインタラクションをログに記録
   * @param interaction インタラクション情報
   */
  // playerId を引数に追加
  logInteraction(playerId: string, interaction: BlockInteraction): void;

  /**
   * 特定のブロックに関するインタラクションの履歴を取得
   * @param blockId ブロックのID
   * @returns 該当するインタラクションの配列
   */
  getInteractionsByBlock(blockId: string): BlockInteraction[];

  /**
   * 最近のインタラクション履歴を取得
   * @param limit 取得する履歴の最大数
   * @returns 最近のインタラクションの配列
   */
  getRecentInteractions(limit?: number): BlockInteraction[];

  /**
   * 特定のブロックの現在の状態を取得
   * @param blockId ブロックのID
   * @returns ブロックの状態情報
   */
  getBlockState(blockId: string): BlockState | undefined;

  /**
   * ブロックの状態を更新
   * @param blockId ブロックのID
   * @param action 実行されたアクション
   * @returns 更新後のブロック状態
   */
  updateBlockState(blockId: string, action: ExtendedBlockAction): BlockState;

  /**
   * 特定のカテゴリーのブロックに対するインタラクションを取得
   * @param category ブロックのカテゴリー
   * @returns インタラクションの配列
   */
  getInteractionsByCategory(category: string): BlockInteraction[];

  /**
   * 特定のアクションタイプに関するインタラクションを取得
   * @param actionType アクションタイプ
   * @returns インタラクションの配列
   */
  getInteractionsByActionType(actionType: BlockActionType): BlockInteraction[];

  /**
   * 指定した時間範囲内のインタラクションを取得
   * @param startTime 開始時刻
   * @param endTime 終了時刻
   * @returns インタラクションの配列
   */
  getInteractionsByTimeRange(
    startTime: number,
    endTime: number,
  ): BlockInteraction[];

  /**
   * メッセージテンプレートを登録
   * @param category ブロックカテゴリー
   * @param templates メッセージテンプレート
   */
  registerMessageTemplates(
    category: string,
    templates: Record<string, MessageTemplate>,
  ): void;

  /**
   * LogManagerにログデータをエクスポート
   */
  exportToLogManager(): void;

  /**
   * 未使用のブロック状態をクリーンアップ
   * @param maxAge 最大経過時間（ミリ秒）
   */
  cleanupStaleStates(maxAge: number): void;
  /**
   * すべてのリソースを解放
   */
  dispose(): void;

  /**
   * プレイヤーによるブロックインタラクションイベントを処理し、ログを記録
   * @param event プレイヤーインタラクションイベントデータ
   */
  handlePlayerInteraction(event: {
    player: Player;
    block: { typeId: string; location: Vector3 }; // locationも追加
  }): void; // ← セミコロンを追加
} // L109 の余分な閉じ括弧を削除
