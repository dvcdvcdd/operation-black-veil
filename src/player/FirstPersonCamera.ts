import * as THREE from 'three';

export class FirstPersonCamera {
  public readonly camera: THREE.PerspectiveCamera;
  private yaw: number = 0;
  private pitch: number = 0;
  private sensitivity: number = 0.0022;
  private readonly maxPitch: number = Math.PI / 2 - 0.08;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 150);
    this.camera.rotation.order = 'YXZ';
    this.camera.position.set(0, 1.7, 12);
  }

  public setSensitivity(sens: number): void {
    this.sensitivity = Math.max(0.0005, Math.min(0.008, sens));
  }

  public handleMouseMove(movementX: number, movementY: number, isEnabled: boolean): void {
    if (!isEnabled) return;

    this.yaw -= movementX * this.sensitivity;
    this.pitch -= movementY * this.sensitivity;
    this.clampPitch();
    this.syncRotation();
  }

  public applyRecoil(pitchKick: number, yawKick: number): void {
    this.pitch += pitchKick;
    this.yaw += yawKick;
    this.clampPitch();
    this.syncRotation();
  }

  private clampPitch(): void {
    this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.pitch));
  }

  private syncRotation(): void {
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  public getRotationState(): { yaw: number; pitch: number } {
    return { yaw: this.yaw, pitch: this.pitch };
  }

  public updateAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}