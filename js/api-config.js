/**
 * Client-side API endpoint configuration.
 * API keys must NEVER appear here — only public URLs.
 *
 * After deploying Supabase Edge Functions (Part 3), set:
 *   window.__SUPABASE_FUNCTIONS_URL__ = 'https://YOUR_PROJECT.supabase.co/functions/v1';
 * before loading this script, or edit FUNCTIONS_BASE below.
 */
(function (global) {
  const FUNCTIONS_BASE = global.API_BASE || global.__SUPABASE_FUNCTIONS_URL__ || '';

  global.AIEndpoints = {
    /** General chat — Supabase Edge Function `ai-chat` (Part 3) */
    chat: FUNCTIONS_BASE ? `${FUNCTIONS_BASE}/ai-chat` : '/api/ai-chat',
    /** Risk assessment — Supabase Edge Function `ai-risk` (Part 3) */
    risk: FUNCTIONS_BASE ? `${FUNCTIONS_BASE}/ai-risk` : '/api/ai-risk',
  };

  global.getSessionId = function getSessionId() {
    const key = 'bcai_session_id';
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2);
      sessionStorage.setItem(key, id);
    }
    return id;
  };

  /**
   * Parse AI chat response from Edge Function or legacy server format.
   * @param {object} data
   * @returns {string}
   */
  global.parseAIChatReply = function parseAIChatReply(data) {
    if (!data) return '';
    return data.reply || data.text || '';
  };
})(window);
