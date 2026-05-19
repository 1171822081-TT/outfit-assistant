import type { Clothing, WeatherData, UserProfile, Category, Commute } from './types'
import { COMMUTE_RULES, SCORING_WEIGHTS, COLD_START_THRESHOLD, MATURE_THRESHOLD, NEUTRAL_COLORS, RAIN_EXCLUDE_KEYWORDS } from './constants'

export interface OutfitCandidate {
  top?: Clothing
  bottom?: Clothing
  dress?: Clothing
  outerwear?: Clothing
  shoes: Clothing
  accessory?: Clothing
}

interface ScoredCandidate {
  outfit: OutfitCandidate
  score: number
}

function inTempRange(item: Clothing, high: number, low: number): boolean {
  return item.temp_min <= high && item.temp_max >= low
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const c = hex.replace('#', '')
  if (c.length !== 6) return null
  const r = parseInt(c.slice(0, 2), 16) / 255
  const g = parseInt(c.slice(2, 4), 16) / 255
  const b = parseInt(c.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6
      break
    case g:
      h = ((b - r) / d + 2) / 6
      break
    case b:
      h = ((r - g) / d + 4) / 6
      break
  }
  return { h, s, l }
}

function hasColorClash(hex1: string, hex2: string): boolean {
  const a = hexToHsl(hex1)
  const b = hexToHsl(hex2)
  if (!a || !b) return false
  // Only check saturated colors — neutrals go with everything
  if (a.s < 0.15 || b.s < 0.15) return false
  // Clash if hues are complementary (150-210 degrees apart) and both saturated
  const rawDist = Math.abs(a.h - b.h) * 360
  const hueDist = Math.min(rawDist, 360 - rawDist)
  return hueDist > 150 && hueDist < 210 && a.s > 0.4 && b.s > 0.4
}

function hasStyleClash(items: Clothing[]): boolean {
  const styles = items.map((i) => i.style)
  // sport clashes with office and gentle
  if (styles.includes('sport') && (styles.includes('office') || styles.includes('gentle'))) {
    return true
  }
  // sweet clashes with cool
  if (styles.includes('sweet') && styles.includes('cool')) {
    return true
  }
  return false
}


function hasWaterproofClash(items: Clothing[], precipProbability: number): boolean {
  if (precipProbability <= 50) return false
  // When raining, outerwear should be waterproof if worn
  const outer = items.find((i) => i.category === 'outerwear')
  if (outer && !outer.waterproof) return true
  // Shoes shouldn't be absorbent materials
  const shoes = items.find((i) => i.category === 'shoes')
  if (shoes && ['cotton', 'silk', 'wool'].includes(shoes.material)) return true
  return false
}

function filterByTemperature(items: Clothing[], high: number, low: number): Clothing[] {
  return items.filter((i) => inTempRange(i, high, low))
}

function filterByRain(items: Clothing[], precipProbability: number): Clothing[] {
  if (precipProbability <= 50) return items
  return items.filter((item) => {
    if (item.category === 'shoes') {
      const sub = item.subcategory
      if (RAIN_EXCLUDE_KEYWORDS.some((kw) => sub.includes(kw))) return false
    }
    return true
  })
}

function filterByCommute(items: Clothing[], commute: Commute): Clothing[] {
  const rules = COMMUTE_RULES[commute]
  if (!rules || (rules.exclude.length === 0 && rules.prefer.length === 0)) return items
  return items.filter((item) => {
    for (const keyword of rules.exclude) {
      if (item.subcategory.includes(keyword) || item.name.includes(keyword)) {
        return false
      }
    }
    return true
  })
}

function groupByCategory(items: Clothing[]): Record<Category, Clothing[]> {
  const groups: Record<Category, Clothing[]> = {
    top: [],
    bottom: [],
    dress: [],
    outerwear: [],
    shoes: [],
    accessory: [],
  }
  for (const item of items) {
    groups[item.category].push(item)
  }
  return groups
}

