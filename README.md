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

## Public testing

Relay is already public — there's no separate "release" step. Anyone with the link can sign up:

**https://relay-plum-gamma-13.vercel.app**

To get friends in, send them a group **invite link** (`/j/<CODE>`, from the group page's "Invite friends" button) rather than the bare URL — the link carries them into your group automatically once they've signed up. A group needs **three members** before a game will open at all, and four before vote-scored games (photos, writing) are eligible.

Works right now with no further setup: sign-up, groups, all 19 games, voting, streaks, freezes, tokens, the shop and both leaderboards.

Does **not** work until the environment variables below are set on Vercel:

- **Push notifications** — nobody gets nudged when a game opens; the home screen's live state is the fallback.
- **Automatic photo deletion.** The spec's promise is that photos are deleted from storage when a round settles, and that a reported photo is deleted rather than just hidden. Both happen through a webhook that is currently rejecting calls, so **photos are being retained**. Reporting still hides an image from the group immediately. Worth closing before testing with anyone outside your friend group.

Google sign-in is hidden unless `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`, so testers don't meet a button that errors. Username and password is the simplest path for testing — you can skip Google entirely.

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
   - `RELAY_WEBHOOK_SECRET` (must match what's stored in the database's `app_settings` table, see below). **Currently unset in production**, which is why push and photo deletion don't run.
   - `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` — set to `true` only after step 1, to show the Google button

   Set these as **Config** (plaintext) for the `NEXT_PUBLIC_*` ones — Next.js inlines them at build time, so they can't be stored as Sensitive — and as **Sensitive** for the service-role key, VAPID private key, and webhook secret. Redeploy afterwards; `NEXT_PUBLIC_*` values only take effect in a fresh build.

4. **`app_settings` table** (lets `tick()` reach your deployed app — already set once during development, but re-check if you redeploy to a different URL or rotate the webhook secret):
   ```sql
   update app_settings set value = 'https://your-production-url' where key = 'app_url';
   update app_settings set value = 'your-RELAY_WEBHOOK_SECRET-value' where key = 'webhook_secret';
   ```

5. **Confirm "Confirm email" stays off** in Supabase Auth → Sign In / Providers → Email. Relay signs up users with a synthetic `@id.relay.app` address (no real inbox), so a confirmation-required flow would permanently lock every username/password signup out.

## Admin panel

The account with username `test1` is flagged `profiles.is_admin` (migration `0018_admin.sql`). Signed in as that account, **Me → Admin panel** (`/admin`) can:

- open any game in one of its own groups right now, ignoring the nightly window and player minimums (replacing tonight's round if one exists — confirmed inline, deletes that round's submissions);
- reveal a live round immediately, or close voting and settle it immediately;
- own every shop cosmetic for free (the Shop also shows a "Free (admin)" action per item).

To make another account an admin: `update profiles set is_admin = true where username = '...'`. Clients can't set that column themselves.

## Installing as an app (PWA)

Relay is a normal website that installs to the home screen — there is no app store listing. In the app, **Me → Install & notifications** (`/install`) walks through it per platform (iOS Safari: Share → Add to Home Screen; Android Chrome: the install prompt or ⋮ → Install app). Two things worth knowing:

- The installed app has its own login storage, so a user may be asked to sign in once more there — that's why Relay uses real accounts instead of device storage.
- Push notifications only reach iPhones from the installed app (and not at all for EU users on iOS 17.4+); the home tab's "3 of 6 played" state is the fallback that never depends on them.

## Database

Schema lives in `supabase/migrations/*.sql`, applied in order. They were built and verified directly against the live project rather than through the Supabase CLI's local-stack workflow, so there's no `supabase/config.toml` — if you want local Postgres for development, `supabase init` and re-apply these migrations against it.
