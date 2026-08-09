/**
 * Supabase public configuration (safe to commit — anon/publishable key is protected by RLS).
 *
 * Setup (GitHub Pages or local static hosting):
 * 1. Copy this file to js/supabase-config.js (that file is gitignored).
 * 2. Set window.SUPABASE_URL from Supabase Dashboard → Project Settings → API → Project URL.
 * 3. Set window.SUPABASE_ANON_KEY to the anon / publishable key (NOT service_role, NOT database password).
 *
 * Script order on pages with forms:
 *   @supabase/supabase-js (CDN) → supabase-config.js → supabase-client.js → page scripts
 */
window.SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
window.SUPABASE_ANON_KEY = 'PASTE_YOUR_ANON_OR_PUBLISHABLE_KEY_HERE';
