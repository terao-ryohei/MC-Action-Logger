import {
  world,
  Player,
  system,
  type Vector3,
  type EntityHurtAfterEvent,
  type PlayerInteractWithBlockAfterEvent,
} from "@minecraft/server";
import type { MainManager } from "./MainManager";
import {
  type PlayerLog,
  type PlayerAction,
  type LogFilter,
  ActionType,
  LogLevel,
  type LogSettings,
  CompositeLogFilter,
  type GameTimeStamp,
} from "../types/types";

/**
 * プレイヤーのアクションログを管理するクラス
 */

// ハンドラの型定義
type EventHandler<T> = (event: T) => void;

interface HandlerState {
  movement: boolean; // 移動チェック用
  attack: boolean; // 攻撃イベント用
  interact: boolean; // インタラクション用
}

interface SubscriptionMap {
  attack: null | { handler: EventHandler<EntityHurtAfterEvent> };
  interact: null | { handler: EventHandler<PlayerInteractWithBlockAfterEvent> };
}

export class PlayerActionLogManger {
  private readonly DEFAULT_MOVEMENT_CHECK_INTERVAL = 2;
  private mainManager: MainManager;
  private shouldDisplayAction(action: PlayerAction): boolean {
    const levelCheck = action.level >= this.settings.displayLevel;
    const filterCheck =
      this.settings.filters.length === 0 ||
      this.compositeFilter.shouldDisplay(action);
    return levelCheck && filterCheck;
  }

  private logs: Map<string, PlayerLog>;
  private settings: LogSettings;
  private compositeFilter: CompositeLogFilter;
  private lastJumpTime: Map<string, number>;
  private lastPositions: Map<string, { x: number; y: number; z: number }>;
  private movementCheckRunId: number | undefined;
  private handlerState: HandlerState = {
    movement: false,
    attack: false,
    interact: false,
  };
  private subscriptions: SubscriptionMap = {
    attack: null,
    interact: null,
  };
  private readonly MIN_MOVEMENT_DISTANCE = 1.0;
  private readonly MIN_JUMP_HEIGHT = 0.5;
  private readonly JUMP_COOLDOWN = 500; // ミリ秒

  constructor(mainManager: MainManager) {
    this.mainManager = mainManager;
    this.logs = new Map();
    this.lastJumpTime = new Map();
    this.lastPositions = new Map();

    // フィルター初期化
    this.compositeFilter = new CompositeLogFilter();

    // ログ設定の初期化
    this.settings = {
      defaultLevel: LogLevel.INFO,
      displayLevel: LogLevel.INFO,
      actionTypeSettings: new Map([
        [ActionType.MOVE, LogLevel.ACTIVITY], // 移動は通常アクティビティ
        [ActionType.JUMP, LogLevel.ACTIVITY], // ジャンプは通常アクティビティ
        [ActionType.ATTACK, LogLevel.INFO], // 攻撃は重要情報
        [ActionType.INTERACT, LogLevel.INFO], // インタラクトは重要情報
      ]),
      filters: [],
    };

    try {
      this.initializeEventHandlers();
    } catch (error) {
      console.error(
        "PlayerActionLogMangerの初期化中にエラーが発生しました:",
        error,
      );
      throw error;
    }
  }

