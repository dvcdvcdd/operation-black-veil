import { test, expect } from '@playwright/test';

test.describe('Operation Black Veil E2E Gameplay Verification', () => {
  test('should load main menu and start game successfully', async ({ page }) => {
    await page.goto('/');

    // 1. Verifikasi Main Menu
    const mainMenu = page.locator('#main-menu');
    await expect(mainMenu).toBeVisible();

    const title = page.locator('h1');
    await expect(title).toHaveText('OPERATION BLACK VEIL');

    // 2. Klik Deploy Operator
    await page.click('#btn-deploy');

    // 3. Verifikasi HUD muncul & Game State berubah menjadi PLAYING lewat test hook
    const gameState = await page.evaluate(() => window.__BLACK_VEIL__?.getState());
    expect(gameState).toBe('PLAYING');

    const hud = page.locator('#hud');
    await expect(hud).toBeVisible();
  });

  test('should execute weapon firing and ammunition reduction via test hooks', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-deploy');

    // Cek amunisi awal
    const ammoBefore = await page.evaluate(() => window.__BLACK_VEIL__?.getWeaponState().currentAmmo);
    expect(ammoBefore).toBe(30);

    // Picu tembakan lewat test hook
    const fired = await page.evaluate(() => window.__BLACK_VEIL__?.triggerFire());
    expect(fired).toBe(true);

    const ammoAfter = await page.evaluate(() => window.__BLACK_VEIL__?.getWeaponState().currentAmmo);
    expect(ammoAfter).toBe(29);
  });

  test('should track mission objective progression', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-deploy');

    const progress = await page.evaluate(() => window.__BLACK_VEIL__?.getMissionProgress());
    expect(progress?.currentObjective).toBe('INFILTRATE');
  });
});