/**
 * Mid-Roll Ad Decision Service
 * 
 * Isolated service for mid-roll video ad logic.
 * Does NOT import or depend on any existing ad system code.
 */
import { supabase } from '../lib/supabaseClient';

export interface MidRollAdSlot {
  id: string;
  post_id: string;
  ad_position_seconds: number;
  created_at: string;
}

export interface MidRollAd {
  id: string;
  title: string;
  description: string;
  media_url: string;
  redirect_url: string;
  advertiser_name: string;
  pricing_model: 'cpc' | 'cpm';
}

// Max impressions per user per session to enforce frequency cap
const MAX_MIDROLL_IMPRESSIONS_PER_SESSION = 6;

/**
 * Fetch ad slots for a specific video post.
 */
export async function getAdSlots(postId: string): Promise<MidRollAdSlot[]> {
  try {
    const { data, error } = await supabase
      .from('video_ad_slots')
      .select('*')
      .eq('post_id', postId)
      .order('ad_position_seconds', { ascending: true });

    if (error) {
      console.warn('[MidRoll] Failed to fetch ad slots:', error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn('[MidRoll] Error in getAdSlots:', e);
    return [];
  }
}

/**
 * Request a mid-roll ad from the active ads pool.
 * Returns null if no eligible ad is found (failsafe: video continues).
 */
export async function requestMidRollAd(params: {
  userId: string;
  postId: string;
  category?: string;
}): Promise<MidRollAd | null> {
  try {
    // Check frequency cap first
    const { count } = await supabase
      .from('midroll_ad_impressions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', params.userId);

    if ((count || 0) >= MAX_MIDROLL_IMPRESSIONS_PER_SESSION) {
      console.log('[MidRoll] Frequency cap reached for user');
      return null;
    }

    // Fetch a random active ad with remaining budget
    const { data, error } = await supabase
      .from('ads')
      .select('id, title, description, media_url, redirect_url, advertiser_name, pricing_model')
      .eq('status', 'active')
      .gt('budget_remaining', 0)
      .limit(10);

    if (error || !data || data.length === 0) {
      console.log('[MidRoll] No eligible ads found');
      return null;
    }

    // Pick a random ad from eligible pool
    const randomIndex = Math.floor(Math.random() * data.length);
    return data[randomIndex] as MidRollAd;
  } catch (e) {
    console.warn('[MidRoll] Error in requestMidRollAd:', e);
    return null; // Failsafe: never block video
  }
}

/**
 * Track a mid-roll impression via Supabase RPC.
 * Fails silently — never blocks playback.
 */
export async function trackMidRollImpression(
  adId: string,
  postId: string,
  userId: string,
  slotPosition: number
): Promise<void> {
  try {
    await supabase.rpc('track_midroll_impression', {
      p_ad_id: adId,
      p_post_id: postId,
      p_user_id: userId,
      p_slot_position: slotPosition,
    });
  } catch (e) {
    console.warn('[MidRoll] Impression tracking failed (non-blocking):', e);
  }
}

/**
 * Track a mid-roll click via Supabase RPC.
 * Fails silently — never blocks playback.
 */
export async function trackMidRollClick(
  adId: string,
  postId: string,
  userId: string
): Promise<void> {
  try {
    await supabase.rpc('track_midroll_click', {
      p_ad_id: adId,
      p_post_id: postId,
      p_user_id: userId,
    });
  } catch (e) {
    console.warn('[MidRoll] Click tracking failed (non-blocking):', e);
  }
}
