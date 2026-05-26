export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

/** Publishable key (new) or anon key (legacy) */
export function getSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function hasSupabaseEnv() {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  return Boolean(url && key);
}
