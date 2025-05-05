import type { Player, Vector3 } from "@minecraft/server";
import type { PlayerActionLogManger } from "./PlayerActionLogManager";
import type { IBlockInteractionLogger } from "./interfaces/IBlockInteractionLogger";
import type {
  BlockInteraction,
  BlockDefinition,
  BlockState,
  ExtendedBlockAction,
  MessageTemplate,
  BlockActionType,
  BlockPosition,
} from "./types/BlockInteractionTypes";
import { ActionType } from "../types/types";

/**
 * ブロックの種類に応じたカテゴリー定義
 */
enum BlockCategory {
  CRAFTING = "crafting",
  STORAGE = "storage",
  SMELTING = "smelting",
  ENCHANTING = "enchanting",
  BREWING = "brewing",
  STONECUTTING = "stonecutting",
  REPAIRING = "repairing",
  COMPOSTING = "composting",
}

/**
 * ブロックカテゴリーごとの動詞マッピング
 */
const CategoryVerbMap: Record<BlockCategory, { [key: string]: string }> = {
  [BlockCategory.CRAFTING]: {
    use: "アイテムをクラフトするため作業台を使用",
    close: "作業台での作業を終了",
    process: "を作業台でクラフト",
  },
  [BlockCategory.STORAGE]: {
    open: "アイテムを収納/取り出すため開く",
    close: "収納を終了",
    deposit: "にアイテムを収納",
    withdraw: "からアイテムを取り出し",
  },
  [BlockCategory.SMELTING]: {
    use: "アイテムを精錬するため使用",
    close: "精錬作業を終了",
    process: "を精錬",
  },
  [BlockCategory.ENCHANTING]: {
    use: "アイテムにエンチャントを付与するため使用",
    close: "エンチャント作業を終了",
    process: "にエンチャントを付与",
  },
  [BlockCategory.BREWING]: {
    use: "ポーションを醸造するため使用",
    close: "醸造作業を終了",
    process: "のポーションを醸造",
  },
  [BlockCategory.STONECUTTING]: {
    use: "ブロックを加工するため使用",
    close: "加工作業を終了",
    process: "を加工",
  },
  [BlockCategory.REPAIRING]: {
    use: "アイテムを修繕/名前変更するため使用",
    close: "修繕作業を終了",
    process: "を修繕",
  },
  [BlockCategory.COMPOSTING]: {
    use: "アイテムを堆肥化するため使用",
    close: "堆肥化作業を終了",
    process: "を堆肥化",
  },
};

/**
 * ブロック定義とカテゴリーのマッピング
 */
const BlockDefinitions: Record<
  string,
  BlockDefinition & { category: BlockCategory }
> = {
  "minecraft:crafting_table": {
    id: "minecraft:crafting_table",
    displayName: "作業台",
    defaultAction: "use",
    category: BlockCategory.CRAFTING,
  },
  "minecraft:chest": {
    id: "minecraft:chest",
    displayName: "チェスト",
    defaultAction: "open",
    category: BlockCategory.STORAGE,
  },
  "minecraft:barrel": {
    id: "minecraft:barrel",
    displayName: "樽",
    defaultAction: "open",
    category: BlockCategory.STORAGE,
  },
  "minecraft:furnace": {
    id: "minecraft:furnace",
    displayName: "かまど",
    defaultAction: "use",
    category: BlockCategory.SMELTING,
  },
  "minecraft:blast_furnace": {
    id: "minecraft:blast_furnace",
    displayName: "高炉",
    defaultAction: "use",
    category: BlockCategory.SMELTING,
  },
  "minecraft:enchanting_table": {
    id: "minecraft:enchanting_table",
    displayName: "エンチャント台",
    defaultAction: "use",
    category: BlockCategory.ENCHANTING,
  },
  "minecraft:anvil": {
    id: "minecraft:anvil",
    displayName: "金床",
    defaultAction: "use",
    category: BlockCategory.REPAIRING,
  },
  "minecraft:brewing_stand": {
    id: "minecraft:brewing_stand",
    displayName: "醸造台",
    defaultAction: "use",
    category: BlockCategory.BREWING,
  },
  "minecraft:stonecutter": {
    id: "minecraft:stonecutter",
    displayName: "石切台",
    defaultAction: "use",
    category: BlockCategory.STONECUTTING,
  },
  "minecraft:composter": {
    id: "minecraft:composter",
    displayName: "コンポスター",
    defaultAction: "use",
    category: BlockCategory.COMPOSTING,
  },
};

/**
 * ブロックインタラクションを管理するクラス
 */
export class BlockInteractionLogger implements IBlockInteractionLogger {
  private interactions: BlockInteraction[] = [];
  private readonly playerActionLogManger: PlayerActionLogManger;
  private readonly maxHistorySize: number = 1000;
  private blockStates = new Map<string, BlockState>();
  private messageTemplates = new Map<string, Record<string, MessageTemplate>>();

  constructor(playerActionLogManger: PlayerActionLogManger) {
    this.playerActionLogManger = playerActionLogManger;
  }

