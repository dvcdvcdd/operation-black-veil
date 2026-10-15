import * as THREE from 'three';

export class CollisionWorld {
  private colliders: THREE.Box3[] = [];
  private interactableMeshes: THREE.Object3D[] = [];

  public addStaticMesh(mesh: THREE.Mesh, registerRaycast: boolean = true): void {
    mesh.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(mesh);
    this.colliders.push(box);
    if (registerRaycast) {
      this.interactableMeshes.push(mesh);
    }
  }

  public getRaycastTargets(): THREE.Object3D[] {
    return this.interactableMeshes;
  }

  /**
   * Mengoreksi posisi horizontal (X, Z) pemain jika menabrak objek AABB
   */
  public resolveHorizontalCollision(position: THREE.Vector3, radius: number, height: number): void {
    const playerMinY = position.y - height + 0.15;
    const playerMaxY = position.y + 0.1;

    for (const box of this.colliders) {
      if (playerMaxY < box.min.y || playerMinY > box.max.y) continue;

      const closestX = Math.max(box.min.x, Math.min(position.x, box.max.x));
      const closestZ = Math.max(box.min.z, Math.min(position.z, box.max.z));

      const dx = position.x - closestX;
      const dz = position.z - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const overlap = radius - dist;
          position.x += (dx / dist) * overlap;
          position.z += (dz / dist) * overlap;
        } else {
          position.z += radius;
        }
      }
    }
  }

  /**
   * Mengecek apakah koordinat (X, Z) terhalang dinding/kotak untuk navigasi AI Musuh
   */
  public isPointBlocked(x: number, z: number, radius: number = 0.45): boolean {
    for (const box of this.colliders) {
      if (box.max.y < 0.3 || box.min.y > 2.0) continue;
      const closestX = Math.max(box.min.x, Math.min(x, box.max.x));
      const closestZ = Math.max(box.min.z, Math.min(z, box.max.z));
      const dx = x - closestX;
      const dz = z - closestZ;
      if (dx * dx + dz * dz < radius * radius) {
        return true;
      }
    }
    return false;
  }
}