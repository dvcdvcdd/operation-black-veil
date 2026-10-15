import { GameSettings, QualityPreset } from '../types/game';

const STORAGE_KEY = 'black_veil_settings_v1';

const DEFAULT_SETTINGS: GameSettings = {
  mouseSensitivity: 0.0022,
  masterVolume: 0.7,
  quality: 'HIGH'
};

type SettingsListener = (settings: GameSettings) => void;

export class SettingsManager {
  private settings: GameSettings;
  private listeners: Set<SettingsListener> = new Set();

  constructor() {
    this.settings = this.loadFromStorage();
  }

  private loadFromStorage(): GameSettings {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw) as Partial<GameSettings>;
      return {
        mouseSensitivity:
          typeof parsed.mouseSensitivity === 'number'
            ? Math.max(0.0005, Math.min(0.008, parsed.mouseSensitivity))
            : DEFAULT_SETTINGS.mouseSensitivity,
        masterVolume:
          typeof parsed.masterVolume === 'number'
            ? Math.max(0, Math.min(1, parsed.masterVolume))
            : DEFAULT_SETTINGS.masterVolume,
        quality: this.isValidQuality(parsed.quality) ? parsed.quality : DEFAULT_SETTINGS.quality
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  private isValidQuality(val: unknown): val is QualityPreset {
    return val === 'LOW' || val === 'MEDIUM' || val === 'HIGH';
  }

  public getSettings(): GameSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<GameSettings>): GameSettings {
    this.settings = {
      ...this.settings,
      ...partial
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Abaikan jika storage penuh atau diblokir browser
    }
    this.listeners.forEach((cb) => cb(this.getSettings()));
    return this.getSettings();
  }

  public onChange(listener: SettingsListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}