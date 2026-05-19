export type Category = 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessory'

export type Style = 'casual' | 'office' | 'sport' | 'sweet' | 'cool' | 'gentle'

export type Thickness = 'thin' | 'medium' | 'thick' | 'down'

export type Material = 'cotton' | 'denim' | 'leather' | 'rubber' | 'wool' | 'down' | 'silk' | 'polyester' | 'canvas'

export type ClothingStatus = 'active' | 'stored' | 'idle'

export type Personality = 'outgoing' | 'introverted' | 'confident' | 'gentle'

export type Commute = 'walk' | 'bike' | 'subway' | 'drive' | 'home'

export type QueueStatus = 'pending' | 'processing' | 'retrying' | 'done' | 'failed' | 'skipped'

export type Slot = 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessory'

export interface Clothing {
  id: string
  name: string
  category: Category
  subcategory: string
  color: string
  color_hex: string
  style: Style
  thickness: Thickness
  waterproof: boolean
  material: Material
  temp_min: number
  temp_max: number
  image_original: string | null
  image_naked: string | null
  anchor_x: number
  anchor_y: number
  scale_x: number
  scale_y: number
  status: ClothingStatus
  user_id: string
  created_at: string
  updated_at: string
}

export interface WeatherCondition {
  temp_high: number
  temp_low: number
  weather_type: string
  wind_level: number
  precip_probability: number
  humidity: number
}

export interface Outfit {
  id: string
  name: string
  is_recommended: boolean
  weather_condition: WeatherCondition | null
  is_favorite: boolean
  style: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export interface OutfitItem {
  id: string
  outfit_id: string
  clothing_id: string
  slot: Slot
  layer_order: number
}

export interface OutfitWithItems extends Outfit {
  items: (OutfitItem & { clothing: Clothing })[]
}

export interface Diary {
  id: string
  date: string
  outfit_id: string | null
  weather_info: WeatherCondition | null
  rating: number
  note: string | null
  user_id: string
  created_at: string
}

export interface UserProfile {
  user_id: string
  style_prefs: Style[]
  personality: Personality
  commute: Commute
  onboarding_done: boolean
  fav_style_counts: Record<string, number>
  fav_category_counts: Record<string, number>
  fav_color_counts: Record<string, number>
  fav_clothing_ids: number[]
  fav_patterns: { slots: string[]; count: number }[]
}

export interface Compliment {
  id: string
  text: string
  tags: string[]
  personality_tags: Personality[]
  is_fallback: boolean
}

export interface ImageQueue {
  id: string
  clothing_id: string
  user_id: string
  original_url: string
  status: QueueStatus
  error_message: string | null
  retry_count: number
  last_heartbeat: string | null
}

export interface WeatherData {
  temp_high: number
  temp_low: number
  weather_type: string
  wind_level: number
  precip_probability: number
  humidity: number
  fetched_at: string
}
