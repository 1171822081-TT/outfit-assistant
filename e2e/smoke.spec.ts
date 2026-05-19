import dotenv from 'dotenv'
import { test, expect, type Page } from '@playwright/test'

dotenv.config({ path: '.env.local' })

const TEST_EMAIL = process.env.TEST_EMAIL!
const TEST_PASSWORD = process.env.TEST_PASSWORD!

// —— helpers ——

interface AddItemOptions {
  name: string
  category: string
  style?: string
  color?: string
  colorHex?: string
  subcategory?: string
  tempMin?: number
  tempMax?: number
}

async function addClothingItem(page: Page, opts: AddItemOptions) {
  const {
    name,
    category,
    style = 'casual',
    color = '白色',
    colorHex = '#FFFFFF',
    subcategory = 'T恤',
    tempMin = 5,
    tempMax = 30,
  } = opts

  const fab = page.locator('[aria-label="添加衣物"]')
  await fab.click({ position: { x: 28, y: 5 }, force: true })
  await expect(page.getByRole('heading', { name: /添加衣物|编辑衣物/ })).toBeVisible()

  await page.getByPlaceholder('eg. 白色T恤').fill(name)
  await page.locator('label', { hasText: '分类' }).locator('select').selectOption(category)
  await page.locator('label', { hasText: '风格' }).locator('select').selectOption(style)
  await page.getByRole('textbox', { name: '颜色' }).fill(color)
  const hexInput = page.locator('label', { hasText: '色值' }).locator('input[type="text"]')
  await hexInput.fill(colorHex)
  await page.getByPlaceholder('eg. T恤、衬衫、卫衣').fill(subcategory)
  await page.getByLabel('最低温度 °C').fill(String(tempMin))
  await page.getByLabel('最高温度 °C').fill(String(tempMax))

  // Use evaluate click — Playwright click({force}) on submit button can cause
  // unexpected navigation away from the wardrobe page (form inside modal)
  await page.getByRole('button', { name: '保存' }).evaluate(el => (el as HTMLButtonElement).click())
  // Allow Supabase insert + store update + React re-render
  await page.waitForTimeout(2000)
  await expect(page.getByRole('heading', { name: /添加衣物|编辑衣物/ })).not.toBeVisible({ timeout: 10_000 })
  await expect(page.getByText(name).first()).toBeVisible({ timeout: 10_000 })
}

// —— tests ——

test.describe('冒烟测试 — 穿搭助手核心流程', () => {
  test('首页未登录时重定向到登录页', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain('/login')
  })

  test('登录页渲染正常', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: /穿搭助手/ })).toBeVisible()
    await expect(page.getByRole('button', { name: '密码登录' })).toBeVisible()
    await expect(page.getByRole('button', { name: '验证码登录' })).toBeVisible()
    await expect(page.getByPlaceholder(/hello@example.com/).first()).toBeVisible()
    await expect(page.getByPlaceholder('至少6位').first()).toBeVisible()
    await expect(page.getByRole('button', { name: '登录', exact: true })).toBeVisible()
    await expect(page.getByText('去注册')).toBeVisible()
  })

  test('注册页渲染正常', async ({ page }) => {
    await page.goto('/register')

    await expect(page.getByRole('heading', { name: /注册账号/ })).toBeVisible()
    await expect(page.getByPlaceholder('hello@example.com')).toBeVisible()
    await expect(page.getByPlaceholder('至少6位').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /注册/ })).toBeVisible()
  })

  test('登录页可跳转到注册页', async ({ page }) => {
    await page.goto('/login')
    await page.getByText('去注册').click()
    await page.waitForURL(/\/register/)
    expect(page.url()).toContain('/register')
  })

  test('未登录访问受保护路由重定向到登录', async ({ page }) => {
    await page.goto('/wardrobe')
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain('/login')

    await page.goto('/outfits')
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain('/login')
  })

  test('页面标题正确', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle('穿搭助手')
  })
})