function generateCandidates(groups: Record<Category, Clothing[]>): OutfitCandidate[] {
  const candidates: OutfitCandidate[] = []
  const { top, bottom, dress, outerwear, shoes, accessory } = groups

  // Dress mode: dress + shoes
  for (const d of dress) {
    for (const s of shoes) {
      if (hasStyleClash([d, s])) continue
      if (hasColorClash(d.color_hex, s.color_hex)) continue
      candidates.push({ dress: d, shoes: s })
    }
  }

  // Separates mode: top + bottom + shoes
  for (const t of top) {
    for (const b of bottom) {
      if (hasStyleClash([t, b])) continue
      if (hasColorClash(t.color_hex, b.color_hex)) continue
      for (const s of shoes) {
        if (hasStyleClash([t, b, s])) continue
        candidates.push({ top: t, bottom: b, shoes: s })
      }
    }
  }

  // Limit candidates before extending with optional items
  if (candidates.length > 50) {
    const keyOf = (c: OutfitCandidate) =>
      [c.dress?.id, c.top?.id, c.bottom?.id, c.shoes?.id].map((id) => id ?? '').join('|')
    candidates.sort((a, b) => {
      const ka = keyOf(a)
      const kb = keyOf(b)
      return ka < kb ? -1 : ka > kb ? 1 : 0
    })
    candidates.length = 50
  }

  // Extend with outerwear (optional)
  const withOuterwear: OutfitCandidate[] = []
  for (const c of candidates) {
    for (const o of outerwear) {
      const items = Object.values(c).filter(Boolean) as Clothing[]
      items.push(o)
      if (hasStyleClash(items)) continue
      withOuterwear.push({ ...c, outerwear: o })
    }
  }
  if (withOuterwear.length > 0) {
    candidates.push(...withOuterwear)
  }

  // Extend with accessory (optional)
  const withAccessory: OutfitCandidate[] = []
  for (const c of candidates.slice(0, 30)) {
    for (const a of accessory) {
      withAccessory.push({ ...c, accessory: a })
    }
  }
  if (withAccessory.length > 0) {
    candidates.push(...withAccessory)
  }

  return candidates
}

function calcWeatherScore(items: Clothing[], high: number, low: number): number {
  if (items.length === 0) return 0
  const mid = (high + low) / 2
  return (
    items.reduce((sum, item) => {
      const itemMid = (item.temp_min + item.temp_max) / 2
      const dist = Math.abs(itemMid - mid)
      // Score decreases as distance from ideal temp increases
      return sum + Math.max(0, 1 - dist / 20)
    }, 0) / items.length
  )
}

function calcStyleScore(items: Clothing[], preferredStyles: string[]): number {
  if (items.length === 0 || preferredStyles.length === 0) return 0.5
  const matches = items.filter((i) => preferredStyles.includes(i.style)).length
  return matches / items.length
}

function calcCommuteScore(items: Clothing[], commute: Commute): number {
  const rules = COMMUTE_RULES[commute]
  if (!rules || rules.prefer.length === 0) return 0.5
  const matches = items.filter((item) =>
    rules.prefer.some(
      (kw) => item.subcategory.includes(kw) || item.name.includes(kw),
    ),
  ).length
  return items.length > 0 ? matches / items.length : 0.5
}

function calcFavoriteScore(
  items: Clothing[],
  favStyleCounts: Record<string, number>,
  favCategoryCounts: Record<string, number>,
): number {
  if (items.length === 0) return 0
  const maxStyle = Math.max(1, ...Object.values(favStyleCounts))
  const maxCat = Math.max(1, ...Object.values(favCategoryCounts))
  return (
    items.reduce((sum, item) => {
      const s = (favStyleCounts[item.style] ?? 0) / maxStyle
      const c = (favCategoryCounts[item.category] ?? 0) / maxCat
      return sum + (s * 0.5 + c * 0.5)
    }, 0) / items.length
  )
}

function scoreOutfit(
  candidate: OutfitCandidate,
  weather: WeatherData,
  profile: Pick<UserProfile, 'style_prefs' | 'commute' | 'fav_style_counts' | 'fav_category_counts'>,
  weights: { weather: number; style: number; commute: number; favorite: number },
): number {
  const items = Object.values(candidate).filter(Boolean) as Clothing[]

  // Hard conflicts — return 0
  if (hasWaterproofClash(items, weather.precip_probability)) return 0

  const wScore = calcWeatherScore(items, weather.temp_high, weather.temp_low)
  const sScore = calcStyleScore(items, profile.style_prefs)
  const cScore = calcCommuteScore(items, profile.commute)
  const fScore = calcFavoriteScore(items, profile.fav_style_counts, profile.fav_category_counts)

  return weights.weather * wScore + weights.style * sScore + weights.commute * cScore + weights.favorite * fScore
}

