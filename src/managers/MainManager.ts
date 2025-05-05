import { world, Player, type ItemUseBeforeEvent } from "@minecraft/server";
import { type GameState, GAME_CONSTANTS } from "../types/types";
import { TimerManager } from "./TimerManager";
import { PlayerActionLogManger } from "./PlayerActionLogManager";
import { UIManager } from "./UIManager";
import { BlockInteractionLogger } from "./BlockInteractionLogger";
import { ScriptEventLogger } from "./ScriptEventLogger";
import { PlayerStateLogger } from "./PlayerStateLogger";
import { EntityLifecycleLogger } from "./EntityLifecycleLogger";
import type { IBlockInteractionLogger } from "./interfaces/IBlockInteractionLogger";
import type { IScriptEventLogger } from "./interfaces/IScriptEventLogger";
import { ConfigManager } from "../config/ConfigManager";

/**
 * ログ回収全体の状態を管理するクラス
 */
export class MainManager {
  private static instance: MainManager | null = null;
  private gameState: GameState;
  private timerManager: TimerManager;
  private playerActionLogManger: PlayerActionLogManger;
  private uiManager: UIManager;
  private configManager: ConfigManager;
  private blockInteractionLogger: BlockInteractionLogger;
  private scriptEventLogger: ScriptEventLogger;
  private playerStateLogger: PlayerStateLogger;
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
      this.playerActionLogManger = new PlayerActionLogManger(this);
      this.blockInteractionLogger = new BlockInteractionLogger(
        this.playerActionLogManger,
      );
      // 各種ロガーの初期化
      this.scriptEventLogger = new ScriptEventLogger(
        this.playerActionLogManger,
        this,
        {
          maxHistorySize: 1000,
          maxStateAge: 3600000, // 1時間
        },
      );
      this.playerStateLogger = new PlayerStateLogger(
        this.playerActionLogManger,
        this,
      );
      this.entityLifecycleLogger = new EntityLifecycleLogger(
        this.playerActionLogManger,
      );
      this.uiManager = new UIManager(this);
      this.configManager = ConfigManager.getInstance();
      this.initializeEventHandlers();
    } catch (error) {
      console.error("MainManagerの初期化中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * MainManagerのシングルトンインスタンスを取得
   */
  public static getInstance(): MainManager {
    if (!MainManager.instance) {
      MainManager.instance = new MainManager();
    }
    return MainManager.instance;
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

    if (this.gameState.isRunning) {
      player.sendMessage("§cログ回収は既に実行中です！");
      event.cancel = true;
      return;
    }

    if (
      this.configManager
        .getConfig()
        .startItems.some((item) => item.itemId === event.itemStack.typeId)
    ) {
      this.startGame();
      return;
    }

    console.warn(
      `ログ回収開始アイテムではありません: ${event.itemStack.typeId} by ${player.name}`,
    );
  }

  /**
   * ログ回収状態の更新
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
   * ログ回収の開始処理
   */
  public startGame(): void {
    try {
      // タイマーの状態をチェック
      if (this.gameState.isRunning) {
        console.warn("ログ回収は既に実行中です");
        return;
      }

      // ログ回収状態を更新
      this.updateGameState({
        isRunning: true,
        startTime: Date.now(),
        remainingTime: GAME_CONSTANTS.GAME_DURATION,
      });

      // 各マネージャーをリセット
      this.playerActionLogManger.reset();
      this.scriptEventLogger.reset();
      this.playerStateLogger.initialize();

      // タイマーを最後に起動
      try {
        this.timerManager.start();
      } catch (error) {
        console.error("タイマーの起動に失敗しました:", error);
        this.updateGameState({
          isRunning: false,
          remainingTime: GAME_CONSTANTS.GAME_DURATION,
        });
        throw error;
      }

      world.sendMessage("§aログ回収が開始されました！");
    } catch (error) {
      console.error("ログ回収開始処理中にエラーが発生しました:", error);
      this.updateGameState({
        isRunning: false,
        remainingTime: GAME_CONSTANTS.GAME_DURATION,
      });
      world.sendMessage("§cログ回収の開始に失敗しました。");
    }
  }

  /**
   * ログ回収の終了処理
   */
  public endGame(): void {
    try {
      this.updateGameState({ isRunning: false });
      this.timerManager.stop();
      this.uiManager.distributeResults();

      world.sendMessage("§eログ回収が終了しました！");
    } catch (error) {
      console.error("ログ回収終了処理中にエラーが発生しました:", error);
      world.sendMessage("§cログ回収の終了処理中にエラーが発生しました。");
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
    this.playerActionLogManger?.dispose();
    this.blockInteractionLogger?.dispose();
    // 各種ロガーのdispose
    this.scriptEventLogger?.dispose();
    this.playerStateLogger?.dispose();
    this.entityLifecycleLogger?.dispose();
    MainManager.instance = null;
  }

  /**
   * ログ回収状態の取得
   */
  public getGameState(): GameState {
    return { ...this.gameState };
  }

  /**
   * PlayerActionLogMangerの取得
   */
  public getPlayerActionLogManger(): PlayerActionLogManger {
    return this.playerActionLogManger;
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
   * PlayerStateLoggerの取得
   */
  public getPlayerStateLogger(): PlayerStateLogger {
    return this.playerStateLogger;
  }

  /**
   * EntityLifecycleLoggerの取得
   */
  public getEntityLifecycleLogger(): EntityLifecycleLogger {
    return this.entityLifecycleLogger;
  }
}
