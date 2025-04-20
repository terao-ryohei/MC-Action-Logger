import { world, system, type Player } from "@minecraft/server";
import type { GameManager } from "./GameManager";
import { GAME_CONSTANTS, type GameTimeConfig } from "../types";

/**
 * タイマー機能を管理するクラス
 */
export class TimerManager {
  private gameManager: GameManager;
  private tickCallback: () => void;
  private runScheduleId: number | undefined;
  private lastWarningTime = 0;
  private gameStartTime = 0; // ゲーム開始時のタイムスタンプ
  private readonly WARNING_COOLDOWN = 1000; // 警告音のクールダウン（ミリ秒）
  private gameTimeConfig: GameTimeConfig;

  constructor(gameManager: GameManager) {
    this.gameManager = gameManager;
    this.tickCallback = this.tick.bind(this);
    // デフォルトのゲーム時間設定
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
      if (this.runScheduleId !== undefined) {
        return;
      }
      this.gameStartTime = Date.now() + this.gameTimeConfig.initialTime;

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
      const gameState = this.gameManager.getGameState();
      if (!gameState.isRunning || gameState.remainingTime <= 0) {
        this.stop();
        if (gameState.remainingTime <= 0) {
          this.gameManager.endGame();
        }
        return;
      }

      // GameManagerを通じて残り時間を更新
      this.gameManager.updateRemainingTime(gameState.remainingTime - 1);

      // 残り時間の表示
      this.displayTime(gameState.remainingTime - 1);
    } catch (error) {
      console.error("タイマーのtick処理中にエラーが発生しました:", error);
      this.stop();
    }
  }

  /**
   * 残り時間の表示
   */
  private displayTime(remainingSeconds: number): void {
    try {
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      const timeText = `§e残り時間: ${minutes}:${seconds.toString().padStart(2, "0")}`;

      // 一括でプレイヤー取得
      const players = world.getAllPlayers();
      if (players.length === 0) return;

      // 表示とサウンド処理
      for (const player of players) {
        this.updatePlayerDisplay(player, timeText, remainingSeconds);
      }
    } catch (error) {
      console.error("残り時間の表示中にエラーが発生しました:", error);
    }
  }

  /**
   * プレイヤーごとの表示更新
   */
  private updatePlayerDisplay(
    player: Player,
    timeText: string,
    remainingSeconds: number,
  ): void {
    try {
      // アクションバーに表示
      player.onScreenDisplay.setActionBar(timeText);

      // 残り10秒以下の場合は警告音を鳴らす
      if (remainingSeconds <= 10) {
        this.playWarningSound(player);
      }
    } catch (error) {
      console.error(
        `プレイヤー ${player.name} の表示更新中にエラーが発生しました:`,
        error,
      );
    }
  }

  /**
   * 警告音の再生
   */
  private playWarningSound(player: Player): void {
    try {
      const now = Date.now();
      // クールダウンチェック
      if (now - this.lastWarningTime < this.WARNING_COOLDOWN) {
        return;
      }

      player.playSound("note.pling", {
        pitch: 1.0,
        volume: 1.0,
      });

      this.lastWarningTime = now;
    } catch (error) {
      console.error("警告音の再生中にエラーが発生しました:", error);
    }
  }

  /**
   * ゲーム内時間の取得
   */
  public getGameTime(): {
    day: number;
    hour: number;
    minute: number;
    isAM: boolean;
  } {
    try {
      const currentRealSeconds = Math.floor(
        (Date.now() - this.gameStartTime) / 1000,
      );
      const currentGameSeconds =
        currentRealSeconds * this.gameTimeConfig.timeScale;
      const totalMinutes = Math.floor(currentGameSeconds / 60);
      const totalHours = Math.floor(totalMinutes / 60);
      const dayLength = this.gameTimeConfig.dayLength / 1000 / 60 / 60; // ミリ秒を時間に変換

      return {
        day: Math.floor(totalHours / dayLength) + 1, // 1日目から開始
        hour: Math.floor(totalHours % dayLength),
        minute: totalMinutes % 60,
        isAM: Math.floor(totalHours % dayLength) < dayLength / 2,
      };
    } catch (error) {
      console.error("ゲーム内時間の取得中にエラーが発生しました:", error);
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
   * ゲーム時間設定の更新
   */
  public updateGameTimeConfig(config: Partial<GameTimeConfig>): void {
    this.gameTimeConfig = {
      ...this.gameTimeConfig,
      ...config,
    };
  }

  /**
   * リソースの解放
   */
  public dispose(): void {
    this.stop();
  }
}