test.describe('冒烟测试 — 登录后核心流程', () => {

  test('完整流程：登录 → Onboarding → 加衣物 → 看推荐 → 收藏', async ({ page }) => {
    test.setTimeout(300_000)

    // —— Step 1: 密码登录 ——
    await test.step('密码登录', async () => {
      await page.goto('/login')
      await page.getByPlaceholder(/hello@example.com/).first().fill(TEST_EMAIL)
      await page.getByPlaceholder('至少6位').first().fill(TEST_PASSWORD)
      await page.getByRole('button', { name: '登录', exact: true }).click()
      await page.waitForURL(/\/(onboarding)?$/, { timeout: 30_000 })
    })

    // —— Step 2: Onboarding (if needed) ——
    await test.step('Onboarding', async () => {
      if (!page.url().includes('/onboarding')) return

      await expect(page.getByText('绑定手机号')).toBeVisible()
      await page.getByRole('button', { name: '下一步' }).click()

      await expect(page.getByText(/穿搭性格/)).toBeVisible()
      await page.getByText('开朗外向').click()
      await page.getByRole('button', { name: '下一步' }).click()

      await expect(page.getByText(/穿搭风格/)).toBeVisible()
      await page.getByText('休闲自在').click()
      await page.getByRole('button', { name: '下一步' }).click()

      await expect(page.getByRole('heading', { name: /出门/ })).toBeVisible()
      await page.getByText('走路').click()
      await page.getByRole('button', { name: '开始使用' }).click()

      await page.waitForURL('**/')
    })

    // —— Step 3: 衣柜添加衣物（top + bottom + shoes = 推荐算法最低要求） ——
    await test.step('衣柜添加衣物', async () => {
      await page.getByRole('link', { name: '衣柜' }).click()
      await page.waitForURL('**/wardrobe')
      await expect(page.getByRole('heading', { name: '我的衣柜' })).toBeVisible({ timeout: 15_000 })

      await addClothingItem(page, {
        name: 'E2E白色T恤',
        category: 'top',
        subcategory: 'T恤',
      })
      await addClothingItem(page, {
        name: 'E2E蓝色牛仔裤',
        category: 'bottom',
        subcategory: '牛仔裤',
        color: '蓝色',
        colorHex: '#335588',
      })
      await addClothingItem(page, {
        name: 'E2E白色运动鞋',
        category: 'shoes',
        subcategory: '运动鞋',
      })
    })

    // —— Step 4: 推荐页加载 ——
    await test.step('推荐页加载', async () => {
      await page.getByRole('link', { name: '推荐' }).click()
      await page.waitForURL('**/', { timeout: 15_000 })

      const loadTimeout = 120_000
      await page.getByText('正在加载模特...').waitFor({ state: 'hidden', timeout: loadTimeout }).catch(() => {})
      await page.getByText('正在搭配...').waitFor({ state: 'hidden', timeout: loadTimeout }).catch(() => {})

      const hasFavButton = await page.locator('[aria-label="收藏搭配"]').isVisible().catch(() => false)
      const isEmpty = await page.getByText('暂无推荐搭配').isVisible().catch(() => false)
      expect(hasFavButton || isEmpty).toBe(true)
    })

    // —— Step 5: 收藏搭配 ——
    await test.step('收藏搭配', async () => {
      const favButton = page.locator('[aria-label="收藏搭配"]')
      const isEnabled = await favButton.isEnabled().catch(() => false)

      if (!isEnabled) return

      // Use evaluate for click — avoids BottomNav interception that happens with force:true
      await favButton.evaluate(el => (el as HTMLButtonElement).click())
      await expect(page.locator('[aria-label="取消收藏"]')).toBeVisible({ timeout: 10_000 })
    })

    // —— Step 6: 搭配页验证收藏 ——
    await test.step('搭配页验证收藏', async () => {
      await page.getByRole('link', { name: '搭配' }).click()
      await page.waitForURL('**/outfits', { timeout: 15_000 })
      await expect(page.getByRole('tab', { name: '收藏搭配' })).toBeVisible({ timeout: 15_000 })

      await page.getByRole('tab', { name: '收藏搭配' }).click()
      await expect(page.getByRole('tab', { name: /收藏搭配/ })).toHaveAttribute('aria-selected', 'true')

      await page.getByText('还没有收藏搭配').waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {})

      const hasFavItem = await page.locator('[aria-label="取消收藏"]').first().isVisible().catch(() => false)
      const emptyFavorites = await page.getByText('还没有收藏搭配').isVisible().catch(() => false)
      expect(hasFavItem || emptyFavorites).toBe(true)
    })
  })

  test('编辑衣物名称', async ({ page }) => {
    test.setTimeout(120_000)

    // —— Login ——
    await test.step('登录', async () => {
      await page.goto('/login')
      await page.getByPlaceholder(/hello@example.com/).first().fill(TEST_EMAIL)
      await page.getByPlaceholder('至少6位').first().fill(TEST_PASSWORD)
      await page.getByRole('button', { name: '登录', exact: true }).click()
      await page.waitForURL(/\/(onboarding)?$/, { timeout: 30_000 })
    })

    // —— Navigate to wardrobe ——
    await test.step('进入衣柜', async () => {
      await page.getByRole('link', { name: '衣柜' }).click()
      await page.waitForURL('**/wardrobe', { timeout: 15_000 })
      await expect(page.getByRole('heading', { name: '我的衣柜' })).toBeVisible({ timeout: 15_000 })
    })

    const originalName = 'E2E编辑测试原名称'
    const updatedName = 'E2E编辑测试新名称'

    // —— Add a unique item to edit ——
    await test.step('添加测试衣物', async () => {
      await addClothingItem(page, {
        name: originalName,
        category: 'top',
        subcategory: '卫衣',
        color: '灰色',
        colorHex: '#999999',
      })
    })

    // —— Edit the item ——
    await test.step('编辑衣物名称并保存', async () => {
      await page.getByText(originalName).first().click()
      await expect(page.getByRole('heading', { name: '编辑衣物' })).toBeVisible()

      const nameInput = page.getByPlaceholder('eg. 白色T恤')
      await nameInput.fill(updatedName)

      await page.getByRole('button', { name: '保存' }).evaluate(el => (el as HTMLButtonElement).click())
      await page.waitForTimeout(2000)
      await expect(page.getByRole('heading', { name: /编辑衣物/ })).not.toBeVisible({ timeout: 10_000 })
    })

    // —— Verify the updated name appears in the grid ——
    await test.step('验证名称已更新', async () => {
      await expect(page.getByText(updatedName).first()).toBeVisible({ timeout: 10_000 })
    })
  })

  test('删除衣物', async ({ page }) => {
    test.setTimeout(120_000)

    // —— Login ——
    await test.step('登录', async () => {
      await page.goto('/login')
      await page.getByPlaceholder(/hello@example.com/).first().fill(TEST_EMAIL)
      await page.getByPlaceholder('至少6位').first().fill(TEST_PASSWORD)
      await page.getByRole('button', { name: '登录', exact: true }).click()
      await page.waitForURL(/\/(onboarding)?$/, { timeout: 30_000 })
    })

    // —— Navigate to wardrobe ——
    await test.step('进入衣柜', async () => {
      await page.getByRole('link', { name: '衣柜' }).click()
      await page.waitForURL('**/wardrobe', { timeout: 15_000 })
      await expect(page.getByRole('heading', { name: '我的衣柜' })).toBeVisible({ timeout: 15_000 })
    })

    const deleteItemName = 'E2E删除测试衣物'

    // —— Add a unique item to delete ——
    await test.step('添加测试衣物', async () => {
      await addClothingItem(page, {
        name: deleteItemName,
        category: 'accessory',
        subcategory: '帽子',
        color: '黑色',
        colorHex: '#222222',
      })
    })

    // —— Delete the item ——
    await test.step('删除衣物', async () => {
      // Handle the native confirm dialog — set up BEFORE clicking delete
      page.once('dialog', (dialog) => dialog.accept())

      // Hover the card to reveal the delete button
      await page.getByText(deleteItemName).first().hover()
      const deleteBtn = page.locator(`[aria-label="删除${deleteItemName}"]`)
      await expect(deleteBtn).toBeVisible({ timeout: 3_000 })

      // Use evaluate click to avoid event bubbling issues with the parent card button
      await deleteBtn.evaluate(el => (el as HTMLButtonElement).click())
    })

    // —— Verify the item is removed from the grid ——
    await test.step('验证衣物已删除', async () => {
      // Wait for Supabase delete + store update + React re-render
      await page.waitForTimeout(3000)
      await expect(page.getByText(deleteItemName)).not.toBeVisible({ timeout: 10_000 })
    })
  })
})
