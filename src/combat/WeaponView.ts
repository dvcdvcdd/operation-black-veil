import * as THREE from 'three';

interface ImpactFX {
  mesh: THREE.Mesh;
  ttl: number;
}

export class WeaponView {
  public readonly weaponGroup: THREE.Group;
  private muzzleFlash: THREE.Mesh;
  private muzzleLight: THREE.PointLight;
  private flashTimer: number = 0;
  private recoilOffsetZ: number = 0;
  private recoilPitch: number = 0;
  private impacts: ImpactFX[] = [];

  private readonly hipPos = new THREE.Vector3(0.24, -0.22, -0.45);
  private readonly adsPos = new THREE.Vector3(0.0, -0.155, -0.35);

  constructor(camera: THREE.Camera) {
    this.weaponGroup = new THREE.Group();

    const gunMetal = new THREE.MeshStandardMaterial({
      color: 0x181c20,
      roughness: 0.35,
      metalness: 0.85
    });
    const polymerMat = new THREE.MeshStandardMaterial({
      color: 0x101214,
      roughness: 0.75,
      metalness: 0.2
    });
    const sightAccent = new THREE.MeshBasicMaterial({ color: 0x00e5ff });

    // 1. Upper & Lower Receiver
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.38), gunMetal);
    this.weaponGroup.add(receiver);

    // 2. Barrel & Handguard
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 8), gunMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.01, -0.30);
    this.weaponGroup.add(barrel);

    // 3. Holographic Sight
    const opticFrame = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.045, 0.07), polymerMat);
    opticFrame.position.set(0, 0.06, -0.05);
    this.weaponGroup.add(opticFrame);

    const reticleDot = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.006, 0.002), sightAccent);
    reticleDot.position.set(0, 0.062, -0.05);
    this.weaponGroup.add(reticleDot);

    // 4. Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.14, 0.065), polymerMat);
    mag.position.set(0, -0.09, -0.06);
    mag.rotation.x = 0.18;
    this.weaponGroup.add(mag);

    // 5. Muzzle Flash & Light
    const flashGeo = new THREE.ConeGeometry(0.045, 0.14, 6);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffbb33, transparent: true, opacity: 0.9 });
    this.muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleFlash.rotation.x = -Math.PI / 2;
    this.muzzleFlash.position.set(0, 0.01, -0.49);
    this.muzzleFlash.visible = false;
    this.weaponGroup.add(this.muzzleFlash);

    this.muzzleLight = new THREE.PointLight(0xffaa22, 0, 6);
    this.muzzleLight.position.set(0, 0.01, -0.5);
    this.weaponGroup.add(this.muzzleLight);

    this.weaponGroup.position.copy(this.hipPos);
    camera.add(this.weaponGroup);
  }

  public triggerFireVisuals(scene: THREE.Scene, hitPoint?: THREE.Vector3, hitNormal?: THREE.Vector3): void {
    this.flashTimer = 0.045;
    this.muzzleFlash.visible = true;
    this.muzzleFlash.rotation.z = Math.random() * Math.PI;
    this.muzzleLight.intensity = 4;

    // Kickback visual senjata
    this.recoilOffsetZ = 0.055;
    this.recoilPitch = 0.06;

    // Buat penanda titik tembak / percikan di dinding
    if (hitPoint && hitNormal) {
      const impactGeo = new THREE.SphereGeometry(0.045, 6, 6);
      const impactMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
      const impactMesh = new THREE.Mesh(impactGeo, impactMat);
      impactMesh.position.copy(hitPoint).addScaledVector(hitNormal, 0.02);
      scene.add(impactMesh);
      this.impacts.push({ mesh: impactMesh, ttl: 1.5 });
    }
  }

  public update(dt: number, isAiming: boolean, isReloading: boolean, headBobOffset: number, scene: THREE.Scene): void {
    // 1. Transisi mulus Hip-Fire vs Aim Down Sights (ADS)
    const targetPos = isAiming ? this.adsPos : this.hipPos;
    this.weaponGroup.position.lerp(targetPos, Math.min(1, dt * 14));

    // 2. Efek Reload (senjata miring ke bawah saat isi peluru)
    const reloadTilt = isReloading ? -0.45 : 0;

    // 3. Pemulihan Recoil & Head-Bobbing
    this.recoilOffsetZ = THREE.MathUtils.lerp(this.recoilOffsetZ, 0, Math.min(1, dt * 16));
    this.recoilPitch = THREE.MathUtils.lerp(this.recoilPitch, 0, Math.min(1, dt * 16));

    this.weaponGroup.position.z += this.recoilOffsetZ;
    this.weaponGroup.position.y += headBobOffset * (isAiming ? 0.25 : 1);
    this.weaponGroup.rotation.x = this.recoilPitch + reloadTilt;

    // 4. Timer Muzzle Flash
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.muzzleFlash.visible = false;
        this.muzzleLight.intensity = 0;
      }
    }

    // 5. Bersihkan partikel titik tembak
    for (let i = this.impacts.length - 1; i >= 0; i--) {
      this.impacts[i].ttl -= dt;
      if (this.impacts[i].ttl <= 0) {
        scene.remove(this.impacts[i].mesh);
        this.impacts[i].mesh.geometry.dispose();
        this.impacts.splice(i, 1);
      }
    }
  }
}