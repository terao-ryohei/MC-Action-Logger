import { world, system } from "@minecraft/server";
import type { MainManager } from "./MainManager";
import { GAME_CONSTANTS, type GameTimeConfig } from "../types/types";

/**
 * タイマー機能を管理するクラス
 */
export class TimerManager {
  private mainManager: MainManager;
  private tickCallback: () => void;
  private runScheduleId: number | undefined;
  private gameTimeConfig: GameTimeConfig;
  private isEnabled = false; // タイマーの有効/無効状態を管理

  constructor(mainManager: MainManager) {
    this.mainManager = mainManager;
    this.tickCallback = this.tick.bind(this);
    // デフォルトのログ回収時間設定
    this.gameTimeConfig = {
      initialTime: 0,
      timeScale: 1,
      dayLength: 24 * 60 * 60 * 1000, // 24時間（ミリ秒）
    };
  }

  /**
   * タイマーの開始
   */
  public start(): void {
    try {
      if (!this.isEnabled || this.runScheduleId !== undefined) {
        console.log("タイマーは無効化されているか、既に実行中です");
        return;
      }

      const gameState = this.mainManager.getGameState();
      if (!gameState.isRunning) {
        console.log("ログ回収が実行中でないため、タイマーを開始できません");
        return;
      }

      console.log("タイマーを開始します");

      // 1秒ごとにtickを実行
      this.runScheduleId = system.runInterval(
        this.tickCallback,
        GAME_CONSTANTS.TICKS_PER_SECOND, // 20ticks = 1秒
      );
    } catch (error) {
      console.error("タイマーの開始に失敗しました:", error);
      this.stop();
      throw error;
    }
  }

  /**
   * タイマーの停止
   */
  public stop(): void {
    try {
      if (this.runScheduleId !== undefined) {
        system.clearRun(this.runScheduleId);
        this.runScheduleId = undefined;
      }
    } catch (error) {
      console.error("タイマーの停止に失敗しました:", error);
      this.runScheduleId = undefined;
    }
  }

  /**
   * 毎秒の処理
   */
  private tick(): void {
    try {
      const gameState = this.mainManager.getGameState();
      if (!gameState.isRunning || gameState.remainingTime <= 0) {
        this.stop();
        if (gameState.remainingTime <= 0) {
          this.mainManager.endGame();
        }
        return;
      }

      // MainManagerを通じて残り時間を更新
      this.mainManager.updateRemainingTime(gameState.remainingTime - 1);
    } catch (error) {
      console.error("タイマーのtick処理中にエラーが発生しました:", error);
      this.stop();
    }
  }

  /**
   * ログ回収内時間の取得
   */
  public getGameTime(): {
    day: number;
    hour: number;
    minute: number;
    isAM: boolean;
  } {
    try {
      // マインクラフトのログ回収内時間を取得（0-24000）
      const timeOfDay = world.getTimeOfDay();

      // 時間の計算（1時間 = 1000 ticks）
      // 6:00が0、18:00が12000になるように調整（+6を加算）
      const adjustedTime = (timeOfDay + 6000) % 24000;
      const hour = Math.floor(adjustedTime / 1000);

      // 分の計算（1分 = 1000/60 ticks ≈ 16.67 ticks）
      const minuteTicks = adjustedTime % 1000;
      const minute = Math.floor((minuteTicks / 1000) * 60);

      return {
        day: 1, // 日付は使用しないので固定値
        hour: hour,
        minute: minute,
        isAM: hour < 12,
      };
    } catch (error) {
      console.error("ログ回収内時間の取得中にエラーが発生しました:", error);
      // エラー時はデフォルト値を返す（1日目 00:00 午前）
      return {
        day: 1,
        hour: 0,
        minute: 0,
        isAM: true,
      };
    }
  }

  /**
   * ログ回収時間設定の更新
   */
  public updateGameTimeConfig(config: Partial<GameTimeConfig>): void {
    this.gameTimeConfig = {
      ...this.gameTimeConfig,
      ...config,
    };

    // タイマーの有効/無効状態を設定
    this.isEnabled = config.timeScale !== 0;

    if (!this.isEnabled && this.runScheduleId !== undefined) {
      console.log("タイマーを無効化します");
      this.stop();
    }
  }

  /**
   * リソースの解放
   */
  public dispose(): void {
    this.stop();
  }
}
