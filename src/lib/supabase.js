const SUPABASE_URL = (process.env.REACT_APP_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

const SESSION_KEY = 'english_vault_supabase_session_v1';

function assertConfigured() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase is not configured yet.');
  }
}

async function request(path, { method = 'GET', body, token, headers = {} } = {}) {
  assertConfigured();
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!response.ok) {
    const message = data?.msg || data?.message || data?.error_description || data?.error || `Request failed (${response.status})`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }
  return data;
}

function normaliseSession(payload) {
  if (!payload?.access_token) return null;
  const expiresAt = payload.expires_at || Math.floor(Date.now() / 1000) + (payload.expires_in || 3600);
  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: expiresAt,
    user: payload.user,
  };
}

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeSession(session) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function signIn(email, password) {
  const payload = await request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });
  const session = normaliseSession(payload);
  storeSession(session);
  return session;
}

export async function signUp(email, password) {
  const redirectTo = encodeURIComponent(window.location.origin);
  const payload = await request(`/auth/v1/signup?redirect_to=${redirectTo}`, {
    method: 'POST',
    body: { email, password },
  });
  const session = normaliseSession(payload);
  if (session) storeSession(session);
  return { session, user: payload?.user || null };
}

export async function refreshSession(session) {
  if (!session?.refresh_token) return null;
  const payload = await request('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: { refresh_token: session.refresh_token },
  });
  const next = normaliseSession(payload);
  storeSession(next);
  return next;
}

export async function ensureFreshSession(session) {
  if (!session) return null;
  const now = Math.floor(Date.now() / 1000);
  if ((session.expires_at || 0) - now > 90) return session;
  try {
    return await refreshSession(session);
  } catch {
    storeSession(null);
    return null;
  }
}

export async function signOut(session) {
  try {
    if (session?.access_token) {
      await request('/auth/v1/logout', { method: 'POST', token: session.access_token });
    }
  } catch {
    // Local sign-out should still work if the network request fails.
  }
  storeSession(null);
}

export async function fetchEntries(session) {
  return request('/rest/v1/entries?select=id,data,created_at,updated_at&order=created_at.asc', {
    token: session.access_token,
  });
}

export async function insertEntry(session, userId, record) {
  const { __backendId, ...clean } = record;
  const rows = await request('/rest/v1/entries?select=id,data,created_at,updated_at', {
    method: 'POST',
    token: session.access_token,
    headers: { Prefer: 'return=representation' },
    body: {
      user_id: userId,
      data: clean,
      created_at: clean.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  });
  return rows?.[0] || null;
}

export async function updateEntry(session, id, record) {
  const { __backendId, ...clean } = record;
  const rows = await request(`/rest/v1/entries?id=eq.${encodeURIComponent(id)}&select=id,data,created_at,updated_at`, {
    method: 'PATCH',
    token: session.access_token,
    headers: { Prefer: 'return=representation' },
    body: { data: clean, updated_at: new Date().toISOString() },
  });
  return rows?.[0] || null;
}

export async function deleteEntry(session, id) {
  await request(`/rest/v1/entries?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token: session.access_token,
  });
}

export async function clearEntries(session) {
  await request('/rest/v1/entries?id=not.is.null', {
    method: 'DELETE',
    token: session.access_token,
  });
}

export { SUPABASE_URL, SUPABASE_KEY };
