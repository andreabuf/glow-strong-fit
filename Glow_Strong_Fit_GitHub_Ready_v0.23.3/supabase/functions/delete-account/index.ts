// Glow Strong Fit — authenticated account deletion, server-side only.
// Deploy with --no-verify-jwt when using a Supabase publishable key, because this
// function verifies the bearer token with Supabase Auth directly.
// Required built-in secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
// NEVER copy the service-role key into dev/index.html.
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Content-Type': 'application/json; charset=utf-8',
};
function json(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), { status, headers });
}
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed.' });
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anon || !service) return json(503, { error: 'Deletion service is not configured.' });
  const token = (req.headers.get('Authorization') || '').match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json(401, { error: 'Please sign in again.' });
  let input: { confirm?: string; password?: string };
  try { input = await req.json(); } catch { return json(400, { error: 'Invalid request.' }); }
  if (input.confirm !== 'DELETE' || typeof input.password !== 'string' || !input.password) {
    return json(400, { error: 'Password and DELETE confirmation are required.' });
  }
  try {
    // Validate the caller's access token; never trust a client-supplied user ID.
    const current = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${token}` },
    });
    if (!current.ok) return json(401, { error: 'Your session expired. Please log in again.' });
    const user = await current.json();
    if (!user?.id || !user?.email) return json(401, { error: 'Invalid account session.' });

    // Independently verify current password on the server before deletion.
    const login = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: anon, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: input.password }),
    });
    if (!login.ok) return json(403, { error: 'Current password is incorrect.' });
    const verified = await login.json();
    if (verified?.user?.id !== user.id) return json(403, { error: 'Could not verify account ownership.' });

    // Admin endpoint can only be called here, with the server-only service-role key.
    // The recommended database FK (see README) cascades gsf_user_data on deletion.
    const removeUser = await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
      method: 'DELETE',
      headers: { apikey: service, Authorization: `Bearer ${service}` },
    });
    if (!removeUser.ok) {
      console.error('Auth deletion failed:', removeUser.status);
      return json(500, { error: 'Could not delete the account. Please try again.' });
    }

    // Defense-in-depth: clean up the app data row if not already cascaded.
    const cleanup = await fetch(`${url}/rest/v1/gsf_user_data?user_id=eq.${encodeURIComponent(user.id)}`, {
      method: 'DELETE',
      headers: { apikey: service, Authorization: `Bearer ${service}`, Prefer: 'return=minimal' },
    });
    if (!cleanup.ok) {
      // Account is already deleted; never tell the client that it still exists.
      console.error('Account deleted, app-data cleanup needs review:', cleanup.status);
      return json(200, { deleted: true, cleanup_warning: true });
    }
    return json(200, { deleted: true });
  } catch (error) {
    console.error('Delete account error:', error instanceof Error ? error.message : 'Unknown');
    return json(500, { error: 'Deletion service encountered an error. Please try again.' });
  }
});
