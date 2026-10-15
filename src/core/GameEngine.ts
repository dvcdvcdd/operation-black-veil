import * as THREE from 'three';
import { StateManager } from './StateManager';
import { FirstPersonCamera } from '../player/FirstPersonCamera';
import { PlayerController } from '../player/PlayerController';
import { CollisionWorld } from '../level/CollisionWorld';
import { SectorLevel } from '../level/SectorLevel';
import { WeaponSystem } from '../combat/WeaponSystem';
import { WeaponView } from '../combat/WeaponView';
import { HealthSystem } from '../combat/HealthSystem';
import { EnemyManager } from '../enemies/EnemyManager';
import { MissionSystem } from '../mission/MissionSystem';
import { SettingsManager } from '../systems/SettingsManager';
import { SoundManager } from '../systems/SoundManager';
import { AssetLoader } from '../systems/AssetLoader';
import { GameSettings } from '../types/game';

export class GameEngine {
  public readonly scene: THREE.Scene;
  public readonly renderer: THREE.WebGLRenderer;
  public readonly fpCamera: FirstPersonCamera;
  public readonly stateManager: StateManager;
  public readonly collisionWorld: CollisionWorld;
  public readonly level: SectorLevel;
  public readonly playerController: PlayerController;
  public readonly weaponSystem: WeaponSystem;
  public readonly weaponView: WeaponView;
  public readonly playerHealth: HealthSystem;
  public readonly enemyManager: EnemyManager;
  public readonly missionSystem: MissionSystem;
  public readonly settingsManager: SettingsManager;
  public readonly soundManager: SoundManager;

  private readonly clock: THREE.Clock = new THREE.Clock();
  private readonly raycaster: THREE.Raycaster = new THREE.Raycaster();
  private isInitialized: boolean = false;
  private damageFlashAlpha: number = 0;
  private hitmarkerTimer: number = 0;

  private hudAmmoEl: HTMLElement | null;
  private hudHealthEl: HTMLElement | null;
  private hudObjectiveEl: HTMLElement | null;
  private hudHostilesEl: HTMLElement | null;
  private interactPromptEl: HTMLElement | null;
  private damageOverlayEl: HTMLElement | null;
  private crosshairEl: HTMLElement | null;
  private hitmarkerEl: HTMLElement | null;

  constructor(container: HTMLElement) {
    this.stateManager = new StateManager();
    this.settingsManager = new SettingsManager();
    const initialSettings = this.settingsManager.getSettings();
    this.soundManager = new SoundManager(initialSettings.masterVolume);

    this.hudAmmoEl = document.getElementById('hud-ammo');
    this.hudHealthEl = document.getElementById('hud-health');
    this.hudObjectiveEl = document.getElementById('objective-text');
    this.hudHostilesEl = document.getElementById('hud-hostiles');
    this.interactPromptEl = document.getElementById('interact-prompt');
    this.damageOverlayEl = document.getElementById('damage-overlay');
    this.crosshairEl = document.querySelector('.crosshair');
    this.hitmarkerEl = document.getElementById('hitmarker');

    // 1. Setup Scene Atmosferik
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090c10);
    this.scene.fog = new THREE.FogExp2(0x090c10, 0.026);

    // 2. Setup Kamera First-Person
    this.fpCamera = new FirstPersonCamera(window.innerWidth / window.innerHeight);
    this.fpCamera.setSensitivity(initialSettings.mouseSensitivity);
    this.scene.add(this.fpCamera.camera);

    // 3. Setup WebGL Renderer dengan ACES Filmic Tone Mapping
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. Bangun Level Sector 9 & Sistem Collision
    this.collisionWorld = new CollisionWorld();
    this.level = new SectorLevel(this.scene, this.collisionWorld);
    this.level.build();

    // Muat aset GLTF untuk Black-Box Core
    const assetLoader = new AssetLoader();
    assetLoader.loadTacticalArtifactModel().then((model) => {
      this.level.attachArtifactModel(model);
    });

    // 5. Inisialisasi Sistem Pemain, Senjata, Musuh, & Misi
    this.playerController = new PlayerController(this.fpCamera, this.collisionWorld);
    this.weaponSystem = new WeaponSystem();
    this.weaponView = new WeaponView(this.fpCamera.camera);
    this.playerHealth = new HealthSystem(100);
    this.enemyManager = new EnemyManager(this.scene, this.collisionWorld);
    this.enemyManager.spawnSquad();
    this.missionSystem = new MissionSystem();

    this.applySettings(initialSettings);
    this.settingsManager.onChange((newSettings) => this.applySettings(newSettings));

