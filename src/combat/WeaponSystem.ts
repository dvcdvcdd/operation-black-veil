import { WeaponState } from '../types/game';

export class WeaponSystem {
  private currentAmmo: number;
  private reserveAmmo: number;
  private readonly magazineSize: number;
  private readonly fireCooldown: number;
  private readonly reloadDuration: number;

  private cooldownTimer: number = 0;
  private reloadTimer: number = 0;
  private fireBufferTimer: number = 0; // Menyimpan antrean klik cepat
  private isReloading: boolean = false;
  private isAiming: boolean = false;
  private isTriggerHeld: boolean = false;

  constructor(
    magazineSize: number = 30,
    initialReserve: number = 90,
    fireCooldown: number = 0.095, // Lebih responsif (~630 RPM)
    reloadDuration: number = 1.5
  ) {
    this.magazineSize = magazineSize;
    this.currentAmmo = magazineSize;
    this.reserveAmmo = initialReserve;
    this.fireCooldown = fireCooldown;
    this.reloadDuration = reloadDuration;
  }

  public update(dt: number): void {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);
    }

    if (this.fireBufferTimer > 0) {
      this.fireBufferTimer = Math.max(0, this.fireBufferTimer - dt);
    }

    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.completeReload();
      }
    }
  }

  public setTriggerHeld(held: boolean): void {
    this.isTriggerHeld = held;
    if (held) {
      // Buffer selama 100ms agar klik cepat tidak pernah hilang
      this.fireBufferTimer = 0.1;
    }
  }

  public shouldAutoFire(): boolean {
    return (this.isTriggerHeld || this.fireBufferTimer > 0) && this.canFire();
  }

  public canFire(): boolean {
    return !this.isReloading && this.currentAmmo > 0 && this.cooldownTimer <= 0;
  }

  public fire(): boolean {
    if (!this.canFire()) {
      // Jika gagal karena masih cooldown sedikit lagi, simpan di buffer
      if (!this.isReloading && this.currentAmmo > 0) {
        this.fireBufferTimer = 0.1;
      }
      return false;
    }

    this.currentAmmo -= 1;
    this.cooldownTimer = this.fireCooldown;
    this.fireBufferTimer = 0;
    return true;
  }

  public startReload(): boolean {
    if (this.isReloading) return false;
    if (this.currentAmmo >= this.magazineSize) return false;
    if (this.reserveAmmo <= 0) return false;

    this.isReloading = true;
    this.reloadTimer = this.reloadDuration;
    this.fireBufferTimer = 0;
    return true;
  }

  private completeReload(): void {
    const needed = this.magazineSize - this.currentAmmo;
    const transfer = Math.min(needed, this.reserveAmmo);
    this.currentAmmo += transfer;
    this.reserveAmmo -= transfer;
    this.isReloading = false;
    this.reloadTimer = 0;
  }

  public setAiming(aiming: boolean): void {
    this.isAiming = aiming && !this.isReloading;
  }

  public getState(): WeaponState {
    return {
      currentAmmo: this.currentAmmo,
      reserveAmmo: this.reserveAmmo,
      magazineSize: this.magazineSize,
      isReloading: this.isReloading,
      isAiming: this.isAiming
    };
  }

  public reset(): void {
    this.currentAmmo = this.magazineSize;
    this.reserveAmmo = 90;
    this.cooldownTimer = 0;
    this.reloadTimer = 0;
    this.fireBufferTimer = 0;
    this.isReloading = false;
    this.isAiming = false;
    this.isTriggerHeld = false;
  }
}