import { ActionLoggerModule } from "../ActionLoggerModule";
import { LogLevel } from "../types";

/**
 * 基本的な使用例
 */
export function basicExample(): void {
  // モジュールの初期化
  const logger = ActionLoggerModule.getInstance();

  // 基本設定で初期化
  logger.initialize({
    gameTime: {
      initialTime: 1800000, // 30分（ミリ秒）
      timeScale: 1,
      dayLength: 1200000, // 20分（ミリ秒）
    },
    filters: {
      minLogLevel: LogLevel.INFO,
      includedActionTypes: [],
      excludedActionTypes: [],
      customFilters: [],
    },
    displayItems: {
      showTimestamp: true,
      showPlayerName: true,
      showActionType: true,
      showDetails: true,
    },
    startItems: [],
  });

  // ゲーム開始
  logger.startGame();

  // ゲーム終了時の処理
  setTimeout(() => {
    logger.stopGame();
    logger.dispose();
  }, 1800000); // 30分後
}
