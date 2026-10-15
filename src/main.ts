import { GameEngine } from './core/GameEngine';
import { QualityPreset } from './types/game';

const container = document.getElementById('canvas-container') as HTMLElement;
const mainMenu = document.getElementById('main-menu') as HTMLElement;
const pauseMenu = document.getElementById('pause-menu') as HTMLElement;
const settingsMenu = document.getElementById('settings-menu') as HTMLElement;
const victoryMenu = document.getElementById('victory-menu') as HTMLElement;
const defeatMenu = document.getElementById('defeat-menu') as HTMLElement;
const hud = document.getElementById('hud') as HTMLElement;

const btnDeploy = document.getElementById('btn-deploy') as HTMLButtonElement;
const btnResume = document.getElementById('btn-resume') as HTMLButtonElement;
const btnRestartPause = document.getElementById('btn-restart-pause') as HTMLButtonElement;
const btnRestartWin = document.getElementById('btn-restart-win') as HTMLButtonElement;
const btnRestartLose = document.getElementById('btn-restart-lose') as HTMLButtonElement;

const btnOpenSettingsMain = document.getElementById('btn-open-settings-main') as HTMLButtonElement;
const btnOpenSettingsPause = document.getElementById('btn-open-settings-pause') as HTMLButtonElement;
const btnCloseSettings = document.getElementById('btn-close-settings') as HTMLButtonElement;

const inputSensitivity = document.getElementById('input-sensitivity') as HTMLInputElement;
const inputVolume = document.getElementById('input-volume') as HTMLInputElement;
const selectQuality = document.getElementById('select-quality') as HTMLSelectElement;

const engine = new GameEngine(container);
engine.start();

// Sinkronisasi nilai awal form Settings dari localStorage
const syncSettingsForm = () => {
  const current = engine.settingsManager.getSettings();
  inputSensitivity.value = String(current.mouseSensitivity);
  inputVolume.value = String(current.masterVolume);
  selectQuality.value = current.quality;
};
syncSettingsForm();

engine.stateManager.onChange((state) => {
  settingsMenu.classList.add('hidden');
  mainMenu.classList.toggle('hidden', state !== 'MENU');
  pauseMenu.classList.toggle('hidden', state !== 'PAUSED');
  victoryMenu.classList.toggle('hidden', state !== 'VICTORY');
  defeatMenu.classList.toggle('hidden', state !== 'DEFEAT');
  hud.classList.toggle('hidden', state !== 'PLAYING');
});

const requestPlay = () => {
  engine.stateManager.setState('PLAYING');
  if (document.pointerLockElement !== engine.renderer.domElement) {
    engine.renderer.domElement.requestPointerLock?.();
  }
};

const handleRestart = () => {
  engine.restartMission();
  if (document.pointerLockElement !== engine.renderer.domElement) {
    engine.renderer.domElement.requestPointerLock?.();
  }
};

btnDeploy.addEventListener('click', requestPlay);
btnResume.addEventListener('click', requestPlay);
btnRestartPause.addEventListener('click', handleRestart);
btnRestartWin.addEventListener('click', handleRestart);
btnRestartLose.addEventListener('click', handleRestart);

btnOpenSettingsMain.addEventListener('click', () => {
  syncSettingsForm();
  mainMenu.classList.add('hidden');
  settingsMenu.classList.remove('hidden');
});

btnOpenSettingsPause.addEventListener('click', () => {
  syncSettingsForm();
  pauseMenu.classList.add('hidden');
  settingsMenu.classList.remove('hidden');
});

btnCloseSettings.addEventListener('click', () => {
  engine.settingsManager.updateSettings({
    mouseSensitivity: parseFloat(inputSensitivity.value),
    masterVolume: parseFloat(inputVolume.value),
    quality: selectQuality.value as QualityPreset
  });
  settingsMenu.classList.add('hidden');
  const st = engine.stateManager.getState();
  if (st === 'MENU') mainMenu.classList.remove('hidden');
  if (st === 'PAUSED') pauseMenu.classList.remove('hidden');
});

document.addEventListener('pointerlockchange', () => {
  const isLocked = document.pointerLockElement === engine.renderer.domElement;
  if (!isLocked && engine.stateManager.getState() === 'PLAYING') {
    engine.stateManager.setState('PAUSED');
  }
});

// Ekspos Test Hook Lengkap untuk Unit & E2E Testing
window.__BLACK_VEIL__ = {
  getState: () => engine.stateManager.getState(),
  getCameraRotation: () => engine.fpCamera.getRotationState(),
  getPlayerPosition: () => engine.playerController.getPosition(),
  getPlayerHealth: () => engine.playerHealth.getHealth(),
  getWeaponState: () => engine.weaponSystem.getState(),
  getMissionProgress: () => engine.missionSystem.getProgress(),
  getAliveEnemyCount: () => engine.enemyManager.getAliveCount(),
  getSettings: () => engine.settingsManager.getSettings(),
  updateSettings: (partial) => engine.settingsManager.updateSettings(partial),
  triggerFire: () => engine.attemptFire(),
  triggerReload: () => engine.attemptReload(),
  triggerInteract: () => engine.attemptInteract(),
  damagePlayer: (amount: number) => engine.applyPlayerDamage(amount),
  restartMission: () => engine.restartMission(),
  isSceneReady: () => engine.isReady()
};