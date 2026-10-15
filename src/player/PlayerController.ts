import * as THREE from 'three';
import { FirstPersonCamera } from './FirstPersonCamera';
import { CollisionWorld } from '../level/CollisionWorld';

export class PlayerController {
  private fpCamera: FirstPersonCamera;
  private collisionWorld: CollisionWorld;
  private keys: Set<string> = new Set();

  private velocityY: number = 0;
  private isGrounded: boolean = true;
  private bobTimer: number = 0;

  private readonly eyeHeight: number = 1.7;
  private readonly playerRadius: number = 0.45;
  private readonly walkSpeed: number = 5.5;
  private readonly sprintSpeed: number = 8.8;
  private readonly jumpStrength: number = 6.8;
  private readonly gravity: number = 18.5;

  constructor(fpCamera: FirstPersonCamera, collisionWorld: CollisionWorld) {
    this.fpCamera = fpCamera;
    this.collisionWorld = collisionWorld;
  }

  public handleKeyDown(code: string): void {
    this.keys.add(code);
  }

  public handleKeyUp(code: string): void {
    this.keys.delete(code);
  }

  public clearKeys(): void {
    this.keys.clear();
  }

  public isMoving(): boolean {
    return (
      this.keys.has('KeyW') ||
      this.keys.has('KeyS') ||
      this.keys.has('KeyA') ||
      this.keys.has('KeyD')
    );
  }

  public isSprinting(): boolean {
    return this.isMoving() && (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'));
  }

  public update(dt: number): void {
    const cam = this.fpCamera.camera;
    const yaw = this.fpCamera.getRotationState().yaw;

    // Vektor arah relatif terhadap arah hadap kamera (Yaw)
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)).normalize();

    const moveDir = new THREE.Vector3();
    if (this.keys.has('KeyW')) moveDir.add(forward);
    if (this.keys.has('KeyS')) moveDir.sub(forward);
    if (this.keys.has('KeyD')) moveDir.add(right);
    if (this.keys.has('KeyA')) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      const speed = this.isSprinting() ? this.sprintSpeed : this.walkSpeed;
      cam.position.x += moveDir.x * speed * dt;
      cam.position.z += moveDir.z * speed * dt;

      this.bobTimer += dt * (this.isSprinting() ? 13 : 9);
    } else {
      this.bobTimer = 0;
    }

    // Lompat & Gravitasi
    if (this.keys.has('Space') && this.isGrounded) {
      this.velocityY = this.jumpStrength;
      this.isGrounded = false;
    }

    this.velocityY -= this.gravity * dt;
    cam.position.y += this.velocityY * dt;

    if (cam.position.y <= this.eyeHeight) {
      cam.position.y = this.eyeHeight;
      this.velocityY = 0;
      this.isGrounded = true;
    }

    // Koreksi Tabrakan Dinding & Kotak
    this.collisionWorld.resolveHorizontalCollision(cam.position, this.playerRadius, this.eyeHeight);
  }

  public getHeadBobOffset(): number {
    if (!this.isGrounded || this.bobTimer === 0) return 0;
    return Math.sin(this.bobTimer) * 0.018;
  }

  public getPosition(): { x: number; y: number; z: number } {
    const pos = this.fpCamera.camera.position;
    return { x: pos.x, y: pos.y, z: pos.z };
  }

  public reset(): void {
    this.clearKeys();
    this.velocityY = 0;
    this.isGrounded = true;
    this.bobTimer = 0;
    this.fpCamera.camera.position.set(0, this.eyeHeight, 12);
    this.fpCamera.camera.rotation.set(0, 0, 0, 'YXZ');
  }
}