import { describe, it, expect } from 'vitest'
import { recommend } from './recommendation'
import type { OutfitCandidate } from './recommendation'
import type { Clothing, WeatherData, UserProfile } from './types'

function makeItem(overrides: Partial<Clothing> = {}): Clothing {
  return {
    id: crypto.randomUUID(),
    name: '测试衣物',
    category: 'top',
    subcategory: 'T恤',
    color: '白色',
    color_hex: '#FFFFFF',
    style: 'casual',
    thickness: 'medium',
    waterproof: false,
    material: 'cotton',
    temp_min: 10,
    temp_max: 30,
    image_original: null,
    image_naked: null,
    anchor_x: 0.5,
    anchor_y: 0.5,
    scale_x: 1,
    scale_y: 1,
    status: 'active',
    user_id: 'test-user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

function makeWeather(overrides: Partial<WeatherData> = {}): WeatherData {
  return {
    temp_high: 25,
    temp_low: 15,
    weather_type: '晴',
    wind_level: 2,
    precip_probability: 10,
    humidity: 50,
    fetched_at: new Date().toISOString(),
    ...overrides,
  }
}

function makeProfile(
  overrides: Partial<Pick<UserProfile, 'style_prefs' | 'commute' | 'fav_style_counts' | 'fav_category_counts'>> = {},
): Pick<UserProfile, 'style_prefs' | 'commute' | 'fav_style_counts' | 'fav_category_counts'> {
  return {
    style_prefs: ['casual'],
    commute: 'walk',
    fav_style_counts: { casual: 3 },
    fav_category_counts: { top: 2, bottom: 1 },
    ...overrides,
  }
}

describe('recommend', () => {
  it('returns empty when no items', () => {
    const result = recommend([], makeWeather(), makeProfile())
    expect(result.outfits).toHaveLength(0)
  })

  it('returns empty when only tops (no shoes or bottoms/dresses)', () => {
    const items = [
      makeItem({ id: 't1', category: 'top' }),
      makeItem({ id: 't2', category: 'top' }),
    ]
    const result = recommend(items, makeWeather(), makeProfile())
    expect(result.outfits).toHaveLength(0)
  })

  it('generates dress + shoes candidates', () => {
    const items = [
      makeItem({ id: 'd1', category: 'dress', name: '连衣裙', temp_min: 10, temp_max: 30 }),
      makeItem({ id: 's1', category: 'shoes', name: '运动鞋', temp_min: 5, temp_max: 35 }),
    ]
    const result = recommend(items, makeWeather(), makeProfile())
    expect(result.outfits.length).toBeGreaterThan(0)
    for (const o of result.outfits) {
      expect(o.dress).toBeTruthy()
      expect(o.shoes).toBeTruthy()
    }
  })

  it('generates top + bottom + shoes candidates', () => {
    const items = [
      makeItem({ id: 't1', category: 'top', name: 'T恤', temp_min: 10, temp_max: 30 }),
      makeItem({ id: 'b1', category: 'bottom', name: '牛仔裤', temp_min: 10, temp_max: 30 }),
      makeItem({ id: 's1', category: 'shoes', name: '运动鞋', temp_min: 5, temp_max: 35 }),
    ]
    const result = recommend(items, makeWeather(), makeProfile())
    expect(result.outfits.length).toBeGreaterThan(0)
    for (const o of result.outfits) {
      expect(o.top).toBeTruthy()
      expect(o.bottom).toBeTruthy()
      expect(o.shoes).toBeTruthy()
    }
  })

  it('filters out items outside temperature range', () => {
    const items = [
      makeItem({ id: 't1', category: 'top', temp_min: 10, temp_max: 20 }),
      makeItem({ id: 'b1', category: 'bottom', temp_min: 10, temp_max: 20 }),
      makeItem({ id: 's1', category: 'shoes', temp_min: 5, temp_max: 35 }),
      makeItem({ id: 't2', category: 'top', temp_min: 0, temp_max: 5 }), // too cold
      makeItem({ id: 'd1', category: 'dress', temp_min: 35, temp_max: 40 }), // too hot
    ]
    const result = recommend(items, makeWeather({ temp_high: 25, temp_low: 15 }), makeProfile())
    expect(result.outfits.length).toBeGreaterThan(0)
    for (const o of result.outfits) {
      const allItems = [o.top, o.bottom, o.dress, o.outerwear, o.shoes, o.accessory].filter(Boolean) as Clothing[]
      const ids = allItems.map((i) => i.id)
      expect(ids).not.toContain('t2')
      expect(ids).not.toContain('d1')
    }
  })

  it('excludes sandals when raining', () => {
    const items = [
      makeItem({ id: 't1', category: 'top', temp_min: 10, temp_max: 30 }),
      makeItem({ id: 'b1', category: 'bottom', temp_min: 10, temp_max: 30 }),
      makeItem({ id: 's_good', category: 'shoes', name: '运动鞋', subcategory: '运动鞋', temp_min: 5, temp_max: 35 }),
      makeItem({ id: 's_bad', category: 'shoes', name: '凉鞋', subcategory: '凉鞋', temp_min: 20, temp_max: 40 }),
    ]
    const result = recommend(
      items,
      makeWeather({ precip_probability: 80 }),
      makeProfile(),
    )
    expect(result.outfits.length).toBeGreaterThan(0)
    for (const o of result.outfits) {
      expect(o.shoes?.id).not.toBe('s_bad')
    }
  })

  it('uses fallback when strict filtering yields too few items', () => {
    const items = [
      makeItem({ id: 't1', category: 'top', temp_min: 15, temp_max: 25 }),
      makeItem({ id: 't2', category: 'top', temp_min: 8, temp_max: 22 }),
      makeItem({ id: 'b1', category: 'bottom', temp_min: 14, temp_max: 26 }),
      makeItem({ id: 'b2', category: 'bottom', temp_min: 12, temp_max: 20 }),
      makeItem({ id: 's1', category: 'shoes', temp_min: 5, temp_max: 35 }),
      makeItem({ id: 's2', category: 'shoes', temp_min: 5, temp_max: 35 }),
    ]
    const result = recommend(items, makeWeather({ temp_high: 25, temp_low: 15 }), makeProfile())
    expect(result.outfits.length).toBeGreaterThan(0)
  })

  it('returns at most 3 outfits', () => {
    const items: Clothing[] = []
    for (let i = 0; i < 5; i++) {
      items.push(makeItem({ id: `t${i}`, category: 'top', temp_min: 10, temp_max: 30 }))
      items.push(makeItem({ id: `b${i}`, category: 'bottom', temp_min: 10, temp_max: 30 }))
      items.push(makeItem({ id: `s${i}`, category: 'shoes', temp_min: 5, temp_max: 35 }))
    }
    const result = recommend(items, makeWeather(), makeProfile())
    expect(result.outfits.length).toBeLessThanOrEqual(3)
  })

  // Style clash tests
  it('excludes sport + office style combinations', () => {
    const items = [
      makeItem({ id: 't1', category: 'top', style: 'sport', temp_min: 10, temp_max: 30 }),
      makeItem({ id: 'b1', category: 'bottom', style: 'office', temp_min: 10, temp_max: 30 }),
      makeItem({ id: 's1', category: 'shoes', temp_min: 5, temp_max: 35 }),
    ]
    const result = recommend(items, makeWeather(), makeProfile({ style_prefs: ['sport', 'office'] }))
    // sport + office clash, so outfit should be excluded
    for (const o of result.outfits) {
      const styles = [o.top, o.bottom, o.dress, o.outerwear, o.shoes, o.accessory]
        .filter(Boolean)
        .map((i) => (i as Clothing).style)
      const hasBoth = styles.includes('sport') && styles.includes('office')
      expect(hasBoth).toBe(false)
    }
  })

  it('excludes sport + gentle style combinations', () => {
    const items = [
      makeItem({ id: 't1', category: 'top', style: 'sport', temp_min: 10, temp_max: 30 }),
      makeItem({ id: 'b1', category: 'bottom', style: 'gentle', temp_min: 10, temp_max: 30 }),
      makeItem({ id: 's1', category: 'shoes', temp_min: 5, temp_max: 35 }),
    ]
    const result = recommend(items, makeWeather(), makeProfile())
    for (const o of result.outfits) {
      const styles = [o.top, o.bottom, o.dress, o.outerwear, o.shoes, o.accessory]
        .filter(Boolean)
        .map((i) => (i as Clothing).style)
      const hasBoth = styles.includes('sport') && styles.includes('gentle')
      expect(hasBoth).toBe(false)
    }
  })

  it('excludes sweet + cool style combinations', () => {
    const items = [
      makeItem({ id: 'd1', category: 'dress', style: 'sweet', temp_min: 10, temp_max: 30 }),
      makeItem({ id: 's1', category: 'shoes', style: 'cool', temp_min: 5, temp_max: 35 }),
    ]
    const result = recommend(items, makeWeather(), makeProfile())
    for (const o of result.outfits) {
      const styles = [o.top, o.bottom, o.dress, o.outerwear, o.shoes, o.accessory]
        .filter(Boolean)
        .map((i) => (i as Clothing).style)
      const hasBoth = styles.includes('sweet') && styles.includes('cool')
      expect(hasBoth).toBe(false)
    }
  })

  // Waterproof clash test
  it('penalizes non-waterproof outerwear when raining (score 0)', () => {
    const items = [
      makeItem({ id: 't1', category: 'top', temp_min: 10, temp_max: 30 }),
      makeItem({ id: 't2', category: 'top', temp_min: 10, temp_max: 30 }),
      makeItem({ id: 'b1', category: 'bottom', temp_min: 10, temp_max: 30 }),
      makeItem({ id: 'b2', category: 'bottom', temp_min: 10, temp_max: 30 }),
      makeItem({ id: 's1', category: 'shoes', temp_min: 5, temp_max: 35 }),
      makeItem({ id: 's2', category: 'shoes', temp_min: 5, temp_max: 35 }),
      makeItem({ id: 'o_bad', category: 'outerwear', waterproof: false, temp_min: 5, temp_max: 25 }),
      makeItem({ id: 'o_good', category: 'outerwear', waterproof: true, temp_min: 5, temp_max: 25 }),
    ]
    const result = recommend(items, makeWeather({ precip_probability: 80 }), makeProfile())
    // With enough candidates, non-waterproof outerwear outfits score 0 and won't appear in top 3
    for (const o of result.outfits) {
      if (o.outerwear) {
        expect(o.outerwear.waterproof).toBe(true)
      }
    }
  })

  // Commute filtering test
  it('excludes items matching commute exclude keywords', () => {
    const items = [
      makeItem({ id: 't1', category: 'top', temp_min: 10, temp_max: 30 }),
      makeItem({ id: 'b_skirt', category: 'bottom', subcategory: '短裙', temp_min: 10, temp_max: 30 }),
      makeItem({ id: 'b_pants', category: 'bottom', subcategory: '长裤', temp_min: 10, temp_max: 30 }),
      makeItem({ id: 's1', category: 'shoes', temp_min: 5, temp_max: 35 }),
      makeItem({ id: 's2', category: 'shoes', temp_min: 5, temp_max: 35 }),
    ]
    // bike commute excludes 短裙; enough items exist to make outfits without fallback
    const result = recommend(items, makeWeather(), makeProfile({ commute: 'bike' }))
    for (const o of result.outfits) {
      if (o.bottom) {
        expect(o.bottom.subcategory).not.toContain('短裙')
      }
    }
  })

  // Weight phase tests
  it('uses cold_start weights when favorites are below threshold', () => {
    const items = [
      makeItem({ id: 't1', category: 'top', temp_min: 10, temp_max: 30 }),
      makeItem({ id: 'b1', category: 'bottom', temp_min: 10, temp_max: 30 }),
      makeItem({ id: 's1', category: 'shoes', temp_min: 5, temp_max: 35 }),
    ]
    // fav total = 0 + 0 = 0, which is < 5 (COLD_START_THRESHOLD)
    const result = recommend(
      items,
      makeWeather(),
      makeProfile({ fav_style_counts: {}, fav_category_counts: {} }),
    )
    expect(result.outfits.length).toBeGreaterThan(0)
  })

  it('produces consistent results with same input (deterministic truncation)', () => {
    const items: Clothing[] = []
    for (let i = 0; i < 10; i++) {
      items.push(makeItem({ id: `t-${i}`, category: 'top', temp_min: 10, temp_max: 30 }))
      items.push(makeItem({ id: `b-${i}`, category: 'bottom', temp_min: 10, temp_max: 30 }))
    }
    items.push(makeItem({ id: 's-fixed', category: 'shoes', temp_min: 5, temp_max: 35 }))

    const r1 = recommend(items, makeWeather(), makeProfile())
    const r2 = recommend(items, makeWeather(), makeProfile())
    // Same input should produce same output (no more Math.random)
    expect(r1.outfits).toEqual(r2.outfits)
  })
})

describe('outfitKey', () => {
  it('outfits with same items have same key', () => {
    const t = makeItem({ id: 't1', category: 'top' })
    const b = makeItem({ id: 'b1', category: 'bottom' })
    const s = makeItem({ id: 's1', category: 'shoes' })
    const items = [t, b, s, makeItem({ id: 's2', category: 'shoes' })]
    const result = recommend(items, makeWeather(), makeProfile())
    const keys = result.outfits.map((o) => `${o.top?.id}|${o.bottom?.id}|${o.shoes?.id}`)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
