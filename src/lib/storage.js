/**
 * Phere Storage Layer — Supabase-backed with localStorage fallback
 * Syncs wedding data to Supabase in real-time while keeping localStorage as cache.
 */
import { supabase } from './supabase';

const STORAGE_PREFIX = 'phere_';
let _memoryStore = {};

// ========== HELPER ==========
function localGet(key) {
  try {
    const val = localStorage.getItem(STORAGE_PREFIX + key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

function localSet(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    _memoryStore[key] = value;
  }
}

function localDelete(key) {
  try { localStorage.removeItem(STORAGE_PREFIX + key); } catch {}
  delete _memoryStore[key];
}

// ========== SUPABASE SYNC ==========
async function supabaseGet(userId) {
  try {
    const { data, error } = await supabase
      .from('wedding_data')
      .select('data')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data?.data || null;
  } catch (e) {
    console.warn('[Storage] Supabase get failed, using local cache:', e.message);
    return null;
  }
}

async function supabaseSet(userId, value) {
  try {
    const { error } = await supabase
      .from('wedding_data')
      .upsert({
        user_id: userId,
        data: value,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Storage] Supabase set failed, saved locally:', e.message);
    return false;
  }
}

// ========== TRASH OPERATIONS ==========
export async function moveToTrash(userId, itemType, itemData) {
  try {
    const { error } = await supabase
      .from('deleted_items')
      .insert({
        user_id: userId,
        item_type: itemType,
        item_data: itemData
      });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Storage] moveToTrash failed:', e.message);
    return false;
  }
}

// ========== PUBLIC API ==========
// This is the async window.storage interface the monolith expects
const storage = {
  async get(key) {
    // Try to get the current user
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (userId && key === 'phere-v3') {
      // Try Supabase first
      const remoteData = await supabaseGet(userId);
      if (remoteData) {
        // Cache locally
        localSet(key, remoteData);
        return { value: JSON.stringify(remoteData) };
      }
    }

    // Fallback to local
    const localVal = localGet(key);
    return { value: localVal ? JSON.stringify(localVal) : null };
  },

  async set(key, value) {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    localSet(key, parsed);

    // Try to sync to Supabase
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (userId && key === 'phere-v3') {
      await supabaseSet(userId, parsed);
    }
  },

  async delete(key) {
    localDelete(key);
  }
};

// ========== INIT ==========
export function initStorage() {
  window.storage = storage;
  console.log('[Phere] Storage initialized (Supabase + localStorage)');
}

export default storage;
