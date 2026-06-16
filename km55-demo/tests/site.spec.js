const { test, expect } = require('@playwright/test');

const nav = (page) => page.getByRole('navigation', { name: 'Main navigation' });

test.describe('Vacation Villa KM55', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('home page loads with hero and navigation', async ({ page }) => {
    await expect(page).toHaveTitle(/Vacation Villa KM55/);
    await expect(page.getByRole('heading', { level: 1, name: /Find Time/i })).toBeVisible();
    await expect(nav(page)).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('navigates between sections', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.getByRole('button', { name: 'Open menu' }).click();
      await page.getByRole('menuitem', { name: 'Rooms' }).click();
    } else {
      await nav(page).getByRole('button', { name: 'Rooms', exact: true }).click();
    }

    await expect(page.getByRole('heading', { level: 1, name: 'Our Rooms' })).toBeVisible();
    await expect(page.locator('#page-rooms.page.active')).toBeVisible();

    if (isMobile) {
      await page.getByRole('button', { name: 'Open menu' }).click();
      await page.getByRole('menuitem', { name: 'Gallery' }).click();
    } else {
      await nav(page).getByRole('button', { name: 'Gallery', exact: true }).click();
    }

    await expect(page.getByRole('heading', { level: 1, name: 'Gallery' })).toBeVisible();

    if (isMobile) {
      await page.getByRole('button', { name: 'Open menu' }).click();
      await page.getByRole('menuitem', { name: 'Book Now' }).click();
    } else {
      await nav(page).getByRole('button', { name: 'Book Now' }).click();
    }

    await expect(page.getByRole('heading', { level: 1, name: 'Contact & Book' })).toBeVisible();
  });

  test('mobile menu opens and closes', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');

    const menuToggle = page.getByRole('button', { name: 'Open menu' });
    await menuToggle.click();
    await expect(page.getByRole('button', { name: 'Close menu' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Amenities' })).toBeVisible();

    await page.getByRole('button', { name: 'Close menu' }).click();
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
  });

  test('has no horizontal overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    });
    expect(overflow).toBe(false);
  });

  test('contact form validates required fields', async ({ page, isMobile }) => {
    page.on('dialog', (dialog) => dialog.accept());

    if (isMobile) {
      await page.getByRole('button', { name: 'Open menu' }).click();
      await page.getByRole('menuitem', { name: 'Book Now' }).click();
    } else {
      await nav(page).getByRole('button', { name: 'Book Now' }).click();
    }

    await page.getByRole('button', { name: 'Send Inquiry' }).click();
    await expect(page.locator('#formSuccess')).toBeHidden();
  });

  test('gallery lightbox opens', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.getByRole('button', { name: 'Open menu' }).click();
      await page.getByRole('menuitem', { name: 'Gallery' }).click();
    } else {
      await nav(page).getByRole('button', { name: 'Gallery', exact: true }).click();
    }

    await page.locator('.gallery-img').first().click();
    await expect(page.locator('#lightbox.open')).toBeVisible();
    await page.getByRole('button', { name: 'Close image preview' }).click();
    await expect(page.locator('#lightbox.open')).toBeHidden();
  });
});
