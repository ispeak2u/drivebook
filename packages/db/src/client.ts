import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@drivebook/config";

/**
 * The single Supabase client for the monorepo.
 *
 * Services import `supabase` from here and never call `createClient`
 * themselves. One client means one place where connection settings, auth
 * behaviour, and future instrumentation live, rather than a per-service
 * variation nobody audits.
 *
 * See AGENT_INSTRUCTIONS.md.
 */

/**
 * Service-role client. Bypasses Row Level Security.
 *
 * Use only in backend services that have already authorised the caller.
 * Never expose this client, or the key behind it, to a browser or mobile
 * bundle: it can read and write every row in the database.
 */
export const supabase: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      // Backend services are stateless. Persisting or refreshing a session
      // here would leak one request's identity into the next.
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

/**
 * Anon-key client. Row Level Security applies.
 *
 * Use for anything acting on behalf of an end user, so the database
 * enforces access rules rather than trusting application code to.
 */
export const supabaseAnon: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
