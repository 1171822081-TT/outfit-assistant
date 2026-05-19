import type { Clothing, Compliment, Personality } from './types'
import { PRAISE_HISTORY_KEY, PRAISE_HISTORY_SIZE } from './constants'

const TAG_KEYWORDS: Record<string, string[]> = {
  露肩: ['吊带', '露肩', '一字肩', '抹胸'],
  裙装: ['裙', '连衣裙', '半身裙'],
  知性: ['衬衫', '西装', '风衣', '针织'],
  休闲: ['T恤', '卫衣', '牛仔裤', '休闲裤'],
  运动: ['运动', '跑步', '瑜伽', '速干'],
  甜美: ['蕾丝', '荷叶边', '碎花', '蝴蝶结', '泡泡袖'],
  酷飒: ['皮衣', '马丁靴', '工装', '军装', '铆钉'],
  温柔: ['针织', '毛衣', '丝巾', '珍珠', '雪纺'],
  气质: ['大衣', '高领', '阔腿裤', '真丝'],
  清新: ['白', '浅蓝', '条纹', '格子', '棉麻'],
  保暖: ['羽绒', '棉服', '羊绒', '毛呢'],
}

function extractTags(items: Clothing[]): string[] {
  const tags = new Set<string>()
  for (const item of items) {
    const searchText = item.subcategory + item.name
    for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
      for (const kw of keywords) {
        if (searchText.includes(kw)) {
          tags.add(tag)
          break
        }
      }
    }
  }
  // Also add style-based tags
  for (const item of items) {
    switch (item.style) {
      case 'sweet':
        tags.add('甜美')
        break
      case 'cool':
        tags.add('酷飒')
        break
      case 'sport':
        tags.add('运动')
        break
      case 'gentle':
        tags.add('温柔')
        break
      case 'office':
        tags.add('知性')
        break
      case 'casual':
        tags.add('休闲')
        break
    }
  }
  return [...tags]
}

function getRecentHistory(): string[] {
  try {
    const raw = localStorage.getItem(PRAISE_HISTORY_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every((item): item is string => typeof item === 'string')) {
      return parsed
    }
    return []
  } catch {
    return []
  }
}

function pushHistory(id: string): void {
  try {
    const history = getRecentHistory()
    const next = [id, ...history].slice(0, PRAISE_HISTORY_SIZE)
    localStorage.setItem(PRAISE_HISTORY_KEY, JSON.stringify(next))
  } catch {
    // localStorage unavailable
  }
}

const GENERIC_PRAISE: Record<Personality, string[]> = {
  outgoing: ['今天的你格外耀眼！', '这身穿搭充满活力，太适合你了！', '自信出街，光芒四射！'],
  introverted: ['简约而不简单，很有质感。', '低调的细节最打动人。', '沉静又好看，很舒服的一身。'],
  confident: ['独立又有个性，一看就是你的风格。', '不随波逐流，太有辨识度了！', '气场全开，走路带风！'],
  gentle: ['温柔又有气质，像春风拂面。', '细腻的搭配，很会穿～', '柔美中透着力量，恰到好处。'],
}

export function matchPraise(
  items: Clothing[],
  personality: Personality,
  compliments: Compliment[],
): Compliment {
  const tags = extractTags(items)
  const recentIds = getRecentHistory()

  // Filter compliments by tags and personality
  let matches = compliments.filter((c) => {
    if (recentIds.includes(c.id)) return false
    const hasTag = c.tags.some((t) => tags.includes(t))
    const matchesPersonality = c.personality_tags.length === 0 || c.personality_tags.includes(personality)
    return hasTag && matchesPersonality
  })

  // Broader match: personality match only (no tag requirement)
  if (matches.length === 0) {
    matches = compliments.filter((c) => {
      if (recentIds.includes(c.id)) return false
      return c.personality_tags.length === 0 || c.personality_tags.includes(personality)
    })
  }

  // Fallback compliments — also check recentIds to avoid repeats
  if (matches.length === 0) {
    matches = compliments.filter((c) => c.is_fallback && !recentIds.includes(c.id))
  }

  // Hardcoded generic fallback
  if (matches.length === 0) {
    const genericList = GENERIC_PRAISE[personality] ?? GENERIC_PRAISE.gentle
    const text = genericList[Math.floor(Math.random() * genericList.length)]
    const fallback: Compliment = {
      id: `generic_${Date.now()}`,
      text,
      tags: [],
      personality_tags: [personality],
      is_fallback: true,
    }
    pushHistory(fallback.id)
    return fallback
  }

  const picked = matches[Math.floor(Math.random() * matches.length)]
  pushHistory(picked.id)
  return picked
}
