import { Player } from "@minecraft/server"; // Player は instanceof で使うので値としてインポート
import type { EffectAddAfterEvent, EntityComponent } from "@minecraft/server"; // 他は型としてのみ使用

// コンポーネントの型定義
type HealthComponent = EntityComponent & {
  currentValue?: number;
  effectiveMax?: number;
};

type FoodComponent = EntityComponent & {
  foodLevel?: number;
  saturationLevel?: number;
  maxFoodLevel?: number;
};
import { world, system } from "@minecraft/server"; // world, system は実行時に必要
import type { LogManager } from "./LogManager"; // LogManager は型としてのみ使用
import { ActionType, GAME_CONSTANTS } from "../types"; // ActionType などは値として使用
import type { GameManager } from "./GameManager"; // GameManager は型としてのみ使用
import type {
  // 型定義は型としてのみ使用
  PlayerHealthChangeDetails,
  PlayerHungerChangeDetails,
  PlayerExperienceChangeDetails,
  PlayerEffectAddedDetails,
  PlayerEffectRemovedDetails,
  PlayerStateSnapshot,
} from "./types/EntityPlayerStateTypes";

/**
 * プレイヤーの状態変化（体力、空腹度、経験値、ステータス効果）を記録するロガー
 */
export class PlayerStateChangeLogger {
  private logManager: LogManager;
  private gameManager: GameManager;
  private playerStates: Map<string, PlayerStateSnapshot>;
  private pollingIntervalId?: number;
  private readonly POLLING_INTERVAL_TICKS = GAME_CONSTANTS.TICKS_PER_SECOND; // 1秒ごとにポーリング

  // アロー関数プロパティとして定義し、this を束縛しつつ参照を固定
  private handleEffectAddBound = this.handleEffectAdd.bind(this);

  constructor(logManager: LogManager, gameManager: GameManager) {
    this.logManager = logManager;
    this.gameManager = gameManager;
    this.playerStates = new Map();
  }

  /**
   * イベントリスナーとポーリングを初期化・登録する
   */
  public initialize(): void {
    // bind した関数を渡す
    system.run(() => {
      world.afterEvents.effectAdd.subscribe(this.handleEffectAddBound);
    });
    this.startPolling();
    console.log("[PlayerStateChangeLogger] Initialized.");
  }

  /**
   * イベントリスナーとポーリングを破棄する
   */
  public dispose(): void {
    try {
      // subscribe に渡した関数と同じ参照を渡す
      system.run(() => {
        world.afterEvents.effectAdd.unsubscribe(this.handleEffectAddBound);
      });
    } catch (error) {
      console.warn(
        `[PlayerStateChangeLogger] Error unsubscribing from effectAdd event: ${error}`,
      );
    }
    this.stopPolling();
    console.log("[PlayerStateChangeLogger] Disposed.");
  }

  /**
   * ポーリングを開始する
   */
  private startPolling(): void {
    if (this.pollingIntervalId !== undefined) {
      console.warn("[PlayerStateChangeLogger] Polling is already running.");
      return;
    }
    this.pollingIntervalId = system.runInterval(() => {
      try {
        if (!this.gameManager.getGameState().isRunning) {
          // ゲームが実行中でない場合は、状態を更新せずにリセットする
          // (ゲーム再開時に初回ログが大量に出るのを防ぐため)
          this.playerStates.clear();
          return;
        }
        this.pollPlayerStates();
      } catch (error: unknown) {
        console.error("[PlayerStateChangeLogger] Error during polling:", error);
      }
    }, this.POLLING_INTERVAL_TICKS);
    console.log(
      `[PlayerStateChangeLogger] Started polling every ${this.POLLING_INTERVAL_TICKS} ticks.`,
    );
  }

  /**
   * ポーリングを停止する
   */
  private stopPolling(): void {
    if (this.pollingIntervalId !== undefined) {
      system.clearRun(this.pollingIntervalId);
      this.pollingIntervalId = undefined;
      console.log("[PlayerStateChangeLogger] Stopped polling.");
    }
  }

  /**
   * 全プレイヤーの状態をポーリングして変化を記録する
   */
  private pollPlayerStates(): void {
    const players = world.getAllPlayers();
    for (const player of players) {
      const currentPlayerId = player.id;
      const previousState = this.playerStates.get(currentPlayerId);
      const currentState = this.getPlayerStateSnapshot(player);

      if (previousState) {
        this.compareAndLogChanges(player, previousState, currentState);
      } else {
        // 初回は状態を記録するだけ
        // console.log(`[PlayerStateChangeLogger] Initial state recorded for ${player.name}`);
      }
      this.playerStates.set(currentPlayerId, currentState);
    }

    // ログアウトしたプレイヤーの状態を削除
    const currentPlayers = new Set(players.map((p) => p.id));
    for (const playerId of this.playerStates.keys()) {
      if (!currentPlayers.has(playerId)) {
        this.playerStates.delete(playerId);
        // console.log(`[PlayerStateChangeLogger] Removed state for logged out player ${playerId}`);
      }
    }
  }

