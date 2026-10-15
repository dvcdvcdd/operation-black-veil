import * as THREE from 'three';
import { CollisionWorld } from './CollisionWorld';
import { AssetLoader } from '../systems/AssetLoader';

export class SectorLevel {
  private scene: THREE.Scene;
  private collisionWorld: CollisionWorld;
  public moonLight!: THREE.DirectionalLight;
  public artifactObject: THREE.Object3D | null = null;

  constructor(scene: THREE.Scene, collisionWorld: CollisionWorld) {
    this.scene = scene;
    this.collisionWorld = collisionWorld;
  }

  public build(): void {
    // 1. Pencahayaan Atmosferik Militer
    const ambient = new THREE.AmbientLight(0x2b3648, 0.8);
    this.scene.add(ambient);

    this.moonLight = new THREE.DirectionalLight(0x88bbff, 1.35);
    this.moonLight.position.set(18, 35, 22);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.set(2048, 2048);
    this.moonLight.shadow.camera.near = 0.5;
    this.moonLight.shadow.camera.far = 90;
    const d = 35;
    this.moonLight.shadow.camera.left = -d;
    this.moonLight.shadow.camera.right = d;
    this.moonLight.shadow.camera.top = d;
    this.moonLight.shadow.camera.bottom = -d;
    this.scene.add(this.moonLight);

    // Lampu aksen interior (Merah darurat & Cyan ruang server)
    const emergencyLight = new THREE.PointLight(0xff3300, 3.8, 18);
    emergencyLight.position.set(0, 4.2, -5);
    this.scene.add(emergencyLight);

    const serverLight = new THREE.PointLight(0x00e5ff, 3.5, 22);
    serverLight.position.set(0, 4.2, -15);
    this.scene.add(serverLight);

    const extractLight = new THREE.PointLight(0x00ff88, 3.0, 16);
    extractLight.position.set(0, 3.8, -30.5);
    this.scene.add(extractLight);

    // Material Bertekstur Prosedural Industrial
    const floorTex = AssetLoader.createIndustrialTexture('#181d24', '#232b36', 25, 35);
    const wallTex = AssetLoader.createIndustrialTexture('#252c36', '#1b2028', 12, 3);
    const crateTex = AssetLoader.createIndustrialTexture('#384657', '#26303d', 2, 2);

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.82,
      metalness: 0.18
    });

    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.72,
      metalness: 0.28
    });

    const crateMat = new THREE.MeshStandardMaterial({
      map: crateTex,
      roughness: 0.5,
      metalness: 0.45
    });

    // 2. Lantai Utama
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 70), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -10);
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.collisionWorld.getRaycastTargets().push(floor);

    // 3. Dinding Perimeter Luar (Exterior Courtyard: Z = +18 s/d -2)
    this.addWall(0, 2.5, 18, 26, 5, 1, wallMat);
    this.addWall(-13, 2.5, 8, 1, 5, 20, wallMat);
    this.addWall(13, 2.5, 8, 1, 5, 20, wallMat);

    // Dinding Sekat Fasilitas dengan Pintu Masuk di Tengah (Z = -2)
    this.addWall(-8, 2.5, -2, 10, 5, 1.2, wallMat);
    this.addWall(8, 2.5, -2, 10, 5, 1.2, wallMat);
    this.addWall(0, 4.2, -2, 6, 1.6, 1.2, wallMat);

    // 4. Interior Fasilitas Riset (Z = -2 s/d -34)
    this.addWall(-13, 2.5, -18, 1, 5, 32, wallMat);
    this.addWall(13, 2.5, -18, 1, 5, 32, wallMat);
    this.addWall(0, 2.5, -34, 26, 5, 1, wallMat);

    // Atap Interior Fasilitas
    const roof = new THREE.Mesh(new THREE.BoxGeometry(26, 0.6, 32), wallMat);
    roof.position.set(0, 5.1, -18);
    roof.receiveShadow = true;
    this.scene.add(roof);

    // 5. Pilar & Kotak Pelindung Taktis
    this.addCrate(-4, 0.8, 9, 2, 1.6, 2, crateMat);
    this.addCrate(4.5, 0.8, 6, 2.4, 1.6, 1.8, crateMat);

    this.addWall(-5.5, 2.5, -10, 1.6, 5, 1.6, wallMat);
    this.addWall(5.5, 2.5, -10, 1.6, 5, 1.6, wallMat);
    this.addWall(-5.5, 2.5, -20, 1.6, 5, 1.6, wallMat);
    this.addWall(5.5, 2.5, -20, 1.6, 5, 1.6, wallMat);

    this.addCrate(0, 0.75, -14, 3.5, 1.5, 1.2, crateMat);
    this.addCrate(-3, 0.75, -25, 2.2, 1.5, 2.2, crateMat);
    this.addCrate(3, 0.75, -25, 2.2, 1.5, 2.2, crateMat);

    // 6. Objektif 2: Terminal Data Rahasia
    const terminalMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const terminalScreen = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.12), terminalMat);
    terminalScreen.position.set(0, 1.8, -13.8);
    this.scene.add(terminalScreen);

    // 7. Objektif 3: Beacon Zona Ekstraksi (Z = -30.5)
    const beaconGeo = new THREE.RingGeometry(1.8, 2.2, 32);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      side: THREE.DoubleSide
    });
    const extractionRing = new THREE.Mesh(beaconGeo, beaconMat);
    extractionRing.rotation.x = -Math.PI / 2;
    extractionRing.position.set(0, 0.03, -30.5);
    this.scene.add(extractionRing);
  }

  public attachArtifactModel(model: THREE.Object3D): void {
    model.position.set(0, 2.25, -13.8);
    this.scene.add(model);
    this.artifactObject = model;
  }

  public updateAnimations(dt: number): void {
    if (this.artifactObject) {
      this.artifactObject.rotation.y += dt * 1.8;
    }
  }

  private addWall(x: number, y: number, z: number, w: number, h: number, d: number, mat: THREE.Material): void {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.collisionWorld.addStaticMesh(mesh, true);
  }

  private addCrate(x: number, y: number, z: number, w: number, h: number, d: number, mat: THREE.Material): void {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.collisionWorld.addStaticMesh(mesh, true);
  }
}