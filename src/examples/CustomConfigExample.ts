import { ActionLoggerModule } from "../ActionLoggerModule";
import {
  ActionType,
  LogLevel,
  ActionTypeFilter,
  TimeRangeFilter,
} from "../types/types";

/**
 * カスタム設定の使用例
 */
export function customConfigExample(): void {
  const logger = ActionLoggerModule.getInstance();

  // カスタムフィルターの作成
  const actionFilter = new ActionTypeFilter([
    ActionType.BLOCK_BROKEN,
    ActionType.BLOCK_PLACED,
    ActionType.PLAYER_HEALTH_CHANGE,
  ]);

  const timeFilter = new TimeRangeFilter(
    Date.now(),
    Date.now() + 3600000, // 1時間
  );

  // カスタム設定で初期化
  logger.initialize({
    gameTime: {
      initialTime: 3600000, // 1時間（ミリ秒）
      timeScale: 2, // 2倍速
      dayLength: 1200000, // 20分（ミリ秒）
    },
    filters: {
      minLogLevel: LogLevel.ACTIVITY,
      includedActionTypes: [ActionType.BLOCK_BROKEN, ActionType.BLOCK_PLACED],
      excludedActionTypes: [
        ActionType.MOVE, // 移動は記録しない
        ActionType.JUMP, // ジャンプも記録しない
      ],
      customFilters: [actionFilter, timeFilter],
    },
    displayItems: {
      showTimestamp: true,
      showPlayerName: true,
      showActionType: true,
      showDetails: true,
    },
    startItems: [
      {
        itemId: "minecraft:clock",
        displayName: "ログ回収開始アイテム",
        canBeUsedByNonOp: true,
      },
    ],
  });

  // ログ回収開始
  logger.start();

  // 設定の動的更新例
  //   setTimeout(() => {
  //     logger.updateConfig({
  //       filters: {
  //         minLogLevel: LogLevel.INFO, // ログレベルを上げる
  //         excludedActionTypes: [], // 除外フィルターをクリア
  //         includedActionTypes: [], // 必要に応じて空配列を設定
  //         customFilters: [], // 必要に応じて空配列を設定
  //       },
  //     });
  //   }, 1800000); // 30分後に設定を更新
}
