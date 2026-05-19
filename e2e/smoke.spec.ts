import { test, expect } from '@playwright/test'

test.describe('冒烟测试 — 穿搭助手核心流程', () => {
  test('首页未登录时重定向到登录页', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain('/login')
  })

  test('登录页渲染正常', async ({ page }) => {
    await page.goto('/login')

    // 品牌标题
    await expect(page.getByRole('heading', { name: /穿搭助手/ })).toBeVisible()

    // 登录模式切换
    await expect(page.getByRole('button', { name: '密码登录' })).toBeVisible()
    await expect(page.getByRole('button', { name: '验证码登录' })).toBeVisible()

    // 表单元素（默认密码登录模式）
    await expect(page.getByPlaceholder(/hello@example.com/).first()).toBeVisible()
    await expect(page.getByPlaceholder('至少6位').first()).toBeVisible()
    await expect(page.getByRole('button', { name: '登录', exact: true })).toBeVisible()

    // 注册链接
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
