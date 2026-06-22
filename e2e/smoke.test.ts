import { test, expect } from '@playwright/test';

test.describe('Základný Smoke Test aplikácie SportWell', () => {
  test('Aplikácia sa načíta a presmeruje neprihláseného na login', async ({ page }) => {
    // Ak sa navigujeme na root, layout by nás mal hodiť na /login
    await page.goto('/');
    
    // Malo by nás to presmerovať na login
    await expect(page).toHaveURL(/.*login/);
    
    // Na logine by mala byť hlavička Vitajte späť
    await expect(page.locator('text=Vitajte späť')).toBeVisible();
    
    // Tlačidlo na získanie kódu
    await expect(page.locator('button', { hasText: /Získať prihlasovací kód/i })).toBeVisible();
  });
});
