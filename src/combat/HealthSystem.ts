export class HealthSystem {
  private currentHealth: number;
  private readonly maxHealth: number;

  constructor(maxHealth: number = 100) {
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
  }

  public takeDamage(amount: number): number {
    if (amount <= 0 || this.isDead()) return this.currentHealth;
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    return this.currentHealth;
  }

  public heal(amount: number): number {
    if (amount <= 0 || this.isDead()) return this.currentHealth;
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    return this.currentHealth;
  }

  public reset(): void {
    this.currentHealth = this.maxHealth;
  }

  public getHealth(): number {
    return this.currentHealth;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  public isDead(): boolean {
    return this.currentHealth <= 0;
  }
}