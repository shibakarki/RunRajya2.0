import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useEditProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Updates profile data.
   * Also synchronizes change mutations to Auth User Metadata.
   */
  const updateProfile = async (userId, { name, newFactionId, dailyTargetM }) => {
    setLoading(true);
    setError(null);

    try {
      if (!userId) throw new Error('Valid User ID required to edit profile.');

      // 1. Process secure atomic faction change transaction in database
      if (newFactionId) {
        const { error: rpcErr } = await supabase.rpc('switch_faction_atomic', {
          target_user_id: userId,
          new_faction: newFactionId
        });

        if (rpcErr) throw rpcErr;
      }

      // 2. Perform target and name mutations using upsert to prevent silent failures
      const payload = { id: userId };
      if (name) payload.name = name;
      if (newFactionId) payload.faction_id = newFactionId;
      if (dailyTargetM) payload.daily_target_m = parseInt(dailyTargetM, 10);

      const { error: updateErr } = await supabase
        .from('profiles')
        .upsert(payload);

      if (updateErr) throw updateErr;

      // 3. Synchronize changes to Auth User Metadata to prevent cache lag
      const { error: authErr } = await supabase.auth.updateUser({
        data: {
          ...(name ? { full_name: name } : {}),
          ...(newFactionId ? { faction_id: newFactionId } : {}),
          ...(dailyTargetM ? { daily_target_m: parseInt(dailyTargetM, 10) } : {})
        }
      });

      if (authErr) throw authErr;

      return { success: true };
    } catch (err) {
      console.error('Failed to commit profile updates:', err);
      setError(err.message || 'Mutation failed.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { updateProfile, loading, error };
}