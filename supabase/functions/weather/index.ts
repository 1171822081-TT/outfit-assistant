import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const QWEATHER_HOST = Deno.env.get('VITE_QWEATHER_API_HOST') ?? ''
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WeatherResponse {
  temp_high: number
  temp_low: number
  weather_type: string
  wind_level: number
  precip_probability: number
  humidity: number
  fetched_at: string
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: '请使用 POST 请求' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { lat, lon } = await req.json()

    if (lat == null || lon == null) {
      return new Response(
        JSON.stringify({ success: false, error: '缺少 lat/lon 参数' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    let weather: WeatherResponse | null = null

    // 优先和风天气
    if (QWEATHER_HOST) {
      weather = await fetchQWeather(lat, lon)
    }

    // 降级到 Open-Meteo (免费，无需 API Key)
    if (!weather) {
      weather = await fetchOpenMeteo(lat, lon)
    }

    return new Response(
      JSON.stringify({ success: true, data: weather }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : '天气获取失败'
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})

async function fetchQWeather(lat: number, lon: number): Promise<WeatherResponse | null> {
  try {
    const location = `${lon.toFixed(2)},${lat.toFixed(2)}`
    const url = `https://${QWEATHER_HOST}/v7/weather/3d?location=${location}`

    const res = await fetch(url)
    if (!res.ok) return null

    const json = await res.json()
    if (json.code !== '200' || !json.daily?.length) return null

    const today = json.daily[0]
    return {
      temp_high: parseInt(today.tempMax, 10),
      temp_low: parseInt(today.tempMin, 10),
      weather_type: today.textDay ?? '未知',
      wind_level: windSpeedToLevel(today.windSpeedDay ?? 0),
      precip_probability: parseInt(today.precip ?? '0', 10),
      humidity: parseInt(today.humidity ?? '50', 10),
      fetched_at: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

async function fetchOpenMeteo(lat: number, lon: number): Promise<WeatherResponse> {
  const url = [
    'https://api.open-meteo.com/v1/forecast',
    `?latitude=${lat}&longitude=${lon}`,
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,weathercode',
    '&timezone=Asia/Shanghai',
  ].join('')

  const res = await fetch(url)
  const json = await res.json()
  const daily = json.daily

  return {
    temp_high: Math.round(daily.temperature_2m_max[0]),
    temp_low: Math.round(daily.temperature_2m_min[0]),
    weather_type: wmoToText(daily.weathercode[0]),
    wind_level: windSpeedToLevel(daily.wind_speed_10m_max[0] ?? 0),
    precip_probability: daily.precipitation_probability_max?.[0] ?? 0,
    humidity: 50,
    fetched_at: new Date().toISOString(),
  }
}

function windSpeedToLevel(speedKmh: number): number {
  if (speedKmh <= 1) return 0
  if (speedKmh <= 5) return 1
  if (speedKmh <= 11) return 2
  if (speedKmh <= 19) return 3
  if (speedKmh <= 28) return 4
  if (speedKmh <= 38) return 5
  if (speedKmh <= 49) return 6
  return 7
}

function wmoToText(code: number): string {
  if (code <= 1) return '晴'
  if (code === 2) return '多云'
  if (code === 3) return '阴'
  if (code <= 48) return '雾'
  if (code <= 57) return '毛毛雨'
  if (code <= 67) return '雨'
  if (code <= 77) return '雪'
  if (code <= 82) return '阵雨'
  if (code <= 86) return '阵雪'
  return '雷阵雨'
}