  /**
   * イベントハンドラの初期化
   */
  private initializeEventHandlers(): void {
    try {
      // フィルター設定に基づいてハンドラを初期化
      this.updateEventHandlers();
    } catch (error) {
      console.error("イベントハンドラの初期化中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * フィルター設定に基づいて必要なハンドラを評価
   */
  private evaluateRequiredHandlers(): HandlerState {
    const actionTypes = new Set(
      this.settings.filters.map((filter) => filter.actionType).filter(Boolean),
    );

    return {
      movement:
        actionTypes.size === 0 ||
        actionTypes.has(ActionType.MOVE) ||
        actionTypes.has(ActionType.JUMP),
      attack: actionTypes.size === 0 || actionTypes.has(ActionType.ATTACK),
      interact: actionTypes.size === 0 || actionTypes.has(ActionType.INTERACT),
    };
  }

  /**
   * ハンドラの動的管理
   */
  private updateEventHandlers(): void {
    const requiredState = this.evaluateRequiredHandlers();

    // 移動チェック
    if (requiredState.movement && !this.handlerState.movement) {
      this.startMovementCheck();
    } else if (!requiredState.movement && this.handlerState.movement) {
      this.stopMovementCheck();
    } else if (
      requiredState.movement &&
      this.handlerState.movement &&
      this.settings.movementCheckInterval !== undefined
    ) {
      this.restartMovementCheck();
    }

    // 攻撃イベント
    if (requiredState.attack && !this.handlerState.attack) {
      const handler = this.handleAttack.bind(this);
      world.afterEvents.entityHurt.subscribe(handler);
      this.subscriptions.attack = { handler };
    } else if (
      !requiredState.attack &&
      this.handlerState.attack &&
      this.subscriptions.attack
    ) {
      world.afterEvents.entityHurt.unsubscribe(
        this.subscriptions.attack.handler,
      );
      this.subscriptions.attack = null;
    }

    // インタラクションイベント
    if (requiredState.interact && !this.handlerState.interact) {
      const handler = this.handleInteract.bind(this);
      world.afterEvents.playerInteractWithBlock.subscribe(handler);
      this.subscriptions.interact = { handler };
    } else if (
      !requiredState.interact &&
      this.handlerState.interact &&
      this.subscriptions.interact
    ) {
      world.afterEvents.playerInteractWithBlock.unsubscribe(
        this.subscriptions.interact.handler,
      );
      this.subscriptions.interact = null;
    }

    this.handlerState = requiredState;
  }

  /**
   * 移動チェックの開始
   */
  private startMovementCheck(): void {
    try {
      this.movementCheckRunId = system.runInterval(() => {
        try {
          if (!this.mainManager.getGameState().isRunning) return;

          const players = world.getAllPlayers();
          for (const player of players) {
            this.checkPlayerMovement(player);
          }
        } catch (error) {
          console.error("移動チェック中にエラーが発生しました:", error);
        }
      }, this.settings.movementCheckInterval ??
        this.DEFAULT_MOVEMENT_CHECK_INTERVAL);
    } catch (error) {
      console.error("移動チェックの開始に失敗しました:", error);
      throw error;
    }
  }

  /**
   * プレイヤーの移動チェック
   */
  private checkPlayerMovement(player: Player): void {
    const currentPos = player.location;
    const lastPos = this.lastPositions.get(player.id);

    // 最初の位置を記録
    if (!lastPos) {
      this.lastPositions.set(player.id, currentPos);
      return;
    }

    // ジャンプの検出
    const heightDiff = currentPos.y - lastPos.y;
    if (heightDiff > this.MIN_JUMP_HEIGHT) {
      this.checkAndLogJump(player, heightDiff);
    }

    // 移動距離の検出
    const distance = this.calculateDistance(currentPos, lastPos);
    if (distance > this.MIN_MOVEMENT_DISTANCE) {
      this.logMovement(player, lastPos, currentPos, distance);
      this.lastPositions.set(player.id, currentPos);
    }
  }

  /**
   * 2点間の距離を計算
   */
  private calculateDistance(
    pos1: { x: number; y: number; z: number },
    pos2: { x: number; y: number; z: number },
  ): number {
    return Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.z - pos2.z) ** 2);
  }

  /**
   * ジャンプのチェックとログ記録
   */
  private checkAndLogJump(player: Player, height: number): void {
    const now = Date.now();
    const lastJump = this.lastJumpTime.get(player.id) || 0;

    if (now - lastJump > this.JUMP_COOLDOWN) {
      this.logAction(player.id, ActionType.JUMP, {
        height: height,
      });
      this.lastJumpTime.set(player.id, now);
    }
  }

  /**
   * 移動のログ記録
   */
  private logMovement(
    player: Player,
    from: { x: number; y: number; z: number },
    to: { x: number; y: number; z: number },
    distance: number,
  ): void {
    this.logAction(player.id, ActionType.MOVE, {
      distance: distance,
      from: { x: from.x, y: from.y, z: from.z },
      to: { x: to.x, y: to.y, z: to.z },
    });
  }

  /**
   * 攻撃（ダメージ）イベントの処理
   */
  private handleAttack(event: EntityHurtAfterEvent): void {
    try {
      if (!this.mainManager.getGameState().isRunning) return;
      const attacker = event.damageSource.damagingEntity;
      if (!attacker || !(attacker instanceof Player)) return;

      this.logAction(attacker.id, ActionType.ATTACK, {
        target: event.hurtEntity?.typeId || "unknown",
      });
    } catch (error) {
      console.error("攻撃イベントの処理中にエラーが発生しました:", error);
    }
  }

  /**
   * インタラクションイベントの処理
   */
  private handleInteract(event: {
    player: Player;
    block: { typeId: string; location: Vector3 };
  }): void {
    try {
      if (!this.mainManager.getGameState().isRunning) return;

      // BlockInteractionLogger に処理を委譲
      // BlockInteractionLogger は詳細なログ処理を行い、内部で logAction を呼び出す
      const blockLogger = this.mainManager.getBlockInteractionLogger();
      if (blockLogger) {
        blockLogger.handlePlayerInteraction(event);
      } else {
        // フォールバック: BlockInteractionLogger が利用できない場合は基本的なログを記録
        this.logAction(event.player.id, ActionType.INTERACT, {
          block: event.block.typeId,
          location: event.block.location,
        });
      }
    } catch (error) {
      console.error(
        `インタラクションイベントの処理中にエラーが発生しました: Player=${event?.player?.id}, Block=${event?.block?.typeId}`,
        error,
      );
    }
  }

  /**
   * アクションのログ記録
   */
  /**
   * ゲーム内時刻情報の生成
   */
  private createGameTimeStamp(): GameTimeStamp {
    const realTime = Date.now();
    const gameTime = this.mainManager.getTimerManager().getGameTime();
    return {
      realTime,
      gameTime,
    };
  }

  /**
   * パブリックなログ記録メソッド
   */
  public logSystemAction(type: ActionType, details: unknown): void {
    this.logAction("system", type, details);
  }

  /**
   * プレイヤーのアクション記録
   */
  public logAction(
    // private から public に変更
    playerId: string,
    type: ActionType,
    details: unknown,
  ): void {
    // アクションのログレベルを取得
    const level =
      this.settings.actionTypeSettings.get(type) ?? this.settings.defaultLevel;
    try {
      let playerLog = this.logs.get(playerId);
      world.sendMessage(`Action Type: ${type}, Level: ${LogLevel[level]}`);
      if (!playerLog) {
        playerLog = {
          playerId,
          actions: [],
        };
        this.logs.set(playerId, playerLog);
      }

      playerLog.actions.push({
        type,
        timestamp: this.createGameTimeStamp(),
        details,
        level,
      });
    } catch (error) {
      console.error("アクションのログ記録中にエラーが発生しました:", error);
    }
  }

  /**
   * ログのリセット
   */
  public reset(): void {
    this.logs.clear();
    this.lastJumpTime.clear();
    this.lastPositions.clear();
  }

  /**
   * プレイヤーのログ取得
   */
  public getPlayerLog(playerId: string): PlayerLog {
    return (
      this.logs.get(playerId) || {
        playerId,
        actions: [],
      }
    );
  }

  /**
   * 全プレイヤーのログ取得
   */
  public getAllLogs(): PlayerLog[] {
    return Array.from(this.logs.values());
  }

  /**
   * フィルタリング済みの全ログ取得
   */
  public getFilteredAllLogs(): PlayerLog[] {
    return this.getAllLogs().map((log) => ({
      ...log,
      actions: log.actions.filter((action) => this.shouldDisplayAction(action)),
    }));
  }

  /**
   * フィルタリング済みのプレイヤーログ取得
   */
  public getFilteredPlayerLog(playerId: string): PlayerLog {
    const log = this.getPlayerLog(playerId);
    return {
      ...log,
      actions: log.actions.filter((action) => this.shouldDisplayAction(action)),
    };
  }

  /**
   * ログ設定の更新
   */
  /**
   * 移動チェックの停止
   */
  private stopMovementCheck(): void {
    if (this.movementCheckRunId !== undefined) {
      system.clearRun(this.movementCheckRunId);
      this.movementCheckRunId = undefined;
    }
  }

  /**
   * 移動チェックの再起動
   */
  private restartMovementCheck(): void {
    this.stopMovementCheck();
    this.startMovementCheck();
  }

  public updateSettings(settings: Partial<LogSettings>): void {
    const oldSettings = { ...this.settings };
    this.settings = {
      ...this.settings,
      ...settings,
    };

    // フィルター設定が変更された場合、ハンドラを再評価
    if ("filters" in settings) {
      this.updateEventHandlers();
    }
    // 移動チェック間隔が変更された場合、移動チェックを再起動
    else if (
      "movementCheckInterval" in settings &&
      oldSettings.movementCheckInterval !== settings.movementCheckInterval &&
      this.handlerState.movement
    ) {
      this.restartMovementCheck();
    }
  }

  /**
   * フィルターの追加
   */
  public addFilter(filter: LogFilter): void {
    this.compositeFilter.addFilter(filter);
  }

  /**
   * リソースの解放
   */
  public dispose(): void {
    try {
      // 全てのイベントハンドラを解放
      this.stopMovementCheck();
      if (this.subscriptions.attack) {
        world.afterEvents.entityHurt.unsubscribe(
          this.subscriptions.attack.handler,
        );
        this.subscriptions.attack = null;
      }
      if (this.subscriptions.interact) {
        world.afterEvents.playerInteractWithBlock.unsubscribe(
          this.subscriptions.interact.handler,
        );
        this.subscriptions.interact = null;
      }
      this.reset();
    } catch (error) {
      console.error(
        "PlayerActionLogMangerの解放中にエラーが発生しました:",
        error,
      );
    }
  }
}
