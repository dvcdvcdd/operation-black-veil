import { EnemyArchetype, EnemyState } from '../types/game';
import { HealthSystem } from '../combat/HealthSystem';

export interface Vec2D {
  x: number;
  z: number;
}

export class EnemyAgent {
  public readonly id: string;
  public readonly archetype: EnemyArchetype;
  public readonly health: HealthSystem;
  public state: EnemyState = 'PATROL';
  public position: Vec2D;
  public yaw: number = 0;

  private readonly spawnPoint: Vec2D;
  private readonly patrolPoints: Vec2D[];
  private currentPatrolIndex: number = 0;

  private readonly moveSpeed: number;
  private readonly detectionRange: number;
  private readonly attackRange: number;
  private readonly attackDamage: number;
  private readonly attackInterval: number;

  private detectTimer: number = 0;
  private attackCooldown: number = 0;

  constructor(
    id: string,
    archetype: EnemyArchetype,
    spawnPoint: Vec2D,
    patrolPoints: Vec2D[]
  ) {
    this.id = id;
    this.archetype = archetype;
    this.spawnPoint = { ...spawnPoint };
    this.position = { ...spawnPoint };
    this.patrolPoints = patrolPoints.length > 0 ? patrolPoints : [{ ...spawnPoint }];

    if (archetype === 'GUARD') {
      this.health = new HealthSystem(100);
      this.moveSpeed = 3.0;
      this.detectionRange = 22;
      this.attackRange = 13;
      this.attackDamage = 12;
      this.attackInterval = 1.25;
    } else {
      // RUSHER: Lebih cepat dan agresif mendekat
      this.health = new HealthSystem(75);
      this.moveSpeed = 5.2;
      this.detectionRange = 20;
      this.attackRange = 3.2;
      this.attackDamage = 18;
      this.attackInterval = 0.85;
    }
  }

  public receiveDamage(amount: number): boolean {
    if (this.state === 'DEAD') return false;
    this.health.takeDamage(amount);
    if (this.health.isDead()) {
      this.state = 'DEAD';
      return true;
    }
    // Jika tertembak saat patroli, langsung waspada & mengejar pemain
    if (this.state === 'PATROL' || this.state === 'DETECT') {
      this.state = 'PURSUE';
    }
    return false;
  }

  /**
   * Mengembalikan jumlah damage ke pemain jika musuh menembak/menyerang pada frame ini
   */
  public update(
    dt: number,
    playerPos: Vec2D,
    hasLineOfSight: boolean,
    isBlockedAt: (x: number, z: number) => boolean
  ): number {
    if (this.state === 'DEAD') return 0;

    if (this.attackCooldown > 0) {
      this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    }

    const distToPlayer = Math.hypot(playerPos.x - this.position.x, playerPos.z - this.position.z);
    const canSeePlayer = distToPlayer <= this.detectionRange && hasLineOfSight;

    switch (this.state) {
      case 'PATROL': {
        if (canSeePlayer) {
          this.state = 'DETECT';
          this.detectTimer = 0.25; // Waktu reaksi singkat sebelum mengejar
          break;
        }
        const target = this.patrolPoints[this.currentPatrolIndex];
        const distToTarget = Math.hypot(target.x - this.position.x, target.z - this.position.z);
        if (distToTarget < 0.6) {
          this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        } else {
          this.steerTowards(target, this.moveSpeed * 0.65, dt, isBlockedAt);
        }
        break;
      }

      case 'DETECT': {
        this.faceTarget(playerPos);
        this.detectTimer -= dt;
        if (this.detectTimer <= 0) {
          this.state = canSeePlayer ? 'PURSUE' : 'PATROL';
        }
        break;
      }

      case 'PURSUE': {
        if (distToPlayer <= this.attackRange && hasLineOfSight) {
          this.state = 'ATTACK';
          break;
        }
        if (distToPlayer > this.detectionRange * 1.4) {
          this.state = 'PATROL';
          break;
        }
        this.steerTowards(playerPos, this.moveSpeed, dt, isBlockedAt);
        break;
      }

      case 'ATTACK': {
        this.faceTarget(playerPos);
        if (distToPlayer > this.attackRange * 1.15 || !hasLineOfSight) {
          this.state = 'PURSUE';
          break;
        }
        if (this.attackCooldown <= 0) {
          this.attackCooldown = this.attackInterval;
          return this.attackDamage;
        }
        break;
      }
    }

    return 0;
  }

  private steerTowards(
    target: Vec2D,
    speed: number,
    dt: number,
    isBlockedAt: (x: number, z: number) => boolean
  ): void {
    const baseAngle = Math.atan2(target.x - this.position.x, target.z - this.position.z);
    // Coba sudut lurus dulu, lalu belok kiri/kanan bertahap jika terhalang tembok/kotak
    const candidateOffsets = [0, 0.55, -0.55, 1.1, -1.1];

    for (const offset of candidateOffsets) {
      const angle = baseAngle + offset;
      const stepX = Math.sin(angle) * speed * dt;
      const stepZ = Math.cos(angle) * speed * dt;
      const lookAheadX = this.position.x + Math.sin(angle) * 0.75;
      const lookAheadZ = this.position.z + Math.cos(angle) * 0.75;

      if (!isBlockedAt(lookAheadX, lookAheadZ)) {
        this.position.x += stepX;
        this.position.z += stepZ;
        this.yaw = angle;
        return;
      }
    }
  }

  private faceTarget(target: Vec2D): void {
    this.yaw = Math.atan2(target.x - this.position.x, target.z - this.position.z);
  }

  public reset(): void {
    this.health.reset();
    this.state = 'PATROL';
    this.position = { ...this.spawnPoint };
    this.currentPatrolIndex = 0;
    this.attackCooldown = 0;
  }
}