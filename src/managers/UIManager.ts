import { world, Player as MCPlayer, ItemStack } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import type { GameManager } from "./GameManager";
import {
  type PlayerLog,
  ActionType,
  PAPER_ITEM_ID,
  type PlayerAction,
} from "../types";
import type {
  ExtendedBlockAction,
  ItemInfo,
} from "./types/BlockInteractionTypes";
import { EventCategory } from "./types/ScriptEventTypes";
import type {
  ScriptEventRecord,
  ParameterValue,
  ParameterData,
} from "./types/ScriptEventTypes";

/**
 * UI表示を管理するクラス
 */
export class UIManager {
  private gameManager: GameManager;
  private eventUnsubscribe: (() => void) | null = null;
  private playerNameCache: Map<string, string> = new Map();
  private readonly ITEMS_PER_PAGE = 10;

  constructor(gameManager: GameManager) {
    this.gameManager = gameManager;
    try {
      this.initializeEventHandlers();
    } catch (error) {
      console.error("UIManagerの初期化中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * イベントハンドラの初期化
   */
  private initializeEventHandlers(): void {
    const callback = this.handleItemUse.bind(this);
    world.afterEvents.itemUse.subscribe(callback);
    this.eventUnsubscribe = () => {
      world.afterEvents.itemUse.unsubscribe(callback);
    };
  }

  /**
   * アイテム使用イベントの処理
   */
  private handleItemUse(event: {
    itemStack?: { typeId: string };
    source: MCPlayer;
  }): void {
    try {
      if (event.itemStack?.typeId === PAPER_ITEM_ID) {
        const player = event.source;
        if (player instanceof MCPlayer) {
          this.showLogUI(player);
        }
      }
    } catch (error) {
      console.error(
        "アイテム使用イベントの処理中にエラーが発生しました:",
        error,
      );
    }
  }

  /**
   * プレイヤーにアイテムを配布
   */
  private giveItemToPlayer(player: MCPlayer, item: ItemStack): void {
    try {
      const inventory = player.getComponent("inventory");
      if (!inventory?.container) {
        throw new Error("インベントリコンポーネントが見つかりません");
      }
      inventory.container.addItem(item);
      player.sendMessage(
        "§a活動記録が配布されました。右クリックで確認できます。",
      );
    } catch (error) {
      console.error(
        `プレイヤー ${player.name} へのアイテム配布中にエラーが発生しました:`,
        error,
      );
    }
  }

  /**
   * 結果表示用の紙アイテムを配布
   */
  public distributeResults(): void {
    try {
      const paperItem = new ItemStack(PAPER_ITEM_ID, 1);
      paperItem.nameTag = "§b活動記録§r";
      paperItem.setLore([
        "§7右クリックで記録を確認",
        "§7全プレイヤーの活動を確認できます",
      ]);

      for (const player of world.getAllPlayers()) {
        this.giveItemToPlayer(player, paperItem);
      }
    } catch (error) {
      console.error("結果配布中にエラーが発生しました:", error);
    }
  }

  /**
   * ログ表示UIの表示
   */
  private async showLogUI(player: MCPlayer): Promise<void> {
    try {
      const logs = this.gameManager.getLogManager().getFilteredAllLogs();
      if (logs.length === 0) {
        player.sendMessage("§c記録されたログがありません。");
        return;
      }

      const form = new ActionFormData()
        .title("活動記録")
        .body("確認したい記録の種類を選択してください。");

      form.button("プレイヤー別\n§7個人の活動記録を表示");
      form.button("イベント別\n§7スクリプトイベントを表示");

      const response = await form.show(player);
      world.sendMessage(JSON.stringify(logs));
      if (!response.canceled && response.selection !== undefined) {
        switch (response.selection) {
          case 0:
            await this.showPlayerSelectionUI(player, logs);
            break;
          case 1:
            await this.showEventCategorySelectionUI(player);
            break;
        }
      }
    } catch (error) {
      console.error("ログUIの表示中にエラーが発生しました:", error);
      player.sendMessage("§cエラーが発生しました。もう一度お試しください。");
    }
  }

  /**
   * プレイヤー選択UIの表示
   */
  private async showPlayerSelectionUI(
    player: MCPlayer,
    logs: PlayerLog[],
  ): Promise<void> {
    try {
      const form = new ActionFormData()
        .title("プレイヤー別活動記録")
        .body("確認したいプレイヤーを選択してください。");

      // プレイヤー名とログ件数を表示
      for (const log of logs) {
        const actionCount = log.actions.length;
        const playerName = await this.getPlayerName(log.playerId);
        form.button(`${playerName}\n§7${actionCount}件の記録`);
      }

      const response = await form.show(player);
      if (
        !response.canceled &&
        response.selection !== undefined &&
        logs[response.selection]
      ) {
        await this.showPlayerLogUI(player, logs[response.selection], 0);
      }
    } catch (error) {
      console.error("プレイヤー選択UIの表示中にエラーが発生しました:", error);
      player.sendMessage("§cエラーが発生しました。もう一度お試しください。");
    }
  }

  /**
   * プレイヤーログUIの表示
   */
  private async showPlayerLogUI(
    player: MCPlayer,
    log: PlayerLog,
    page: number,
  ): Promise<void> {
    try {
      const totalPages = Math.ceil(log.actions.length / this.ITEMS_PER_PAGE);
      const startIndex = page * this.ITEMS_PER_PAGE;
      const endIndex = Math.min(
        startIndex + this.ITEMS_PER_PAGE,
        log.actions.length,
      );
      const playerName = await this.getPlayerName(log.playerId);

      const form = new ActionFormData()
        .title(`${playerName}の記録 (${page + 1}/${totalPages}ページ)`)
        .body(this.formatPlayerLog(log, startIndex, endIndex));

      // ナビゲーションボタンの追加
      if (page > 0) form.button("前のページ");
      if (page < totalPages - 1) form.button("次のページ");
      form.button("プレイヤー選択に戻る");
      form.button("閉じる");

      const response = await form.show(player);
      if (!response.canceled && response.selection !== undefined) {
        let buttonIndex = 0;
        if (page > 0 && response.selection === buttonIndex++) {
          await this.showPlayerLogUI(player, log, page - 1);
          return;
        }
        if (page < totalPages - 1 && response.selection === buttonIndex++) {
          await this.showPlayerLogUI(player, log, page + 1);
          return;
        }
        if (response.selection === buttonIndex++) {
          const logs = this.gameManager.getLogManager().getFilteredAllLogs();
          await this.showPlayerSelectionUI(player, logs);
        }
      }
    } catch (error) {
      console.error("プレイヤーログUIの表示中にエラーが発生しました:", error);
      player.sendMessage("§cエラーが発生しました。もう一度お試しください。");
    }
  }

  /**
   * イベントカテゴリー選択UIの表示
   */
  private async showEventCategorySelectionUI(player: MCPlayer): Promise<void> {
    try {
      const scriptEventLogger = this.gameManager.getScriptEventLogger();
      const form = new ActionFormData()
        .title("イベント別記録")
        .body("確認したいイベントの種類を選択してください。");

      const categoryLabels: Record<EventCategory, string> = {
        [EventCategory.DOOR]: "ドア操作\n§7ドアの開閉記録",
        [EventCategory.REDSTONE]: "レッドストーン\n§7RS回路の動作記録",
        [EventCategory.MECHANISM]: "機構\n§7各種機構の動作記録",
        [EventCategory.GAME_RULE]: "ゲームルール\n§7設定変更の記録",
        [EventCategory.PLAYER_ACTION]: "プレイヤー\n§7プレイヤー関連イベント",
        [EventCategory.SYSTEM]: "システム\n§7システムイベント",
        [EventCategory.SCRIPTLOG]: "スクリプトログ\n§7コマンドログの記録",
      };

      // カテゴリーボタンの追加
      for (const [_category, label] of Object.entries(categoryLabels)) {
        form.button(label);
      }

      const response = await form.show(player);
      if (!response.canceled && response.selection !== undefined) {
        const categories = Object.keys(categoryLabels) as EventCategory[];
        const category = categories[response.selection];
        const events = scriptEventLogger.getEventsByCategory(category);
        await this.showEventLogUI(player, events, category, 0);
      }
    } catch (error) {
      console.error(
        "イベントカテゴリー選択UIの表示中にエラーが発生しました:",
        error,
      );
      player.sendMessage("§cエラーが発生しました。もう一度お試しください。");
    }
  }

  /**
   * イベントログUIの表示
   */
  private async showEventLogUI(
    player: MCPlayer,
    events: ScriptEventRecord[],
    category: EventCategory,
    page: number,
  ): Promise<void> {
    try {
      const totalPages = Math.ceil(events.length / this.ITEMS_PER_PAGE);
      const startIndex = page * this.ITEMS_PER_PAGE;
      const endIndex = Math.min(
        startIndex + this.ITEMS_PER_PAGE,
        events.length,
      );

      const form = new ActionFormData()
        .title(`${category}イベント記録 (${page + 1}/${totalPages}ページ)`)
        .body(this.formatEventLog(events, startIndex, endIndex));

      // ナビゲーションボタンの追加
      if (page > 0) form.button("前のページ");
      if (page < totalPages - 1) form.button("次のページ");
      form.button("カテゴリー選択に戻る");
      form.button("閉じる");

      const response = await form.show(player);
      if (!response.canceled && response.selection !== undefined) {
        let buttonIndex = 0;
        if (page > 0 && response.selection === buttonIndex++) {
          await this.showEventLogUI(player, events, category, page - 1);
          return;
        }
        if (page < totalPages - 1 && response.selection === buttonIndex++) {
          await this.showEventLogUI(player, events, category, page + 1);
          return;
        }
        if (response.selection === buttonIndex++) {
          await this.showEventCategorySelectionUI(player);
        }
      }
    } catch (error) {
      console.error("イベントログUIの表示中にエラーが発生しました:", error);
      player.sendMessage("§cエラーが発生しました。もう一度お試しください。");
    }
  }

  /**
   * プレイヤー名の取得（キャッシュ付き）
   */
  private async getPlayerName(playerId: string): Promise<string> {
    if (this.playerNameCache.has(playerId)) {
      return this.playerNameCache.get(playerId) ?? "不明なプレイヤー";
    }

    const player = world.getAllPlayers().find((p) => p.id === playerId);
    const name = player ? player.name : "不明なプレイヤー";
    this.playerNameCache.set(playerId, name);
    return name;
  }

  /**
   * プレイヤーログの整形
   */
  private formatPlayerLog(
    log: PlayerLog,
    startIndex: number,
    endIndex: number,
  ): string {
    if (log.actions.length === 0) {
      return "記録がありません。";
    }

    const lines: string[] = ["§e=== 活動記録 ===§r\n"];
    const actions = log.actions.slice(startIndex, endIndex);

    for (const action of actions) {
      try {
        const timeText = this.formatTime();
        const actionText = this.formatAction(action);
        if (actionText) {
          lines.push(`§7${timeText}§r: ${actionText}`);
        }
      } catch (error) {
        console.error("ログエントリの整形中にエラーが発生しました:", error);
      }
    }

    return lines.join("\n");
  }

  /**
   * イベントログの整形
   */
  private formatEventLog(
    events: ScriptEventRecord[],
    startIndex: number,
    endIndex: number,
  ): string {
    if (events.length === 0) {
      return "記録がありません。";
    }

    const lines: string[] = ["§e=== イベント記録 ===§r\n"];
    const displayEvents = events.slice(startIndex, endIndex);

    for (const event of displayEvents) {
      try {
        const timeText = this.formatTime();
        lines.push(`§7${timeText}§r: ${event.formattedMessage}`);
      } catch (error) {
        console.error(
          "イベントログエントリの整形中にエラーが発生しました:",
          error,
        );
      }
    }

    return lines.join("\n");
  }

  /**
   * 時刻の整形
   */
  private formatTime(): string {
    try {
      const gameTime = this.gameManager.getTimerManager().getGameTime();
      const hour12 = gameTime.hour % 12 || 12;
      return `${gameTime.day}日目 ${hour12.toString().padStart(2, "0")}:${gameTime.minute
        .toString()
        .padStart(2, "0")} ${gameTime.isAM ? "午前" : "午後"}`;
    } catch (error) {
      console.error("時刻の整形中にエラーが発生しました:", error);
      return "時刻不明";
    }
  }

  /**
   * アクションの整形
   */
  private formatAction(action: PlayerAction): string | undefined {
    try {
      switch (action.type) {
        case ActionType.MOVE: {
          const moveDetails = action.details as { distance: number };
          return `移動 (${moveDetails.distance.toFixed(1)}m)`;
        }
        case ActionType.JUMP: {
          const jumpDetails = action.details as { height: number };
          return `ジャンプ (高さ: ${jumpDetails.height.toFixed(1)}m)`;
        }
        case ActionType.ATTACK: {
          const attackDetails = action.details as { target: string };
          return `攻撃 (対象: ${attackDetails.target})`;
        }
        case ActionType.INTERACT: {
          const details = action.details as {
            blockId?: string;
            displayName?: string;
            action?: ExtendedBlockAction;
            items?: ItemInfo[];
            details?: string;
            eventId?: string;
            category?: EventCategory;
            parameters?: Record<string, unknown>;
          };

          if (!details || typeof details !== "object") {
            return "不明な対話";
          }

          // スクリプトイベントの場合
          if (details.eventId && details.category && details.parameters) {
            // パラメータをParameterData型に変換
            const safeParameters = Object.entries(
              details.parameters,
            ).reduce<ParameterData>((acc, [key, value]) => {
              // 値をParameterValueとして検証
              if (value === null || value === undefined) {
                acc[key] = null;
              } else if (
                typeof value === "string" ||
                typeof value === "number" ||
                typeof value === "boolean" ||
                (typeof value === "object" &&
                  value !== null &&
                  "x" in value &&
                  "y" in value &&
                  "z" in value)
              ) {
                acc[key] = value as ParameterValue;
              } else {
                acc[key] = String(value);
              }
              return acc;
            }, {});

            return (
              details.details ||
              this.formatScriptEventInAction({
                eventId: details.eventId,
                category: details.category,
                parameters: safeParameters,
              })
            );
          }

          // 通常のブロック操作の場合
          if (details.details) {
            return details.details;
          }

          let message = `${details.displayName || "不明なブロック"}を操作`;
          if (details.items?.length) {
            const itemList = details.items
              .map((item) => `${item.name}x${item.amount}`)
              .join(", ");
            message += ` (${itemList})`;
          }

          if (details.action?.type === "deposit") {
            message += "に収納";
          } else if (details.action?.type === "withdraw") {
            message += "から取り出し";
          }

          return message;
        }
        default:
          return "不明なアクション";
      }
    } catch (error) {
      console.error("アクションの整形中にエラーが発生しました:", error);
      return "アクションの詳細を表示できません";
    }
  }

  /**
   * スクリプトイベントの整形（アクション内）
   */
  private formatScriptEventInAction(details: {
    eventId: string;
    category: EventCategory;
    parameters: ParameterData;
  }): string {
    try {
      const scriptEventLogger = this.gameManager.getScriptEventLogger();
      const eventDef = scriptEventLogger.getEventDefinition(details.eventId);

      if (!eventDef) {
        return `${details.eventId} イベントが発生`;
      }

      // パラメータの整形
      const params = Object.entries(details.parameters)
        .map(([key, value]) => {
          // パラメータ値をParameterValue型として扱う
          const paramValue = value as ParameterValue;
          const formatter = eventDef.messageTemplate.formatters?.[key];
          if (formatter && paramValue !== undefined) {
            return formatter(paramValue);
          }
          return `${key}: ${this.formatParameterValue(paramValue)}`;
        })
        .filter((param) => param !== undefined)
        .join(", ");

      return `${eventDef.displayName} (${params})`;
    } catch (error) {
      console.error("スクリプトイベントの整形中にエラーが発生しました:", error);
      return "イベントの詳細を表示できません";
    }
  }

  /**
   * パラメータ値の整形
   */
  private formatParameterValue(value: ParameterValue): string {
    if (value === null || value === undefined) {
      return "未設定";
    }

    if (
      typeof value === "object" &&
      "x" in value &&
      "y" in value &&
      "z" in value
    ) {
      return `(${value.x}, ${value.y}, ${value.z})`;
    }

    return String(value);
  }

  /**
   * リソースの解放
   */
  public dispose(): void {
    if (this.eventUnsubscribe) {
      try {
        this.eventUnsubscribe();
      } catch (error) {
        console.error("イベントリスナーの解除中にエラーが発生しました:", error);
      }
      this.eventUnsubscribe = null;
    }
    this.playerNameCache.clear();
  }
}