function getScoringWeights(favTotal: number) {
  if (favTotal < COLD_START_THRESHOLD) return SCORING_WEIGHTS.cold_start
  if (favTotal < MATURE_THRESHOLD) return SCORING_WEIGHTS.transition
  return SCORING_WEIGHTS.mature
}

function relaxTemperature(items: Clothing[], high: number, low: number): Clothing[] {
  return items.filter((i) => inTempRange(i, high + 3, low - 3))
}

export interface RecommendResult {
  outfits: OutfitCandidate[]
  usedFallback: boolean
}

export function recommend(
  items: Clothing[],
  weather: WeatherData,
  profile: Pick<UserProfile, 'style_prefs' | 'commute' | 'fav_style_counts' | 'fav_category_counts'>,
): RecommendResult {
  if (items.length === 0) return { outfits: [], usedFallback: false }

  const favTotal = Object.values(profile.fav_style_counts ?? {}).reduce((a, b) => a + b, 0) +
    Object.values(profile.fav_category_counts ?? {}).reduce((a, b) => a + b, 0)

  const weights = getScoringWeights(favTotal)

  // Level 0: strict filtering
  let filtered = filterByTemperature(items, weather.temp_high, weather.temp_low)
  filtered = filterByRain(filtered, weather.precip_probability)
  filtered = filterByCommute(filtered, profile.commute)

  const groups0 = groupByCategory(filtered)
  const canMakeOutfit = (g: Record<string, Clothing[]>) =>
    g.shoes.length > 0 && (g.dress.length > 0 || (g.top.length > 0 && g.bottom.length > 0))

  let usedFallback = false

  // Level 1: relax temperature ±3°C
  if (!canMakeOutfit(groups0)) {
    filtered = relaxTemperature(items, weather.temp_high, weather.temp_low)
    filtered = filterByRain(filtered, weather.precip_probability)
    filtered = filterByCommute(filtered, profile.commute)
    usedFallback = true
  }

  const groups1 = groupByCategory(filtered)

  // Level 2: drop commute filter
  if (!canMakeOutfit(groups1)) {
    filtered = relaxTemperature(items, weather.temp_high, weather.temp_low)
    filtered = filterByRain(filtered, weather.precip_probability)
    usedFallback = true
  }

  const groups2 = groupByCategory(filtered)

  // Level 3: drop rain filter
  if (!canMakeOutfit(groups2)) {
    filtered = relaxTemperature(items, weather.temp_high, weather.temp_low)
    usedFallback = true
  }

  // Level 4: use all items
  if (!canMakeOutfit(groupByCategory(filtered))) {
    filtered = items
    usedFallback = true
  }

  const groups = groupByCategory(filtered)

  // Must have at least shoes and (dress or top+bottom)
  const hasDress = groups.dress.length > 0
  const hasSeparates = groups.top.length > 0 && groups.bottom.length > 0
  if (!hasDress && !hasSeparates) {
    return { outfits: [], usedFallback: true }
  }
  if (groups.shoes.length === 0) {
    return { outfits: [], usedFallback: true }
  }

  const candidates = generateCandidates(groups)

  const scored: ScoredCandidate[] = candidates.map((c) => ({
    outfit: c,
    score: scoreOutfit(c, weather, profile, weights),
  }))

  scored.sort((a, b) => b.score - a.score)

  // Deduplicate: keep highest-scoring version of same items
  const seen = new Set<string>()
  const unique: ScoredCandidate[] = []
  for (const s of scored) {
    const key = outfitKey(s.outfit)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(s)
  }

  const top3 = unique.slice(0, 3).map((s) => s.outfit)
  return { outfits: top3, usedFallback }
}

function outfitKey(o: OutfitCandidate): string {
  return [o.dress?.id, o.top?.id, o.bottom?.id, o.outerwear?.id, o.shoes?.id, o.accessory?.id]
    .map((id) => id ?? '')
    .join('|')
}
