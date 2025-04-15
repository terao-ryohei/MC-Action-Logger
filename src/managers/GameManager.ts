import { world, Player, type ItemUseBeforeEvent } from "@minecraft/server";
import { CLOCK_ITEM_ID, type GameState, GAME_CONSTANTS } from "../types";
import { TimerManager } from "./TimerManager";
import { LogManager } from "./LogManager";
import { UIManager } from "./UIManager";
import { BlockInteractionLogger } from "./BlockInteractionLogger";
import { ScriptEventLogger } from "./ScriptEventLogger";
import { PlayerStateChangeLogger } from "./PlayerStateChangeLogger";
import { EntityLifecycleLogger } from "./EntityLifecycleLogger";
import type { IBlockInteractionLogger } from "./interfaces/IBlockInteractionLogger";
import type { IScriptEventLogger } from "./interfaces/IScriptEventLogger";

/**
 * ゲーム全体の状態を管理するクラス
 */
export class GameManager {
  private static instance: GameManager | null = null;
  private gameState: GameState;
  private timerManager: TimerManager;
  private logManager: LogManager;
  private uiManager: UIManager;
  private blockInteractionLogger: BlockInteractionLogger;
  private scriptEventLogger: ScriptEventLogger;
  private playerStateChangeLogger: PlayerStateChangeLogger;
  private entityLifecycleLogger: EntityLifecycleLogger;
  private eventUnsubscribe: (() => void) | null = null;

  private constructor() {
    this.gameState = {
      isRunning: false,
      startTime: 0,
      remainingTime: GAME_CONSTANTS.GAME_DURATION,
    };

    try {
      this.timerManager = new TimerManager(this);
      this.logManager = new LogManager(this);
      this.blockInteractionLogger = new BlockInteractionLogger(this.logManager);
      // 各種ロガーの初期化
      this.scriptEventLogger = new ScriptEventLogger(this.logManager, this, {
        maxHistorySize: 1000,
        maxStateAge: 3600000, // 1時間
      });
      this.playerStateChangeLogger = new PlayerStateChangeLogger(
        this.logManager,
        this,
      );
      this.entityLifecycleLogger = new EntityLifecycleLogger(this.logManager);
      this.uiManager = new UIManager(this);
      this.initializeEventHandlers();
    } catch (error) {
      console.error("GameManagerの初期化中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * GameManagerのシングルトンインスタンスを取得
   */
  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  /**
   * イベントハンドラの初期化
   */
  private initializeEventHandlers(): void {
    const callback = this.handleItemUse.bind(this);
    world.beforeEvents.itemUse.subscribe(callback);
    this.eventUnsubscribe = () => {
      world.beforeEvents.itemUse.unsubscribe(callback);
    };
  }

  /**
   * アイテム使用イベントの処理
   */
  private handleItemUse(event: ItemUseBeforeEvent): void {
    if (!event.itemStack) return;

    const player = event.source;
    if (!(player instanceof Player)) return;

    if (!this.isClockItem(event.itemStack)) {
      return;
    }

    if (this.gameState.isRunning) {
      player.sendMessage("§cゲームは既に実行中です！");
      event.cancel = true;
      return;
    }

    this.startGame();
  }

  /**
   * 時計アイテムかどうかの判定
   */
  private isClockItem(item: { typeId: string }): boolean {
    return item?.typeId === CLOCK_ITEM_ID;
  }

  /**
   * ゲーム状態の更新
   */
  private updateGameState(newState: Partial<GameState>): void {
    this.gameState = {
      ...this.gameState,
      ...newState,
    };
  }

  /**
   * 残り時間の更新
   */
  public updateRemainingTime(remainingTime: number): void {
    if (!this.gameState.isRunning) return;
    let time = remainingTime;
    if (remainingTime < 0) time = 0;

    this.updateGameState({ remainingTime: time });
  }

  /**
   * ゲームの開始処理
   */
  private startGame(): void {
    try {
      this.updateGameState({
        isRunning: true,
        startTime: Date.now(),
        remainingTime: GAME_CONSTANTS.GAME_DURATION,
      });

      this.logManager.reset();
      this.timerManager.start();
      // 各種ロガーの初期化
      this.scriptEventLogger.reset();
      this.playerStateChangeLogger.initialize();

      world.sendMessage("§aゲームが開始されました！");
    } catch (error) {
      console.error("ゲーム開始処理中にエラーが発生しました:", error);
      this.updateGameState({
        isRunning: false,
        remainingTime: GAME_CONSTANTS.GAME_DURATION,
      });
      world.sendMessage("§cゲームの開始に失敗しました。");
    }
  }

  /**
   * ゲームの終了処理
   */
  public endGame(): void {
    try {
      this.updateGameState({ isRunning: false });
      this.timerManager.stop();
      this.uiManager.distributeResults();

      world.sendMessage("§eゲームが終了しました！");
    } catch (error) {
      console.error("ゲーム終了処理中にエラーが発生しました:", error);
      world.sendMessage("§cゲームの終了処理中にエラーが発生しました。");
    }
  }

  /**
   * リソースの解放
   */
  public dispose(): void {
    if (this.eventUnsubscribe) {
      this.eventUnsubscribe();
      this.eventUnsubscribe = null;
    }

    this.timerManager?.stop();
    this.logManager?.dispose();
    this.blockInteractionLogger?.dispose();
    // 各種ロガーのdispose
    this.scriptEventLogger?.dispose();
    this.playerStateChangeLogger?.dispose();
    this.entityLifecycleLogger?.dispose();
    GameManager.instance = null;
  }

  /**
   * ゲーム状態の取得
   */
  public getGameState(): GameState {
    return { ...this.gameState };
  }

  /**
   * LogManagerの取得
   */
  public getLogManager(): LogManager {
    return this.logManager;
  }

  /**
   * TimerManagerの取得
   */
  public getTimerManager(): TimerManager {
    return this.timerManager;
  }

  /**
   * UIManagerの取得
   */
  public getUIManager(): UIManager {
    return this.uiManager;
  }

  /**
   * BlockInteractionLoggerの取得
   * @returns IBlockInteractionLogger インターフェースを実装したインスタンス
   */
  public getBlockInteractionLogger(): IBlockInteractionLogger {
    return this.blockInteractionLogger;
  }

  /**
   * ScriptEventLoggerの取得
   * @returns IScriptEventLogger インターフェースを実装したインスタンス
   */
  public getScriptEventLogger(): IScriptEventLogger {
    return this.scriptEventLogger;
  }

  /**
   * PlayerStateChangeLoggerの取得
   */
  public getPlayerStateChangeLogger(): PlayerStateChangeLogger {
    return this.playerStateChangeLogger;
  }

  /**
   * EntityLifecycleLoggerの取得
   */
  public getEntityLifecycleLogger(): EntityLifecycleLogger {
    return this.entityLifecycleLogger;
  }
}
