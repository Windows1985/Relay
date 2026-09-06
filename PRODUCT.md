# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js, hosted on Vercel, with Supabase for Auth (username/password + Google OAuth) and data. Chosen for API routes/server logic needed for round settlement, streak evaluation, and OAuth redirect handling.

## Users

A pre-existing group of friends (a group chat) who already talk daily. Not a stranger-matching or dating-app-style social product — the group is fixed and self-selected before the app enters the picture. The job: give the group a nightly two-minute ritual that keeps a shared streak alive, at a fixed time each evening, without turning into a second obligation.

## Product Purpose

Relay fires one minigame a night for the whole group, in a fixed window, never announced in advance. Nobody can see anyone else's answer until they've submitted their own. The group shares a single streak; winning individual rounds earns tokens spent on cosmetics. Success means the group forms a durable nightly habit — the game rotates so content doesn't go stale, but the window and locked-reveal mechanic stay fixed.

## Positioning

One round engine drives every game (round → submit → reveal → score); each new minigame is a config entry, not new code. Locked reveal (you must play to see anyone's answer) is the core return mechanic, not a game rule bolted on top. Streaks, pressure, and recruitment operate at the group level, not the individual — the global leaderboard ranks groups by streak length, not players by score. A partial-participation streak-survival threshold (allowed_misses = max(1, floor(roster_size / 4))) is deliberately not "everyone plays or it's over," because that rule punishes larger groups hardest and kills the streaks with the most social investment in them.

## Operating Context

- Distribution is a group chat invite link or 6-character code, not an app store listing.
- Play happens inside a fixed nightly window (group-configurable, default 7pm–10pm) evaluated in the group's stored IANA time zone.
- A PWA installed to the home screen, prompted after the first reveal (not at join) because Add to Home Screen has heavy drop-off before there's a payoff to justify it.
- Web push notifies of the nightly game; falls back to in-app state ("3/6 played") since push is unavailable to EU users on iOS 17.4+ and drops silently for other reasons too.
- Motion-based minigames require `DeviceMotionEvent.requestPermission()` from a real user tap; the server must be able to skip motion games entirely for a group where a member has denied that permission.

## Capabilities and Constraints

- One round engine handles four input types: motion, timing, photo, text/name-pick. Auto-scored modes (motion/timing) are measured by the app, never self-reported. Photo and text modes are group-voted.
- Round lifecycle is derived from four timestamps (`opens_at`, `reveal_at`, `votes_close_at`, `settled_at`), never a mutable status field.
- Reveal is global — one `reveal_at` for the whole group, not per-viewer.
- Judged (voted) rounds settle at `votes_close_at` on whatever votes exist; nobody waits on a straggler, and a non-voter forfeits with no penalty. Streak credit depends only on submitting, never voting.
- Roster for streak/threshold purposes is snapshotted at `opens_at`; `allowed_misses` is computed from that snapshot and stored on the round so a later roster change can't retroactively alter a past night's result.
- Freezes are a group-owned asset (max 2 held, max 1 consumed per 7 days) that auto-consume at window close when misses exceed the threshold; cosmetics are owned per user, globally, across groups.
- Photo submissions are deleted from storage at `settled_at`; a report control on any photo hides it group-wide immediately and drops it from scoring, with the blob deleted rather than quarantined.
- Auth is Supabase username/password plus optional Google Sign-In; not IP-based or fingerprint-based (campus NAT and Safari fingerprinting protection both rule those out). Email is optional, requested later, for password recovery only. Passkeys deliberately excluded from v1 (Supabase support is beta and requires an already-confirmed account).
- `requires` (motion | camera | none) and `min_players` (4 for anything vote-scored) gate which modes a given group/round can run. Groups of three get auto-scored modes only.
- Out of scope for v1: friend requests, cross-group play, profiles beyond a name, DMs, any game needing an API iOS Safari doesn't expose.
- Deferred, not decided (does not touch schema, can move post-launch): prices, the cosmetic list, the 30/100-day streak-gated items, whether the global leaderboard normalizes by group size.

## Brand Commitments

Name: Relay. No existing visual identity, logo, or asset library yet — this is a pre-visual-design project.

## Evidence on Hand

None. No real content, testimonials, screenshots, or brand assets exist yet; `relay-spec.md` is the only source of product truth. Future design/build work must not fabricate testimonials, user counts, or press mentions.

## Product Principles

1. One round engine, many games — every new minigame is a config entry, never new code.
2. Locked reveal is the return mechanism: nothing is visible until you've played.
3. The group is the unit — streaks, pressure, and recruitment all operate at group level, never individual.
4. Nothing waits on a straggler — every phase has a hard close and settles on what it has at that moment.
5. Fixed time, unknown game — the window is predictable so the habit forms; the game is a surprise so it stays fresh.
