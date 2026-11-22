import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// fetch wrapper for the Express API: attaches the Supabase JWT as a Bearer token.
export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body && { 'Content-Type': 'application/json' }),
      ...(session && { Authorization: `Bearer ${session.access_token}` }),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.code = data?.error?.code;
    throw err;
  }
  return data;
}