  /**
   * インタラクションメッセージの生成
   */
  private generateInteractionMessage(interaction: BlockInteraction): string {
    try {
      const blockDef = BlockDefinitions[interaction.blockId];
      if (!blockDef) {
        console.warn(`未定義のブロック: ${interaction.blockId}`);
        return `${interaction.displayName}を使用`;
      }

      const verbs = CategoryVerbMap[blockDef.category];
      const verb =
        verbs[interaction.action.type] || verbs[blockDef.defaultAction];

      // 目的を含むベースメッセージの生成
      const extendedAction = interaction.action as ExtendedBlockAction;
      let message = verb;
      if (extendedAction.purpose) {
        message = `${extendedAction.purpose}のため${verb}`;
      }

      // アイテム情報の追加
      if (extendedAction.items?.length) {
        message += `\n対象アイテム: ${extendedAction.items
          .map((item) => {
            let itemText = `${item.name}(${item.amount}個)`;
            if (item.quality) {
              itemText += ` - 品質:${item.quality}%`;
            }
            if (item.state) {
              itemText += ` - 状態:${item.state}`;
            }
            return itemText;
          })
          .join(", ")}`;
      }

      // 進捗情報の追加
      if (extendedAction.progress) {
        const { current, processedCount, totalCount, remainingTime } =
          extendedAction.progress;
        message += `\n進捗状況: ${current}% (${processedCount}/${totalCount})`;
        if (remainingTime) {
          message += ` - 残り時間:${this.formatDuration(remainingTime)}`;
        }
      }

      // 結果情報の追加
      if (extendedAction.result) {
        if (!extendedAction.result.success) {
          message += `\n処理結果: 失敗 - ${extendedAction.result.reason || "理由不明"}`;
        } else if (extendedAction.result.output) {
          const output = extendedAction.result.output;
          message += `\n処理結果: ${output.name}(${output.amount}個)を生成`;
          if (output.quality) {
            message += ` - 品質:${output.quality}%`;
          }
          if (output.state) {
            message += ` - 状態:${output.state}`;
          }
        }
      }

      // タイミング情報の追加
      if (extendedAction.timing.duration) {
        message += `\n所要時間: ${this.formatDuration(extendedAction.timing.duration)}`;
      }

      return message;
    } catch (error) {
      console.error("メッセージ生成エラー:", error);
      return `${interaction.displayName}を使用`;
    }
  }

  /**
   * 時間のフォーマット
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}時間${minutes % 60}分${seconds % 60}秒`;
    }
    if (minutes > 0) {
      return `${minutes}分${seconds % 60}秒`;
    }
    return `${seconds}秒`;
  }

  /**
   * ブロックとのインタラクションをログに記録
   */
  // playerId を引数に追加
  public logInteraction(playerId: string, interaction: BlockInteraction): void {
    try {
      // 履歴サイズの制限
      if (this.interactions.length >= this.maxHistorySize) {
        this.interactions = this.interactions.slice(-this.maxHistorySize + 1);
      }
      this.interactions.push(interaction);

      // ブロック状態の更新
      this.updateBlockState(interaction.blockId, interaction.action);

      // プレイヤーのアクションとしてログを記録 (logSystemAction の代わりに logAction を使用)
      // UIManager で整形するので message は不要
      // logAction に渡す details は BlockInteraction オブジェクト全体とする
      // LogLevel は logAction 内部で決定されるため、ここでは渡さない
      // プレイヤーのアクションとしてログを記録
      this.playerActionLogManger.logAction(playerId, ActionType.INTERACT, {
        blockId: interaction.blockId,
        position: interaction.position,
        action: interaction.action,
        items: interaction.action.items,
        displayName:
          BlockDefinitions[interaction.blockId]?.displayName ??
          "不明なブロック",
        details: this.generateInteractionMessage(interaction),
      });
    } catch (error) {
      console.error(
        `インタラクションログ記録エラー (Player: ${playerId}):`,
        error,
      );
    }
  }

  /**
   * 特定のブロックに関するインタラクションの履歴を取得
   */
  public getInteractionsByBlock(blockId: string): BlockInteraction[] {
    try {
      return this.interactions.filter(
        (interaction) => interaction.blockId === blockId,
      );
    } catch (error) {
      console.error("ブロック履歴取得エラー:", error);
      return [];
    }
  }

  /**
   * 最近のインタラクション履歴を取得
   */
  public getRecentInteractions(limit = 10): BlockInteraction[] {
    try {
      return this.interactions.slice(-Math.min(limit, this.maxHistorySize));
    } catch (error) {
      console.error("最近の履歴取得エラー:", error);
      return [];
    }
  }

  /**
   * 特定のブロックの現在の状態を取得
   */
  public getBlockState(blockId: string): BlockState | undefined {
    return this.blockStates.get(blockId);
  }

