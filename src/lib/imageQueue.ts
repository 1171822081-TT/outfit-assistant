import { supabase } from './supabase'
import type { ImageQueue } from './types'
import type { Database } from './database.types'

type ImageQueueUpdate = Database['public']['Tables']['image_queue']['Update']

const STALE_TIMEOUT_MINUTES = 5

export async function recoverStaleQueue(): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_TIMEOUT_MINUTES * 60 * 1000).toISOString()

  const { data: stale, error } = await supabase
    .from('image_queue')
    .select('id, retry_count')
    .eq('status', 'processing')
    .lt('last_heartbeat', cutoff)
    .returns<Pick<ImageQueue, 'id' | 'retry_count'>[]>()

  if (error || !stale || stale.length === 0) return

  for (const record of stale) {
    const retryCount = (record.retry_count ?? 0) + 1
    if (retryCount >= 3) {
      const updateData: ImageQueueUpdate = {
        status: 'failed',
        error_message: '处理超时，已达最大重试次数',
        retry_count: retryCount,
        last_heartbeat: null,
      }
      await supabase.from('image_queue').update(updateData).eq('id', record.id)
    } else {
      const updateData: ImageQueueUpdate = {
        status: 'pending',
        retry_count: retryCount,
        last_heartbeat: null,
      }
      await supabase.from('image_queue').update(updateData).eq('id', record.id)
    }
  }
}

export async function updateHeartbeat(queueId: string): Promise<void> {
  const updateData: ImageQueueUpdate = { last_heartbeat: new Date().toISOString() }
  await supabase.from('image_queue').update(updateData).eq('id', queueId)
}
