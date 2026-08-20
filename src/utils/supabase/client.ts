import { createBrowserClient } from "@supabase/ssr";

// Fallback empty strings prevent build-time crash during static prerendering.
// Real values are always present at runtime via Vercel environment variables.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? 'placeholder';

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
