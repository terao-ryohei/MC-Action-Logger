import { ActionLoggerModule } from "../ActionLoggerModule";
import { LogLevel, ActionType } from "../types";

/**
 * ログエクスポートの使用例
 */
export async function exportExample(): Promise<void> {
  const logger = ActionLoggerModule.getInstance();

  // 基本設定で初期化
  logger.initialize({
    gameTime: {
      initialTime: 1800000,
      timeScale: 1,
      dayLength: 1200000,
    },
    filters: {
      minLogLevel: LogLevel.ACTIVITY,
      includedActionTypes: [ActionType.BLOCK_BROKEN, ActionType.BLOCK_PLACED],
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

  // エクスポーター設定の初期化
  logger.initializeExporter({
    format: "json",
    includeMetadata: true,
    timestampFormat: "yyyy-MM-dd HH:mm:ss",
    outputPath: "./logs",
  });

  // ゲーム開始
  logger.startGame();

  // 1分後にログをエクスポート
  setTimeout(async () => {
    try {
      await logger.exportLogs();
      console.log("ログのエクスポートに成功しました");
    } catch (error) {
      console.error("ログのエクスポートに失敗しました:", error);
    }
  }, 60000);

  // 現在のログを直接取得して処理
  const currentLogs = logger.getLogs();
  console.log(
    `記録されたアクション数: ${currentLogs.reduce(
      (total, log) => total + log.actions.length,
      0,
    )}`,
  );

  // ゲーム終了時の処理
  setTimeout(() => {
    logger.stopGame();
    logger.dispose();
  }, 1800000);
}
