import { MainManager } from "./managers/MainManager";
import { setupScriptEvents } from "./examples/ScriptEventExample";

// ログ回収マネージャーのインスタンス化
const mainManager = MainManager.getInstance();

// スクリプトイベントの設定
setupScriptEvents(mainManager);

// 基本コンポーネントのエクスポート
export { mainManager };
export { MainManager } from "./managers/MainManager";
export { PlayerActionLogManger } from "./managers/PlayerActionLogManager";
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
