import { z } from "zod";

/**
 * Environment variable schema.
 *
 * This is the enforcement point for configuration. Reading `process.env`
 * directly anywhere else in the monorepo is a defect: it bypasses validation
 * and lets a service boot with a missing or malformed secret, failing later
 * at request time instead of immediately at startup.
 *
 * See AGENT_INSTRUCTIONS.md.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Stripe Connect. DriveBook does not use Stripe Subscriptions.
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),

  // Shared secret for service-to-service calls, sent as X-Internal-Key.
  INTERNAL_SERVICE_KEY: z.string().min(32),

  // Maps
  MAPBOX_ACCESS_TOKEN: z.string().min(1),

  // Notifications
  RESEND_API_KEY: z.string().min(1),
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_FROM_NUMBER: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parses and validates the environment once, at module load.
 *
 * Deliberately throws on failure rather than returning a partial object.
 * A service that cannot read its configuration should refuse to start,
 * loudly, rather than run in an unknown state.
 */
const parseEnv = (): Env => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Invalid environment configuration:\n${missing}\n\n` +
        "Check your .env file against .env.example.",
    );
  }

  return result.data;
};

export const env: Env = parseEnv();
