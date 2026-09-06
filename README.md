# Relay
A nightly game for your group chat. One rotating minigame a day, nobody sees the answers until they've played, and the whole group shares a streak.

See `relay-spec.md` for the product spec, `PRODUCT.md` for durable product context, and `DESIGN.md` for the visual system.

## Stack

Next.js (App Router) on Vercel, Supabase (Auth, Postgres, Storage). The round lifecycle (open/reveal/settle, streaks, freezes, tokens) runs entirely in Postgres via `tick()`, scheduled every minute by `pg_cron` — Vercel's Hobby-tier cron is once-a-day, which can't drive a per-group nightly window.

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in the values below.

## Setup this project still needs from you

These can't be done via API/MCP and are one-time steps:

1. **Google OAuth** (for "Continue with Google" on the join screen):
   - Create an OAuth client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (type: Web application).
   - Authorized redirect URI: `https://<your-supabase-ref>.supabase.co/auth/v1/callback`.
   - In the Supabase dashboard → Authentication → Sign In / Providers → Google: paste the client ID and secret, enable the provider.
   - In Authentication → URL Configuration: add your deployed Vercel URL as a redirect URL and site URL.

2. **Supabase service role key** (powers `/api/push/open`, `/api/push/reminder`, `/api/photos/purge` — the three webhook routes `pg_net` calls from inside `tick()`, which need to act across every user regardless of RLS):
   - Supabase dashboard → Project Settings → API → copy the `service_role` key.
   - Add it locally to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`, and to Vercel's project env vars.

3. **Vercel environment variables** (Project Settings → Environment Variables — copy every value already in your local `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (from step 2)
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (web push; generate your own with `npx web-push generate-vapid-keys` if you want fresh ones)
   - `RELAY_WEBHOOK_SECRET` (any long random string — must match what's stored in the database's `app_settings` table, see below)
   - `NEXT_PUBLIC_APP_URL` — your production URL (e.g. `https://relay-plum-gamma-13.vercel.app`), used for the OAuth redirect

4. **`app_settings` table** (lets `tick()` reach your deployed app — already set once during development, but re-check if you redeploy to a different URL or rotate the webhook secret):
   ```sql
   update app_settings set value = 'https://your-production-url' where key = 'app_url';
   update app_settings set value = 'your-RELAY_WEBHOOK_SECRET-value' where key = 'webhook_secret';
   ```

5. **Confirm "Confirm email" stays off** in Supabase Auth → Sign In / Providers → Email. Relay signs up users with a synthetic `@id.relay.app` address (no real inbox), so a confirmation-required flow would permanently lock every username/password signup out.

## Database

Schema lives in `supabase/migrations/*.sql`, applied in order. They were built and verified directly against the live project rather than through the Supabase CLI's local-stack workflow, so there's no `supabase/config.toml` — if you want local Postgres for development, `supabase init` and re-apply these migrations against it.
