import {
  EventCategory,
  type EventDefinition,
  type ParameterValue,
} from "../managers/types/ScriptEventTypes";
import { GameManager } from "../managers/GameManager";
import { world, system, type Vector3 } from "@minecraft/server";
import { ActionType } from "../types";

/**
 * サンプルイベント定義
 */
const sampleEvents: EventDefinition[] = [
  {
    id: "door_operation",
    category: EventCategory.DOOR,
    displayName: "ドア操作",
    parameters: [
      {
        name: "state",
        type: "string",
        required: true,
        description: "ドアの状態（open/close）",
        validation: (value) =>
          typeof value === "string" && ["open", "close"].includes(value),
      },
      {
        name: "lockState",
        type: "boolean",
        required: false,
        description: "ドアのロック状態",
      },
    ],
    defaultState: {
      status: "inactive",
      lastUpdate: Date.now(),
      metadata: {
        activationCount: 0,
        totalActiveTime: 0,
      },
    },
    messageTemplate: {
      template: "ドアが${state}されました",
      variables: ["state", "lockState"],
      formatters: {
        state: (value) => (value === "open" ? "開か" : "閉じら"),
        lockState: (value) => (value ? "（ロック）" : ""),
      },
    },
  },
  {
    id: "redstone_signal",
    category: EventCategory.REDSTONE,
    displayName: "レッドストーン信号",
    parameters: [
      {
        name: "power",
        type: "number",
        required: true,
        description: "信号強度",
        validation: (value) =>
          typeof value === "number" && value >= 0 && value <= 15,
      },
      {
        name: "position",
        type: "vector",
        required: true,
        description: "信号の位置",
      },
    ],
    messageTemplate: {
      template: "信号強度: ${power} (位置: ${position})",
      variables: ["power", "position"],
      formatters: {
        power: (value) => `${value}/15`,
        position: (value) => {
          const pos = value as Vector3;
          return `${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}, ${pos.z.toFixed(0)}`;
        },
      },
    },
  },
];

/**
 * イベント定義の登録と使用例
 */
export function setupScriptEvents(gameManager: GameManager): void {
  const scriptEventLogger = gameManager.getScriptEventLogger();

  // イベント定義の登録
  for (const eventDef of sampleEvents) {
    scriptEventLogger.registerEventDefinition(eventDef);
  }

  // パラメータの作成
  const doorParams = new Map<string, ParameterValue>();
  doorParams.set("state", "open");
  doorParams.set("lockState", false);

  const redstoneParams = new Map<string, ParameterValue>();
  redstoneParams.set("power", 15);
  redstoneParams.set("position", { x: 100, y: 64, z: 200 });

  // サンプルイベントのログ記録
  // GameTimeStampの生成
  const currentTimestamp = {
    realTime: Date.now(),
    gameTime: gameManager.getTimerManager().getGameTime(),
  };

  scriptEventLogger.logScriptEvent({
    eventId: "door_operation",
    timestamp: currentTimestamp,
    parameters: doorParams,
    source: {
      type: "player",
      id: "player1", // 仮のID
    },
    position: { x: 100, y: 64, z: 200 },
    timing: {
      duration: 0,
    },
  });

  scriptEventLogger.logScriptEvent({
    eventId: "redstone_signal",
    timestamp: currentTimestamp,
    parameters: redstoneParams,
    source: {
      type: "block",
      id: "redstone_block",
    },
    position: { x: 100, y: 64, z: 200 },
    timing: {
      duration: 0,
    },
  });

  // scriptlogコマンドのイベントハンドラを設定
  // system.afterEvents.scriptEventReceive を使用
  system.afterEvents.scriptEventReceive.subscribe((ev) => {
    // ev の型注釈を削除し、型推論に任せる
    // ev と ev.id の存在を確認
    if (!ev || typeof ev.id !== "string" || !ev.id.startsWith("scriptlog:"))
      return;

    // "scriptlog:" を除いた部分をコマンドと引数に分割
    const messageContent = ev.id.slice("scriptlog:".length);
    const [command, ...args] = messageContent.split(" ");

    const manager = GameManager.getInstance();
    const logger = manager.getScriptEventLogger();

    try {
      if (!command) {
        showScriptLogHelp(); // コマンドがない場合はヘルプを表示
        return;
      }

      // ScriptEventLoggerにコマンド実行を委譲
      logger.executeScriptLogCommand(command, args);
    } catch (error) {
      console.error("scriptlogコマンドの実行エラー:", error);
      // エラーメッセージをプレイヤーに表示
      system.run(() => {
        // ev.sourceEntity の存在と sendMessage メソッドの存在を確認
        if (
          ev.sourceEntity &&
          "sendMessage" in ev.sourceEntity &&
          typeof ev.sourceEntity.sendMessage === "function"
        ) {
          try {
            ev.sourceEntity.sendMessage(`§cエラー: ${error}`);
          } catch (e) {
            console.error("エラーメッセージの送信に失敗:", e);
            world.sendMessage(
              `§cスクリプトログコマンドエラー(送信失敗): ${error}`,
            );
          }
        } else {
          // コマンドブロックなどからの実行の場合
          world.sendMessage(`§cスクリプトログコマンドエラー: ${error}`);
        }
      });

      // エラーのログを記録
      manager.getLogManager().logAction("system", ActionType.INTERACT, {
        eventId: "scriptlog_error",
        details: `スクリプトログコマンドのエラー: ${error}`,
        result: { success: false, error: String(error) },
      });
    }
  });
}

/**
 * イベント定義のエクスポート
 */
export const scriptEventDefinitions = sampleEvents;

/**
 * ヘルプメッセージの表示
 */
export function showScriptLogHelp(): void {
  system.run(() => {
    // コマンド形式を /scriptevent scriptlog:<command> に合わせる
    world.sendMessage("§e=== スクリプトログコマンド一覧 ===");
    world.sendMessage("§7/scriptevent scriptlog:show [件数] - 最新ログ表示");
    world.sendMessage("§7/scriptevent scriptlog:history - 全ログ表示");
    world.sendMessage("§7/scriptevent scriptlog:stats - 統計情報表示");
    world.sendMessage("§7/scriptevent scriptlog:search <キーワード> - 検索");
    world.sendMessage(
      "§7/scriptevent scriptlog:filter <カテゴリ> - カテゴリフィルター",
    );
    world.sendMessage(
      "§7/scriptevent scriptlog:time <開始Unix秒> <終了Unix秒> - 期間フィルター",
    );
    world.sendMessage(
      "§7/scriptevent scriptlog:player <名前> - プレイヤーフィルター",
    );
    world.sendMessage("§7/scriptevent scriptlog:pause - ログ記録一時停止");
    world.sendMessage("§7/scriptevent scriptlog:resume - ログ記録再開");
    world.sendMessage("§7/scriptevent scriptlog:clear - ログクリア");
  });
}