    this.bindEvents();
    this.syncHud();
    this.isInitialized = true;
  }

  private applySettings(settings: GameSettings): void {
    this.fpCamera.setSensitivity(settings.mouseSensitivity);
    this.soundManager.setVolume(settings.masterVolume);

    if (settings.quality === 'LOW') {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
      this.level.moonLight.castShadow = false;
    } else if (settings.quality === 'MEDIUM') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.shadowMap.enabled = true;
      this.level.moonLight.castShadow = true;
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.level.moonLight.castShadow = true;
    }
    this.renderer.shadowMap.needsUpdate = true;
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => {
      this.fpCamera.updateAspect(window.innerWidth / window.innerHeight);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    document.addEventListener('mousemove', (e: MouseEvent) => {
      const isPlaying = this.stateManager.getState() === 'PLAYING';
      this.fpCamera.handleMouseMove(e.movementX, e.movementY, isPlaying);
    });

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.stateManager.getState() !== 'PLAYING') return;
      this.playerController.handleKeyDown(e.code);

      if (e.code === 'KeyR') {
        this.attemptReload();
      } else if (e.code === 'KeyE') {
        this.attemptInteract();
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.playerController.handleKeyUp(e.code);
    });

    window.addEventListener('pointerdown', (e: PointerEvent) => {
      if (this.stateManager.getState() !== 'PLAYING') return;

      // Jangan tembak jika pengguna mengklik tombol menu UI
      const target = e.target as HTMLElement | null;
      if (target && target.closest('.overlay')) return;

      if (document.pointerLockElement !== this.renderer.domElement) {
        this.renderer.domElement.requestPointerLock?.();
      }

      if (e.button === 0) {
        this.weaponSystem.setTriggerHeld(true);
        this.attemptFire();
      } else if (e.button === 2) {
        this.weaponSystem.setAiming(true);
        this.fpCamera.camera.fov = 55;
        this.fpCamera.camera.updateProjectionMatrix();
        this.crosshairEl?.classList.add('aiming');
      }
    });

    window.addEventListener('pointerup', (e: PointerEvent) => {
      if (e.button === 0) {
        this.weaponSystem.setTriggerHeld(false);
      } else if (e.button === 2) {
        this.weaponSystem.setAiming(false);
        this.fpCamera.camera.fov = 75;
        this.fpCamera.camera.updateProjectionMatrix();
        this.crosshairEl?.classList.remove('aiming');
      }
    });

    window.addEventListener('blur', () => {
      this.weaponSystem.setTriggerHeld(false);
      this.playerController.clearKeys();
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    this.stateManager.onChange((newState) => {
      if (newState === 'PLAYING') {
        this.soundManager.startAmbience();
      } else {
        this.playerController.clearKeys();
        this.weaponSystem.setTriggerHeld(false);
        this.weaponSystem.setAiming(false);
        if (document.pointerLockElement) {
          document.exitPointerLock?.();
        }
      }
    });
  }

  public attemptFire(): boolean {
    if (!this.weaponSystem.fire()) {
      if (this.weaponSystem.getState().currentAmmo === 0) {
        this.attemptReload();
      }
      return false;
    }

    this.soundManager.playGunshot();

    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.fpCamera.camera);
    const allTargets = [
      ...this.enemyManager.getHitboxes(),
      ...this.collisionWorld.getRaycastTargets()
    ];
    const hits = this.raycaster.intersectObjects(allTargets, false);

    let hitPoint: THREE.Vector3 | undefined;
    let hitNormal: THREE.Vector3 | undefined;

    if (hits.length > 0) {
      hitPoint = hits[0].point;
      hitNormal = hits[0].face ? hits[0].face.normal : undefined;
      const hitEnemy = this.enemyManager.processBulletHit(hits[0].object, 34);
      if (hitEnemy) {
        const isHead = Boolean(hits[0].object.userData?.isHead);
        this.soundManager.playHitmarker(isHead);
        this.showHitmarker();
      }
    }

    this.weaponView.triggerFireVisuals(this.scene, hitPoint, hitNormal);

    const isAiming = this.weaponSystem.getState().isAiming;
    const pitchKick = isAiming ? 0.012 : 0.022;
    const yawKick = (Math.random() - 0.5) * (isAiming ? 0.008 : 0.016);
    this.fpCamera.applyRecoil(pitchKick, yawKick);

    this.syncHud();
    return true;
  }

  private showHitmarker(): void {
    this.hitmarkerTimer = 0.12;
    this.hitmarkerEl?.classList.remove('hidden');
  }

  public attemptReload(): boolean {
    const started = this.weaponSystem.startReload();
    if (started) {
      this.soundManager.playReload();
      this.syncHud();
    }
    return started;
  }

  public attemptInteract(): boolean {
    const pos = this.playerController.getPosition();
    const ok = this.missionSystem.interactWithTerminal(pos);
    if (ok) {
      this.soundManager.playObjectiveChime();
      if (this.level.artifactObject) {
        this.level.artifactObject.visible = false; // Black-box berhasil diambil
      }
      this.syncHud();
    }
    return ok;
  }

  public applyPlayerDamage(amount: number): void {
    if (this.stateManager.getState() !== 'PLAYING') return;
    this.playerHealth.takeDamage(amount);
    this.soundManager.playPlayerHurt();
    this.damageFlashAlpha = 0.85;
    if (this.damageOverlayEl) {
      this.damageOverlayEl.style.opacity = String(this.damageFlashAlpha);
    }
    this.syncHud();

    if (this.playerHealth.isDead()) {
      this.stateManager.setState('DEFEAT');
    }
  }

  public restartMission(): void {
    this.playerHealth.reset();
    this.playerController.reset();
    this.weaponSystem.reset();
    this.enemyManager.resetAll();
    this.missionSystem.reset();
    if (this.level.artifactObject) {
      this.level.artifactObject.visible = true;
    }
    this.damageFlashAlpha = 0;
    if (this.damageOverlayEl) this.damageOverlayEl.style.opacity = '0';
    this.syncHud();
    this.stateManager.setState('PLAYING');
  }

  private syncHud(): void {
    const ws = this.weaponSystem.getState();
    if (this.hudAmmoEl) {
      this.hudAmmoEl.textContent = ws.isReloading
        ? 'RELOADING...'
        : `${ws.currentAmmo} / ${ws.reserveAmmo}`;
    }
    if (this.hudHealthEl) {
      this.hudHealthEl.textContent = String(this.playerHealth.getHealth());
    }
    if (this.hudHostilesEl) {
      this.hudHostilesEl.textContent = String(this.enemyManager.getAliveCount());
    }
    if (this.hudObjectiveEl) {
      this.hudObjectiveEl.textContent = this.missionSystem.getProgress().description;
    }
  }

  public start(): void {
    this.clock.start();
    this.renderer.setAnimationLoop(() => {
      const dt = Math.min(this.clock.getDelta(), 0.1);
      this.level.updateAnimations(dt);

      if (this.stateManager.getState() === 'PLAYING') {
        const wasReloading = this.weaponSystem.getState().isReloading;
        const prevObj = this.missionSystem.getProgress().currentObjective;

        this.playerController.update(dt);
        this.weaponSystem.update(dt);

        if (this.weaponSystem.shouldAutoFire()) {
          this.attemptFire();
        }

        if (this.hitmarkerTimer > 0) {
          this.hitmarkerTimer -= dt;
          if (this.hitmarkerTimer <= 0) {
            this.hitmarkerEl?.classList.add('hidden');
          }
        }

        const incomingDamage = this.enemyManager.update(dt, this.fpCamera.camera.position);
        if (incomingDamage > 0) {
          this.applyPlayerDamage(incomingDamage);
        }

        if (this.damageFlashAlpha > 0) {
          this.damageFlashAlpha = Math.max(0, this.damageFlashAlpha - dt * 2.2);
          if (this.damageOverlayEl) {
            this.damageOverlayEl.style.opacity = String(this.damageFlashAlpha);
          }
        }

        const playerPos = this.playerController.getPosition();
        const missionWon = this.missionSystem.update(dt, playerPos);
        const nextObj = this.missionSystem.getProgress().currentObjective;

        if (prevObj !== nextObj) {
          this.soundManager.playObjectiveChime();
        }

        const canInteract = this.missionSystem.canInteractWithTerminal(playerPos);
        this.interactPromptEl?.classList.toggle('hidden', !canInteract);

        if (missionWon) {
          this.soundManager.playObjectiveChime();
          this.syncHud();
          this.stateManager.setState('VICTORY');
        }

        const ws = this.weaponSystem.getState();
        if (wasReloading && !ws.isReloading) {
          this.syncHud();
        }
        this.syncHud();

        this.weaponView.update(
          dt,
          ws.isAiming,
          ws.isReloading,
          this.playerController.getHeadBobOffset(),
          this.scene
        );
      }

      this.renderer.render(this.scene, this.fpCamera.camera);
    });
  }

  public isReady(): boolean {
    return this.isInitialized;
  }
}