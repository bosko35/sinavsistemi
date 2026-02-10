'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markVideoAsCompleted(videoId: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Check if already completed to avoid unnecessary updates
    const { data: existing } = await supabase
        .from('user_progress')
        .select('status')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .single()

    if (existing && existing.status === 'completed') {
        return { success: true }
    }

    const { error } = await supabase
        .from('user_progress')
        .upsert({
            user_id: user.id,
            video_id: videoId,
            status: 'completed',
            last_watched_at: new Date().toISOString(),
        }, { onConflict: 'user_id, video_id' })

    if (error) {
        console.error('Error marking video complete:', error)
        return { error: 'Failed to update progress' }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function markVideoAsStarted(videoId: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Only insert if not exists (don't overwrite completed status)
    const { data: existing } = await supabase
        .from('user_progress')
        .select('status')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .single()

    if (existing) return { success: true }

    const { error } = await supabase
        .from('user_progress')
        .insert({
            user_id: user.id,
            video_id: videoId,
            status: 'started',
            last_watched_at: new Date().toISOString(),
        })

    if (error) {
        // Ignore unique constraint error if multiple calls happen quickly
        if (error.code !== '23505') {
            console.error('Error marking video started:', error)
            return { error: 'Failed to update progress' }
        }
    }

    revalidatePath('/dashboard')
    return { success: true }
}
