/**
 * Supabase browser client and insert helpers for write-only public forms.
 * Requires: @supabase/supabase-js (CDN), js/supabase-config.js loaded first.
 */
(function (global) {
  let client = null;

  const PLACEHOLDER_KEYS = new Set([
    'PASTE_YOUR_ANON_KEY_HERE',
    'PASTE_YOUR_ANON_OR_PUBLISHABLE_KEY_HERE',
  ]);

  function isKeyConfigured(key) {
    if (!key || typeof key !== 'string') return false;
    const trimmed = key.trim();
    if (!trimmed || PLACEHOLDER_KEYS.has(trimmed)) return false;
    if (trimmed.includes('YOUR_PROJECT') || trimmed.includes('PASTE_YOUR')) return false;
    return true;
  }

  function isUrlConfigured(url) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return trimmed.length > 0 && !trimmed.includes('YOUR_PROJECT_REF');
  }

  function getClient() {
    if (client) return client;

    const url = global.SUPABASE_URL;
    const key = global.SUPABASE_ANON_KEY;

    if (!isUrlConfigured(url) || !isKeyConfigured(key)) {
      console.warn(
        'Supabase not configured. Copy js/supabase-config.example.js to js/supabase-config.js and set your URL and anon key.'
      );
      return null;
    }

    if (!global.supabase || typeof global.supabase.createClient !== 'function') {
      console.error('Supabase JS library not loaded. Add the CDN script before supabase-client.js');
      return null;
    }

    client = global.supabase.createClient(url, key);
    return client;
  }

  function formatError(error) {
    if (!error) return 'Unknown error';
    return error.message || error.details || error.hint || String(error);
  }

  global.SupabaseDB = {
    getClient,

    isConfigured() {
      return isUrlConfigured(global.SUPABASE_URL) && isKeyConfigured(global.SUPABASE_ANON_KEY);
    },

    async insertAppointment(row) {
      const sb = getClient();
      if (!sb) {
        return { success: false, error: 'Supabase is not configured' };
      }

      // No .select() — anon RLS typically allows INSERT only, not SELECT
      const { error } = await sb.from('appointments').insert([{
        name: row.name,
        email: row.email,
        phone: row.phone,
        hospital: row.hospital || null,
        date: row.date || null,
        time: row.time || null,
        appointment_type: row.appointmentType || row.appointment_type || null,
        message: row.message || null,
        status: 'pending',
      }]);

      if (error) {
        return { success: false, error: formatError(error) };
      }
      return { success: true };
    },

    async insertContactMessage(row) {
      const sb = getClient();
      if (!sb) {
        return { success: false, error: 'Supabase is not configured' };
      }

      const { error } = await sb.from('contact_messages').insert([{
        name: row.name,
        email: row.email,
        subject: row.subject || null,
        message: row.message,
        type: row.type || 'general',
      }]);

      if (error) {
        return { success: false, error: formatError(error) };
      }
      return { success: true };
    },

    async insertCommunityMember(row) {
      const sb = getClient();
      if (!sb) {
        return { success: false, error: 'Supabase is not configured' };
      }

      const { error } = await sb.from('community_members').insert([{
        name: row.name,
        email: row.email,
        group_name: row.groupName || row.group_name,
      }]);

      if (error) {
        return { success: false, error: formatError(error) };
      }
      return { success: true };
    },
  };

  global.getSupabaseClient = getClient;
  Object.defineProperty(global, 'supabaseClient', {
    configurable: true,
    get() {
      return getClient();
    },
  });
})(window);
