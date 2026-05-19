import { describe, it, expect, beforeEach } from 'vitest'
import { matchPraise } from './praise'
import type { Clothing, Compliment, Personality } from './types'
import { PRAISE_HISTORY_KEY } from './constants'

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

function makeCompliments(): Compliment[] {
  return [
    {
      id: 'c1',
      text: '这条裙子太美了，温柔又气质！',
      tags: ['裙装', '温柔'],
      personality_tags: ['gentle', 'outgoing'],
      is_fallback: false,
    },
    {
      id: 'c2',
      text: '酷飒有型，走路都带风！',
      tags: ['酷飒'],
      personality_tags: ['confident', 'outgoing'],
      is_fallback: false,
    },
    {
      id: 'c3',
      text: '运动活力满满，状态在线！',
      tags: ['运动'],
      personality_tags: ['outgoing', 'gentle'],
      is_fallback: false,
    },
    {
      id: 'c4',
      text: '知性又专业，适合通勤～',
      tags: ['知性'],
      personality_tags: ['introverted', 'gentle'],
      is_fallback: false,
    },
    {
      id: 'fallback1',
      text: '今天的穿搭很有个性！',
      tags: [],
      personality_tags: [],
      is_fallback: true,
    },
  ]
}

describe('matchPraise', () => {
  beforeEach(() => {
    localStorage.removeItem(PRAISE_HISTORY_KEY)
  })

  it('matches compliment by clothing tags', () => {
    const items = [
      makeItem({ subcategory: '连衣裙', name: '碎花连衣裙', style: 'gentle' }),
    ]
    const personality: Personality = 'gentle'
    const result = matchPraise(items, personality, makeCompliments())
    // Should match c1 (裙装 + gentle personality)
    expect(result.id).toBe('c1')
  })

  it('matches by style-based tags', () => {
    const items = [
      makeItem({ subcategory: 'T恤', name: '运动T恤', style: 'sport' }),
    ]
    const personality: Personality = 'outgoing'
    const result = matchPraise(items, personality, makeCompliments())
    // sport style → 运动 tag → should match c3
    expect(result.tags).toContain('运动')
  })

  it('skips recently shown compliments', () => {
    // Pre-fill history with c1
    localStorage.setItem(PRAISE_HISTORY_KEY, JSON.stringify(['c1']))

    const items = [
      makeItem({ subcategory: '连衣裙', name: '碎花连衣裙', style: 'gentle' }),
    ]
    const personality: Personality = 'gentle'
    const result = matchPraise(items, personality, makeCompliments())
    // c1 should be skipped, next match for gentle personality would be c4
    expect(result.id).not.toBe('c1')
  })

  it('falls back to generic compliment when no tags match', () => {
    const items = [
      makeItem({ subcategory: '未知类别', name: '奇怪单品', style: 'casual' }),
    ]
    const compliments = makeCompliments()
    // Make no compliments match by using a personality that has no matches for the tag-less items
    const personality: Personality = 'gentle'
    const result = matchPraise(items, personality, compliments)
    // Should get some result (fallback)
    expect(result).toBeTruthy()
    expect(result.id).toBeTruthy()
  })

  it('returns a compliment for every personality', () => {
    const personalities: Personality[] = ['outgoing', 'introverted', 'confident', 'gentle']
    const items = [makeItem()]
    for (const p of personalities) {
      const result = matchPraise(items, p, [])
      expect(result).toBeTruthy()
      expect(result.text.length).toBeGreaterThan(0)
    }
  })

  it('extracts tags from item subcategory and name', () => {
    const items = [
      makeItem({ subcategory: '吊带', name: '蕾丝吊带', style: 'sweet' }),
    ]
    const personality: Personality = 'gentle'
    const compliments: Compliment[] = [
      {
        id: 'test1',
        text: '蕾丝和吊带太美了！',
        tags: ['甜美', '露肩'],
        personality_tags: ['gentle'],
        is_fallback: false,
      },
    ]
    // Tag keywords: 吊带→露肩, 蕾丝→甜美, sweet style→甜美
    const result = matchPraise(items, personality, compliments)
    expect(result.id).toBe('test1')
  })

  it('updates history after picking', () => {
    const items = [makeItem({ subcategory: '连衣裙', name: '连衣裙', style: 'gentle' })]
    const personality: Personality = 'gentle'
    const result = matchPraise(items, personality, makeCompliments())

    const history = JSON.parse(localStorage.getItem(PRAISE_HISTORY_KEY) ?? '[]')
    expect(history).toContain(result.id)
  })
})
