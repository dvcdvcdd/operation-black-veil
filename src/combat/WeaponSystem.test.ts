import { describe, it, expect, beforeEach } from 'vitest';
import { WeaponSystem } from './WeaponSystem';

describe('WeaponSystem Unit Tests', () => {
  let weapon: WeaponSystem;

  beforeEach(() => {
    weapon = new WeaponSystem(30, 90, 0.1, 1.0);
  });

  it('should initialize with correct magazine and reserve ammo', () => {
    const state = weapon.getState();
    expect(state.currentAmmo).toBe(30);
    expect(state.reserveAmmo).toBe(90);
    expect(state.isReloading).toBe(false);
  });

  it('should decrement current ammo when firing successfully', () => {
    const fired = weapon.fire();
    expect(fired).toBe(true);
    expect(weapon.getState().currentAmmo).toBe(29);
  });

  it('should respect cooldown between shots', () => {
    expect(weapon.fire()).toBe(true);
    // Langsung menembak lagi tanpa menunggu cooldown harus gagal
    expect(weapon.fire()).toBe(false);
  });

  it('should trigger reload and refill magazine after duration', () => {
    // Kosongkan magazine
    for (let i = 0; i < 30; i++) {
      weapon.fire();
      // Majukan waktu tiruan agar cooldown terlewati
      weapon.update(0.15);
    }
    expect(weapon.getState().currentAmmo).toBe(0);

    // Mulai reload
    const reloadingStarted = weapon.startReload();
    expect(reloadingStarted).toBe(true);
    expect(weapon.getState().isReloading).toBe(true);

    // Selesaikan durasi reload (1.0 detik)
    weapon.update(1.05);

    const stateAfter = weapon.getState();
    expect(stateAfter.isReloading).toBe(false);
    expect(stateAfter.currentAmmo).toBe(30);
    expect(stateAfter.reserveAmmo).toBe(60);
  });
});