  /**
   * プレイヤーの現在の状態スナップショットを取得する
   * @param player Player
   * @returns PlayerStateSnapshot
   */
  private getPlayerStateSnapshot(player: Player): PlayerStateSnapshot {
    // EntityComponent を拡張した型でキャスト
    const healthComponent = player.getComponent(
      "minecraft:health",
    ) as HealthComponent;
    const foodComponent = player.getComponent(
      "minecraft:food",
    ) as FoodComponent;
    const effectsMap = new Map<
      string,
      { amplifier: number; duration: number }
    >();
    try {
      // forEach を for...of に変更
      for (const effect of player.getEffects()) {
        effectsMap.set(effect.typeId, {
          amplifier: effect.amplifier,
          duration: effect.duration,
        });
      }
    } catch (e) {
      console.warn(
        `[PlayerStateChangeLogger] Failed to get effects for player ${player.id}: ${e}`,
      );
    }

    return {
      health: healthComponent?.currentValue ?? Number.NaN,
      foodLevel: foodComponent?.foodLevel ?? Number.NaN,
      saturationLevel: foodComponent?.saturationLevel ?? Number.NaN,
      level: player.level,
      xpProgress:
        player.xpEarnedAtCurrentLevel / player.totalXpNeededForNextLevel,
      totalExperience: player.getTotalXp(),
      effects: effectsMap,
    };
  }

  /**
   * 前回の状態と比較し、変更があればログを記録する
   * @param player Player
   * @param previous PlayerStateSnapshot
   * @param current PlayerStateSnapshot
   */
  private compareAndLogChanges(
    player: Player,
    previous: PlayerStateSnapshot,
    current: PlayerStateSnapshot,
  ): void {
    // 体力変化
    if (
      previous.health !== current.health &&
      !Number.isNaN(previous.health) &&
      !Number.isNaN(current.health)
    ) {
      // EntityComponent を拡張した型でキャスト
      const healthComponent = player.getComponent(
        "minecraft:health",
      ) as HealthComponent;
      const details: PlayerHealthChangeDetails = {
        previousValue: previous.health,
        currentValue: current.health,
        maxValue: healthComponent?.effectiveMax ?? 20, // 有効な最大値が取れなければデフォルト20
        // cause, sourceEntity はポーリングでは取得困難なため省略
      };
      this.logManager.logAction(
        player.id,
        ActionType.PLAYER_HEALTH_CHANGE,
        details,
      );
    }

    // 空腹度変化
    if (
      (previous.foodLevel !== current.foodLevel ||
        previous.saturationLevel !== current.saturationLevel) &&
      !Number.isNaN(previous.foodLevel) &&
      !Number.isNaN(current.foodLevel) &&
      !Number.isNaN(previous.saturationLevel) &&
      !Number.isNaN(current.saturationLevel)
    ) {
      // EntityComponent を拡張した型でキャスト
      const foodComponent = player.getComponent(
        "minecraft:food",
      ) as FoodComponent;
      const details: PlayerHungerChangeDetails = {
        previousValue: previous.foodLevel,
        currentValue: current.foodLevel,
        maxValue: foodComponent?.maxFoodLevel ?? 20, // 最大値が取れなければデフォルト20
        previousSaturation: previous.saturationLevel,
        currentSaturation: current.saturationLevel,
      };
      this.logManager.logAction(
        player.id,
        ActionType.PLAYER_HUNGER_CHANGE,
        details,
      );
    }

    // 経験値変化
    if (
      previous.totalExperience !== current.totalExperience &&
      !Number.isNaN(previous.totalExperience) &&
      !Number.isNaN(current.totalExperience)
    ) {
      const details: PlayerExperienceChangeDetails = {
        previousLevel: previous.level,
        currentLevel: current.level,
        previousProgress: previous.xpProgress,
        currentProgress: current.xpProgress,
        totalExperience: current.totalExperience,
      };
      this.logManager.logAction(
        player.id,
        ActionType.PLAYER_EXPERIENCE_CHANGE,
        details,
      );
    }

    // 効果除去の検出
    for (const [effectType, _] of previous.effects) {
      if (!current.effects.has(effectType)) {
        const details: PlayerEffectRemovedDetails = {
          effectType: effectType,
          reason: "expired_or_cleared", // ポーリングでは詳細な理由は不明
        };
        this.logManager.logAction(
          player.id,
          ActionType.PLAYER_EFFECT_REMOVED,
          details,
        );
      }
    }

    // 注意: 効果追加は effectAdd イベントで処理するため、ここでは検知しない
    // 注意: 効果の amplifier や duration の変化はログ対象外
  }

  /**
   * ステータス効果追加イベントを処理する
   * @param event EffectAddAfterEvent
   */
  private handleEffectAdd(event: EffectAddAfterEvent): void {
    try {
      if (!this.gameManager.getGameState().isRunning) return;

      const entity = event.entity;
      // プレイヤー以外は無視
      if (!(entity instanceof Player)) {
        return;
      }

      const effectState = event.effect;
      const details: PlayerEffectAddedDetails = {
        effectType: effectState.typeId,
        amplifier: effectState.amplifier,
        duration: effectState.duration,
      };

      this.logManager.logAction(
        entity.id,
        ActionType.PLAYER_EFFECT_ADDED,
        details,
      );

      // ポーリング用の状態も即時更新（除去ログが誤って出ないように）
      const currentState = this.playerStates.get(entity.id);
      if (currentState) {
        currentState.effects.set(effectState.typeId, {
          amplifier: effectState.amplifier,
          duration: effectState.duration,
        });
      }
    } catch (error: unknown) {
      console.error(
        "[PlayerStateChangeLogger] Error handling effect add:",
        error,
      );
    }
  }
}