  /**
   * ブロックの状態を更新
   */
  public updateBlockState(
    blockId: string,
    action: ExtendedBlockAction,
  ): BlockState {
    let state = this.blockStates.get(blockId);
    const now = Date.now();

    if (!state) {
      state = {
        id: blockId,
        status: "idle",
        timing: {
          lastInteraction: now,
          totalSessionTime: 0,
        },
      };
    }

    // 状態の更新
    switch (action.type) {
      case "use":
      case "open": {
        state.status = "in_use";
        state.timing.sessionStart = now;
        state.currentAction = {
          type: action.type,
          startTime: now,
          items: action.items || [],
        };
        break;
      }

      case "close": {
        if (state.timing.sessionStart) {
          state.timing.totalSessionTime += now - state.timing.sessionStart;
        }
        state.status = "idle";
        state.currentAction = undefined;
        break;
      }

      case "process": {
        state.status = "processing";
        if (action.progress) {
          state.currentAction = {
            type: action.type,
            startTime: state.currentAction?.startTime || now,
            items: action.items || [],
            progress: action.progress,
          };
        }
        break;
      }
    }

    state.timing.lastInteraction = now;
    this.blockStates.set(blockId, state);
    return state;
  }

  /**
   * 特定のカテゴリーのブロックに対するインタラクションを取得
   */
  public getInteractionsByCategory(category: string): BlockInteraction[] {
    try {
      const categoryBlocks = Object.entries(BlockDefinitions)
        .filter(([, def]) => def.category === category)
        .map(([id]) => id);

      return this.interactions.filter((interaction) =>
        categoryBlocks.includes(interaction.blockId),
      );
    } catch (error) {
      console.error("カテゴリー別履歴取得エラー:", error);
      return [];
    }
  }

  /**
   * 特定のアクションタイプに関するインタラクションを取得
   */
  public getInteractionsByActionType(
    actionType: BlockActionType,
  ): BlockInteraction[] {
    try {
      return this.interactions.filter(
        (interaction) => interaction.action.type === actionType,
      );
    } catch (error) {
      console.error("アクションタイプ別履歴取得エラー:", error);
      return [];
    }
  }

  /**
   * 指定した時間範囲内のインタラクションを取得
   */
  public getInteractionsByTimeRange(
    startTime: number,
    endTime: number,
  ): BlockInteraction[] {
    try {
      return this.interactions.filter(
        (interaction) =>
          interaction.timestamp >= startTime &&
          interaction.timestamp <= endTime,
      );
    } catch (error) {
      console.error("時間範囲別履歴取得エラー:", error);
      return [];
    }
  }

  /**
   * メッセージテンプレートを登録
   */
  public registerMessageTemplates(
    category: string,
    templates: Record<string, MessageTemplate>,
  ): void {
    this.messageTemplates.set(category, templates);
  }

  /**
   * 未使用のブロック状態をクリーンアップ
   */
  public cleanupStaleStates(maxAge: number): void {
    const now = Date.now();
    for (const [blockId, state] of this.blockStates.entries()) {
      if (now - state.timing.lastInteraction > maxAge) {
        this.blockStates.delete(blockId);
      }
    }
  }

  /**
   * PlayerActionLogMangerにログデータをエクスポート
   */
  public exportToPlayerActionLogManger(): void {
    console.info(
      `${this.interactions.length}件のインタラクションログを記録済み`,
    );
  }

  /**
   * メモリの解放
   */
  public dispose(): void {
    this.interactions = [];
    this.blockStates.clear();
    this.messageTemplates.clear();
  }

  /**
   * プレイヤーによるブロックインタラクションイベントを処理します
   * @param event プレイヤーインタラクションイベントデータ
   */
  public handlePlayerInteraction(event: {
    player: Player;
    block: { typeId: string; location: Vector3 };
  }): void {
    // 入力パラメータの検証
    if (!event?.player || !event?.block?.typeId) {
      console.warn("無効なイベントデータです:", event);
      return;
    }

    const timestamp = Date.now();
    const blockId = event.block.typeId;

    // 未定義のブロックは無視してログを出力
    if (
      !Object.keys(BlockDefinitions).includes(blockId.replace("minecraft:", ""))
    ) {
      console.debug(`ログ対象外のブロック: ${blockId}`);
      return;
    }

    try {
      const blockDef = BlockDefinitions[blockId];

      // 位置情報の正規化
      const position: BlockPosition = {
        x: Math.floor(event.block.location.x),
        y: Math.floor(event.block.location.y),
        z: Math.floor(event.block.location.z),
      };

      // 基本的なアクション情報の作成
      const basicAction: ExtendedBlockAction = {
        type: blockDef.defaultAction,
        successful: true,
        timing: {
          startTime: timestamp,
        },
      };

      // インタラクション情報の構築
      const interaction: BlockInteraction = {
        blockId,
        displayName: blockDef.displayName,
        action: basicAction,
        timestamp,
        position,
      };

      // ログの記録
      this.logInteraction(event.player.id, interaction);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(
        `プレイヤーインタラクション処理エラー - Player: ${event?.player?.id ?? "unknown"}, Block: ${event?.block?.typeId ?? "unknown"} - ${errorMsg}`,
      );
    }
  }
}
