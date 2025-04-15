import { system } from "@minecraft/server";
import { GameManager } from "./managers/GameManager";
import { setupScriptEvents } from "./examples/ScriptEventExample";

// ゲームマネージャーのインスタンス化
const gameManager = GameManager.getInstance();

// スクリプトイベントの設定
setupScriptEvents(gameManager);

// システムの初期化完了をログに出力
system.runInterval(() => {
  try {
    if (!gameManager.getGameState().isRunning) {
      // world.sendMessage(
      //   "§aシステムの準備が完了しました。時計を使用してゲームを開始してください。",
      // );
      return;
    }
  } catch (error) {
    console.error("システム初期化中にエラーが発生しました:", error);
  }
}, 100);

// 基本コンポーネントのエクスポート
export { gameManager };
export { GameManager } from "./managers/GameManager";
export { LogManager } from "./managers/LogManager";
export { TimerManager } from "./managers/TimerManager";
export { UIManager } from "./managers/UIManager";
export { BlockInteractionLogger } from "./managers/BlockInteractionLogger";
export { ScriptEventLogger } from "./managers/ScriptEventLogger";

// インターフェースのエクスポート
export type { IBlockInteractionLogger } from "./managers/interfaces/IBlockInteractionLogger";
export type { IScriptEventLogger } from "./managers/interfaces/IScriptEventLogger";

// BlockInteractionTypes関連の型エクスポート
export type {
  BlockInteraction,
  BlockDefinition,
  BlockState,
  ExtendedBlockAction,
  ItemInfo,
  BlockActionType,
  BlockPosition,
} from "./managers/types/BlockInteractionTypes";

// ScriptEventTypes関連の型エクスポート
export type {
  ScriptEventData,
  ScriptEventRecord,
  EventDefinition,
  EventState,
  EventSource,
  Parameter,
  ScriptEventMessageTemplate,
  EventOutput,
  ParameterValue,
  ParameterData,
  ParameterFormatter,
} from "./managers/types/ScriptEventTypes";
export { EventCategory } from "./managers/types/ScriptEventTypes";
