import type { Category, Style, Material, Commute, Slot, Personality } from './types'

export const CATEGORIES: Category[] = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory']

export const CATEGORY_LABELS: Record<Category, string> = {
  top: '上衣',
  bottom: '下装',
  dress: '连衣裙',
  outerwear: '外套',
  shoes: '鞋子',
  accessory: '配饰',
}

export const STYLES: Style[] = ['casual', 'office', 'sport', 'sweet', 'cool', 'gentle']

export const STYLE_LABELS: Record<Style, string> = {
  casual: '休闲自在',
  office: '通勤干练',
  sport: '运动活力',
  sweet: '甜美可爱',
  cool: '酷飒帅气',
  gentle: '温柔气质',
}

export const THICKNESS_ORDER: Record<string, number> = {
  thin: 0,
  medium: 1,
  thick: 2,
  down: 3,
}

export const MATERIALS: Material[] = [
  'cotton', 'denim', 'leather', 'rubber', 'wool', 'down', 'silk', 'polyester', 'canvas',
]

export const PERSONALITY_LABELS: Record<Personality, string> = {
  outgoing: '开朗外向',
  introverted: '安静内敛',
  confident: '自信独立',
  gentle: '温柔细腻',
}

export const COMMUTE_LABELS: Record<Commute, string> = {
  walk: '走路',
  bike: '骑车',
  subway: '公交地铁',
  drive: '开车',
  home: '居家不出门',
}

export const SLOT_ANCHOR_DEFAULTS: Record<Slot, { anchor_x: number; anchor_y: number }> = {
  top: { anchor_x: 0.5, anchor_y: 0.28 },
  bottom: { anchor_x: 0.5, anchor_y: 0.58 },
  dress: { anchor_x: 0.5, anchor_y: 0.25 },
  outerwear: { anchor_x: 0.5, anchor_y: 0.28 },
  shoes: { anchor_x: 0.5, anchor_y: 0.82 },
  accessory: { anchor_x: 0.5, anchor_y: 0.08 },
}

export const SLOT_DEFAULT_LAYER: Record<Slot, number> = {
  shoes: 1,
  bottom: 2,
  top: 3,
  dress: 4,
  outerwear: 5,
  accessory: 6,
}

export const COMMUTE_RULES: Record<Commute, { exclude: string[]; prefer: string[] }> = {
  bike: {
    exclude: ['短裙', '凉鞋', '高跟鞋', '长外套'],
    prefer: ['裤装', '运动鞋', '短外套'],
  },
  walk: {
    exclude: ['高跟鞋', '厚底鞋'],
    prefer: ['平底鞋', '运动鞋'],
  },
  subway: { exclude: [], prefer: ['薄外套'] },
  drive: { exclude: [], prefer: [] },
  home: { exclude: [], prefer: ['舒适面料'] },
}

export const RAIN_EXCLUDE_SHOES = ['sandals', 'flats_canvas', 'sneakers_canvas']

export const RAIN_EXCLUDE_KEYWORDS = ['凉鞋', '帆布', '布']

export const NEUTRAL_COLORS = ['#FFFFFF', '#F5F5F5', '#000000', '#333333', '#666666', '#999999']

export const WEATHER_CACHE_KEY = 'weather_cache_v1'

export const ONBOARDING_STORAGE_KEY = 'outfit_onboarding_v1'

export const PRAISE_HISTORY_KEY = 'praise_history_v1'

export const SCORING_WEIGHTS = {
  cold_start: { weather: 0.55, style: 0.2, commute: 0.15, favorite: 0.1 },
  transition: { weather: 0.45, style: 0.25, commute: 0.15, favorite: 0.15 },
  mature: { weather: 0.4, style: 0.25, commute: 0.15, favorite: 0.2 },
}

export const COLD_START_THRESHOLD = 5
export const MATURE_THRESHOLD = 20

export const CANVAS_WIDTH = 375
export const CANVAS_HEIGHT = 600

export const IMAGE_MAX_WIDTH = 1024
export const IMAGE_NAKED_WIDTH = 800

export const PRAISE_HISTORY_SIZE = 10
export const MAX_RETRY_COUNT = 3
export const HEARTBEAT_TIMEOUT_MINUTES = 10
