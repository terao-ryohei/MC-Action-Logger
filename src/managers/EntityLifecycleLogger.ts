import { world } from "@minecraft/server";
import { ActionType } from "../types/types";
import type { PlayerActionLogManger } from "./PlayerActionLogManager";
import type {
  EntityDeathDetails,
  // EntitySpawnDetails,
} from "./types/EntityPlayerStateTypes";

/**
 * エンティティのライフサイクル（スポーン、死亡）を記録するロガー
 */
export class EntityLifecycleLogger {
  private readonly playerActionLogManger: PlayerActionLogManger;

  constructor(playerActionLogManger: PlayerActionLogManger) {
    this.playerActionLogManger = playerActionLogManger;
    this.subscribeToEvents();
  }

  /**
   * イベントの購読を開始
   */
  private subscribeToEvents(): void {
    // エンティティスポーンイベントの購読
    // world.afterEvents.entitySpawn.subscribe((event) => {
    //   const entity = event.entity;

    // プレイヤーエンティティは除外
    //   if (entity.typeId === "minecraft:player") {
    //     return;
    //   }

    //   const details: EntitySpawnDetails = {
    //     entityId: entity.id,
    //     entityType: entity.typeId,
    //     location: {
    //       x: entity.location.x,
    //       y: entity.location.y,
    //       z: entity.location.z,
    //     },
    //     dimension: entity.dimension.id,
    //   };

    //   this.playerActionLogManger.logAction(entity.id, ActionType.ENTITY_SPAWN, details);
    // });

    // エンティティ死亡イベントの購読
    world.afterEvents.entityDie.subscribe((event) => {
      const entity = event.deadEntity;

      // プレイヤーエンティティは除外
      if (entity.typeId === "minecraft:player") {
        return;
      }

      const details: EntityDeathDetails = {
        entityId: entity.id,
        entityType: entity.typeId,
        location: {
          x: entity.location.x,
          y: entity.location.y,
          z: entity.location.z,
        },
        dimension: entity.dimension.id,
        cause: event.damageSource?.cause,
        killerEntityId: event.damageSource?.damagingEntity?.id ?? null,
        killerEntityType: event.damageSource?.damagingEntity?.typeId ?? null,
      };

      this.playerActionLogManger.logAction(
        entity.id,
        ActionType.ENTITY_DEATH,
        details,
      );
    });
  }

  /**
   * ロガーの終了処理
   */
  dispose(): void {
    // 現在のAPIバージョンではunsubscribeは不要
    // 将来的にunsubscribeが必要になった場合のために、メソッドは用意しておく
  }
}
