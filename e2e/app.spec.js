import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('wismaku.lang', 'id'))
})

test('pencarian menuju hasil lalu membuka detail penginapan', async ({ page }) => {
  await page.goto('/hasil')
  const firstCard = page.locator('article h3').first()
  await expect(firstCard).toBeVisible()
  const name = (await firstCard.textContent()).trim()
  await firstCard.click()
  await expect(page).toHaveURL(/\/hotel\//)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(name.slice(0, 10))
  await expect(page.getByRole('heading', { name: 'Tulis Ulasan' })).toBeVisible()
})

test('halaman legal tersedia dari footer', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Syarat & Ketentuan' }).click()
  await expect(page).toHaveURL(/\/syarat$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Syarat & Ketentuan' })).toBeVisible()
})

test('daftar akun baru lalu menulis ulasan', async ({ page }) => {
  // Menulis data nyata: aktifkan hanya di stack lokal (CI) lewat E2E_WRITE=1.
  test.skip(!process.env.E2E_WRITE, 'set E2E_WRITE=1 untuk menjalankan tes tulis')
  const email = `e2e-${Date.now()}@test.local`
  await page.goto('/hotel/1')
  await page.getByRole('button', { name: 'Daftar' }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Nama Lengkap').fill('Penguji E2E')
  await dialog.getByLabel('Email').fill(email)
  await dialog.getByLabel('Password').fill('rahasia123')
  await dialog.getByRole('button', { name: 'Daftar' }).last().click()
  await expect(dialog).toBeHidden()

  await page.getByLabel('Nama').fill('Penguji E2E')
  await page.getByRole('radio', { name: '5 bintang' }).click()
  await page.getByLabel('Ulasan', { exact: true }).fill('Ulasan otomatis dari tes E2E.')
  await page.getByRole('button', { name: 'Kirim Ulasan' }).click()
  await expect(page.getByText('Terima kasih, ulasan Anda telah tersimpan.')).toBeVisible()
  await expect(page.getByText('Ulasan Anda').first()).toBeVisible()
})

test.describe('aksesibilitas (axe)', () => {
  for (const path of ['/', '/hasil', '/syarat', '/bantuan']) {
    test(`tanpa pelanggaran serius di ${path}`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      expect(serious.map((v) => `${v.id}: ${v.nodes.length} node (${v.nodes[0]?.target})`)).toEqual([])
    })
  }
})
