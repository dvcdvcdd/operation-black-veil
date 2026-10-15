import * as THREE from 'three';
import { EnemyAgent, Vec2D } from './EnemyAgent';
import { CollisionWorld } from '../level/CollisionWorld';
import { EnemyArchetype } from '../types/game';

interface EnemyVisual {
  agent: EnemyAgent;
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  headMesh: THREE.Mesh;
  visorMesh: THREE.Mesh;
  hitFlashTimer: number;
}

export class EnemyManager {
  private scene: THREE.Scene;
  private collisionWorld: CollisionWorld;
  private enemies: EnemyVisual[] = [];
  private losRaycaster: THREE.Raycaster = new THREE.Raycaster();

  constructor(scene: THREE.Scene, collisionWorld: CollisionWorld) {
    this.scene = scene;
    this.collisionWorld = collisionWorld;
  }

  public spawnSquad(): void {
    this.clearAll();

    // 1. Guard Luar (Menjaga Gerbang Masuk Sector 9)
    this.addEnemy('guard-courtyard', 'GUARD', { x: -4, z: 3 }, [
      { x: -5, z: 3 },
      { x: 5, z: 3 }
    ]);

    // 2. Rusher Aula Depan (Menyergap begitu pemain masuk pintu)
    this.addEnemy('rusher-hall-1', 'RUSHER', { x: 4, z: -8 }, [
      { x: 4, z: -8 },
      { x: -4, z: -11 }
    ]);

    // 3. Guard Terminal Data (Menjaga Server di Z = -14)
    this.addEnemy('guard-server', 'GUARD', { x: -6, z: -16 }, [
      { x: -7, z: -16 },
      { x: 7, z: -16 }
    ]);

    // 4. Rusher & Guard Koridor Ekstraksi (Menjaga bagian belakang Z = -24 s/d -30)
    this.addEnemy('rusher-extract', 'RUSHER', { x: -4, z: -23 }, [
      { x: -4, z: -23 },
      { x: 4, z: -23 }
    ]);
    this.addEnemy('guard-extract', 'GUARD', { x: 0, z: -29 }, [
      { x: -5, z: -29 },
      { x: 5, z: -29 }
    ]);
  }

  private addEnemy(id: string, archetype: EnemyArchetype, spawn: Vec2D, patrol: Vec2D[]): void {
    const agent = new EnemyAgent(id, archetype, spawn, patrol);
    const group = new THREE.Group();

    const armorColor = archetype === 'GUARD' ? 0x2a323d : 0x3d2525;
    const visorColor = archetype === 'GUARD' ? 0xff9900 : 0xff1133;

    const armorMat = new THREE.MeshStandardMaterial({
      color: armorColor,
      roughness: 0.5,
      metalness: 0.4
    });
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x1a1d24,
      roughness: 0.4
    });
    const visorMat = new THREE.MeshBasicMaterial({ color: visorColor });

    // Torso
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.25, 0.4), armorMat);
    bodyMesh.position.y = 0.625;
    bodyMesh.castShadow = true;
    bodyMesh.userData = { enemyId: id, isHead: false };
    group.add(bodyMesh);

    // Helmet / Head
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), headMat);
    headMesh.position.y = 1.45;
    headMesh.castShadow = true;
    headMesh.userData = { enemyId: id, isHead: true };
    group.add(headMesh);

    // Tactical Glowing Visor
    const visorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.05), visorMat);
    visorMesh.position.set(0, 1.46, 0.17);
    group.add(visorMesh);

    group.position.set(spawn.x, 0, spawn.z);
    this.scene.add(group);

    this.enemies.push({
      agent,
      group,
      bodyMesh,
      headMesh,
      visorMesh,
      hitFlashTimer: 0
    });
  }

  public getHitboxes(): THREE.Object3D[] {
    const boxes: THREE.Object3D[] = [];
    for (const e of this.enemies) {
      if (e.agent.state !== 'DEAD') {
        boxes.push(e.bodyMesh, e.headMesh);
      }
    }
    return boxes;
  }

  public processBulletHit(hitObject: THREE.Object3D, baseDamage: number): boolean {
    const enemyId = hitObject.userData?.enemyId;
    if (!enemyId) return false;

    const target = this.enemies.find((e) => e.agent.id === enemyId);
    if (!target || target.agent.state === 'DEAD') return false;

    const finalDamage = hitObject.userData?.isHead ? baseDamage * 2.0 : baseDamage;
    const died = target.agent.receiveDamage(finalDamage);
    target.hitFlashTimer = 0.1;
    (target.bodyMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xff3300);

    if (died) {
      // Animasi roboh saat mati
      target.group.rotation.x = -Math.PI / 2;
      target.group.position.y = 0.2;
      (target.visorMesh.material as THREE.MeshBasicMaterial).color.setHex(0x222222);
    }

    return true;
  }

  public update(dt: number, playerPos3D: THREE.Vector3): number {
    let totalPlayerDamage = 0;
    const player2D: Vec2D = { x: playerPos3D.x, z: playerPos3D.z };

    for (const e of this.enemies) {
      if (e.hitFlashTimer > 0) {
        e.hitFlashTimer -= dt;
        if (e.hitFlashTimer <= 0) {
          (e.bodyMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
        }
      }

      if (e.agent.state === 'DEAD') continue;

      const hasLOS = this.checkLineOfSight(e.agent.position, playerPos3D);
      const dmg = e.agent.update(
        dt,
        player2D,
        hasLOS,
        (x, z) => this.collisionWorld.isPointBlocked(x, z, 0.45)
      );

      totalPlayerDamage += dmg;

      e.group.position.set(e.agent.position.x, 0, e.agent.position.z);
      e.group.rotation.y = e.agent.yaw;
    }

    return totalPlayerDamage;
  }

  private checkLineOfSight(enemyPos: Vec2D, playerPos3D: THREE.Vector3): boolean {
    const origin = new THREE.Vector3(enemyPos.x, 1.4, enemyPos.z);
    const target = new THREE.Vector3(playerPos3D.x, 1.4, playerPos3D.z);
    const dir = target.clone().sub(origin);
    const dist = dir.length();
    if (dist <= 0.1) return true;

    dir.normalize();
    this.losRaycaster.set(origin, dir);
    this.losRaycaster.far = dist;

    const hits = this.losRaycaster.intersectObjects(this.collisionWorld.getRaycastTargets(), false);
    return hits.length === 0;
  }

  public getAliveCount(): number {
    return this.enemies.filter((e) => e.agent.state !== 'DEAD').length;
  }

  public resetAll(): void {
    for (const e of this.enemies) {
      e.agent.reset();
      e.group.rotation.set(0, e.agent.yaw, 0);
      e.group.position.set(e.agent.position.x, 0, e.agent.position.z);
      (e.bodyMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
      const visorColor = e.agent.archetype === 'GUARD' ? 0xff9900 : 0xff1133;
      (e.visorMesh.material as THREE.MeshBasicMaterial).color.setHex(visorColor);
    }
  }

  private clearAll(): void {
    for (const e of this.enemies) {
      this.scene.remove(e.group);
    }
    this.enemies = [];
  }
}