import { ActionLoggerModule } from "../ActionLoggerModule";
import { LogLevel } from "../types/types";

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

  // ログ回収開始
  logger.start();

  // ログ回収終了時の処理
  setTimeout(() => {
    logger.stop();
    logger.dispose();
  }, 1800000); // 30分後
}
