export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'DEFEAT';

export type EnemyState = 'PATROL' | 'DETECT' | 'PURSUE' | 'ATTACK' | 'DEAD';
export type EnemyArchetype = 'GUARD' | 'RUSHER';

export type ObjectiveId = 'INFILTRATE' | 'RECOVER_DATA' | 'EXTRACT';

export type QualityPreset = 'LOW' | 'MEDIUM' | 'HIGH';

export interface GameSettings {
  mouseSensitivity: number;
  masterVolume: number;
  quality: QualityPreset;
}

export interface WeaponState {
  currentAmmo: number;
  reserveAmmo: number;
  magazineSize: number;
  isReloading: boolean;
  isAiming: boolean;
}

export interface MissionProgress {
  currentObjective: ObjectiveId;
  description: string;
  extractionTimer: number;
  isCompleted: boolean;
}

export interface DebugGameHook {
  getState: () => GameState;
  getCameraRotation: () => { yaw: number; pitch: number };
  getPlayerPosition: () => { x: number; y: number; z: number };
  getPlayerHealth: () => number;
  getWeaponState: () => WeaponState;
  getMissionProgress: () => MissionProgress;
  getAliveEnemyCount: () => number;
  getSettings: () => GameSettings;
  updateSettings: (partial: Partial<GameSettings>) => void;
  triggerFire: () => boolean;
  triggerReload: () => boolean;
  triggerInteract: () => boolean;
  damagePlayer: (amount: number) => void;
  restartMission: () => void;
  isSceneReady: () => boolean;
}

declare global {
  interface Window {
    __BLACK_VEIL__?: DebugGameHook;
  }
}