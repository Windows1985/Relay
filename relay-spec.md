# Relay

## Summary

Relay is a nightly game for a group of friends. Every evening in a fixed window, one game fires for the whole group: sometimes a question, sometimes a vote on each other, sometimes a 15 second physical challenge on your phone. You cannot see anyone's answer until you have played your own, and the reveal drops once everyone is in or the window closes. Winning earns tokens, which buy name colours and animations that show up wherever your name appears. If enough of the group plays, the group streak survives; too many flakes kills it, unless the group has a freeze banked. The game rotates daily and is never announced in advance, so the habit stays fixed while the content does not get stale.

## Core design principles

1. **One round engine, many games.** Every game is the same object underneath: round, submit, reveal, score. Each game is a config entry, not new code.
2. **Locked reveal.** Nothing is visible until you have submitted. This is the return mechanism.
3. **Auto-scored where possible.** Number games are measured by the app, never self reported, so they cannot be cheated. Photo and text games are group voted, where cheating is not the failure mode.
4. **Fixed time, unknown game.** The window is predictable so the habit forms. The game is a surprise so it stays fresh.
5. **The group is the unit.** Streaks, pressure, and recruitment all operate at group level.
6. **Nothing waits on a straggler.** Every phase has a hard close and settles on what it has.

## Minigames

### Auto scored (sensor and timing)

1. Shake your phone the most times in 15s
2. Stop the timer at exactly 10.00s without looking
3. Tap as fast as you can in 10s
4. Reaction test: tap when the screen changes
5. Flip your phone the most times in 20s
6. Trace the circle, scored on path accuracy

### Group voted (photo)

7. Find something closest to this colour
8. Ugliest thing within arm's reach
9. Your shoes, right now
10. Something that should not be where it is
11. Closest thing you own to the word "damp"

### Group voted (text, using an original prompt pack)

12. Best ending to a sentence
13. Guess the poster
14. One lie about yourself

### Tally (name pick)

15. Most likely to...
16. Who would survive longest without their phone
17. Who is lying right now

Ship 8 to 10 at launch, spread across all four input types. Building a new input type is expensive; adding a game that reuses one is close to free.

**Cut:** highest phone battery (Safari has never supported the Battery Status API), hold phone still (defeated by propping it up), walk 20 steps, screen time (not readable on iOS).

## The round

### Lifecycle

Every round carries four timestamps. State is derived from them and the current time, not stored as a mutable status field.

| Timestamp | Meaning |
| --- | --- |
| `opens_at` | Window opens. Roster is snapshotted here. Submissions accepted. |
| `reveal_at` | Everyone has submitted, or the window closed. Submissions become visible. |
| `votes_close_at` | Voting ends. Only set for `needs_vote` modes. |
| `settled_at` | Tokens awarded, streak evaluated, freeze consumed if needed. |

Auto-scored modes go straight from `reveal_at` to `settled_at`. Judged modes hold open a voting phase in between; since a reveal can land at 10pm, voting runs to a fixed time the next day rather than a short window that night.

**Reveal is global.** One `reveal_at` on the round, not a per-viewer unlock. Everyone sees everything at the same moment.

### Voting settles on what it has

A judged round settles at `votes_close_at` using whatever votes were cast by that moment. It does **not** wait for the full roster to vote.

- A member who does not vote simply forfeits their vote. There is no penalty and no reminder chase.
- Streak credit depends only on **submitting**, never on voting. A slow voter cannot hold up scoring or break a night.
- Ties are broken by earliest submission timestamp.
- If zero votes arrive, the round settles with no winner and no tokens. The streak is unaffected.

This keeps token payout on a fixed schedule and stops the second session from becoming a second obligation.

## Streak

- On by default, not a toggle
- Judged against the roster snapshotted at `opens_at`
- Share button that drops "2 hours left, 3 of you have not played" into the group chat

### Threshold

The streak survives if the number of members who did not play is at or below the allowance for the group's size:

```
allowed_misses = max(1, floor(roster_size / 4))
```

| Roster | Allowed misses |
| --- | --- |
| 3 - 4 | 1 |
| 5 - 8 | 2 |
| 9 - 12 | 3 |

Rationale: with an all-play rule, survival decays as the group grows, so exactly the groups with the most social pressure are the ones whose streak dies first. At a 90% per-member show-up rate, an eight person group survives a strict night 43% of the time and a strict week 0.4% of the time. Under the threshold rule the same group survives a night 96% of the time and a week 76% of the time, and a four person group is at 95% and 68%. Survival stays roughly flat across sizes, which is the point.

`max(1, …)` exists so that a trio is not held hostage by one person's dinner plans.

`allowed_misses` is computed from the snapshot and **stored on the round**, so a mid-window roster change cannot retroactively alter whether a past night passed.

### Freezes

A freeze covers the case where the group blows past the threshold, which is now rare enough that the save feels earned rather than routine. A freeze is a **group** asset with its own inventory, unlike cosmetics, which are owned per user globally.

- Costs roughly four days of play: expensive enough to hurt, cheap enough that a group will hold one
- Maximum two held, maximum one consumed per seven days
- Any member can buy into the group pool
- Auto-consumes at window close if the miss count exceeds `allowed_misses` — nobody is awake at 10pm to make the call
- The reveal screen names who paid for it. A silent save teaches the flake nothing.

## Time zones

- Each group stores an **IANA time zone string** (`Europe/London`, `America/Los_Angeles`), captured from the founder's device at creation. Not a UTC offset, which would drift by an hour at each DST transition.
- The nightly window and the day boundary are both evaluated in the group's zone. A member travelling abroad plays on the group's clock, not their own.
- The zone is editable in group settings. A change takes effect at the next `opens_at`, never mid-round.

## Moderation

Photo submissions are deleted from storage at `settled_at`, so nothing accumulates.

That is not sufficient on its own, because deletion after the vote does not help anyone who already saw the image, and the blob was live in the bucket in between. Minimum viable addition:

- A report control on every photo submission. One report hides the image for the whole group immediately and drops it from scoring.
- Reported blobs are deleted rather than quarantined.

Cheap to build, and the only thing standing between the app and a bad first day once it reaches people who are not friends of friends.

## Leaderboards

- **Group:** tokens earned, resets weekly, so everyone has a live shot each Monday
- **Global:** groups ranked by current streak length, not individuals by tokens. Streak length is comparable across group sizes, cannot be farmed solo, and makes the core mechanic public

## Mode config

Each game is one entry. Fields:

- `id`
- `input_type` — motion | timing | photo | text | name_pick
- `scoring` — auto_high | auto_low | auto_target | vote | tally
- `target` — for auto_target modes
- `duration_ms` — for timed modes
- `needs_vote`
- `min_players` — 4 for anything vote-scored; below that there are two voters and a permanent tie
- `requires` — motion | camera | none
- `decay` — evergreen | decaying

`requires` lets the server skip motion games for a group where a member has denied the permission, so a dismissed Safari prompt cannot silently break someone's streak. Groups of three get auto-scored modes only, which is most of the library anyway.

`decay` is recorded from launch but ignored by selection in v1. Guess-the-poster and one-lie-about-yourself wear out as a group learns each other; shake-your-phone does not. The field costs nothing now and a migration later.

## Roster

The member list is snapshotted onto the round at `opens_at`, and that snapshot is what the threshold is computed from.

- Someone who joins mid-window can play and earn tokens but is not on the hook until the next round. A new member can never kill an existing streak on their first day.
- Removals take effect at the next `opens_at`, so a group cannot kick the flake at 9:55pm to save the night.

## Shop

- Tokens buy name colours: solids, two stop gradients, rainbow hue cycle, chrome shimmer, glitch
- Tokens buy entry animations: pop, slide in, typewriter, shake, fade up
- Animations play once on render and never loop, or the leaderboard becomes unreadable
- Cheap tier costs roughly two days of play, top tier roughly three to four weeks. Start too expensive rather than too cheap
- Streak gated items at 30 and 100 days are unbuyable and are lost if the streak breaks
- **Cosmetics are owned per user globally**, so a new group instantly shows off what you own

## Identity and accounts

Username and password, on Supabase Auth. Not IP based and not fingerprint based — campus users share NAT'd IPs so IP cannot separate two people, and Safari blocks fingerprinting anyway.

A real account from the first tap also closes the iOS trap: a home screen PWA has storage separate from Safari's, so anyone who joins in the browser and then installs to the home screen arrives as a brand new user if their identity lives only in device storage.

- Usernames are unique and are the display name
- Email is optional and prompted later, for password recovery only. Without it there is no reset path, so ask for it once the player has something worth recovering.

### Sign in with Google

Offered alongside username and password on the join screen, to shorten the funnel at the point where a group either forms or dies. Enable the provider in Supabase, create an OAuth client in Google Cloud, register the redirect URL.

- Google supplies an email and a real name, not a display name, so OAuth signups still need a one-field screen to pick a unique username before they reach the round
- Test the redirect from an installed home screen PWA specifically. The ceremony can open outside the standalone window and hand the session back to the wrong context, which is the exact path most users will be on.

Passkeys are deliberately not in v1. Supabase's implementation is beta and flagged experimental, and registering a passkey requires an already confirmed account, so it cannot replace the join screen — it is a second session convenience, worth revisiting once the API stabilises.

## Platform

- PWA served over HTTPS, hosted on Vercel
- Home screen install is prompted after the first reveal, not at join. Web push only works for installed PWAs, but the Share → Add to Home Screen flow has heavy drop-off, so it goes after the payoff rather than in front of it. Detect with `window.matchMedia('(display-mode: standalone)').matches`
- Motion permission requested from a user tap via `DeviceMotionEvent.requestPermission()`
- Visible in app state, such as "tonight's game is live, 3/6 played", as a fallback for dropped push subscriptions
- Web push is unavailable to EU users on iOS 17.4 and later. UK and US are fine

### Why web first

No Mac needed, no Apple developer fee, no review queue, one codebase, and an invite link that works the instant someone taps it in a group chat. For a game whose distribution is a group chat rather than the App Store, that trade is clearly worth it.

## Groups

- Create a group, join by invite link or 6 character code
- Group sets its own nightly window, default 7pm to 10pm, in the group's stored time zone
- One game per day, chosen server side, never announced in advance

## Out of scope for v1

Friend requests, cross group play, profiles beyond a name, direct messages, and any game needing an API that iOS Safari does not expose.

## Deferred, not decided

Prices, the cosmetic list, the 30 and 100 day gated items, and whether the global board normalises by group size. None of these touch the schema, so they can move after launch.

## Next step

The round schema and the mode config format, so that adding game number 40 is one entry rather than a rewrite. `allowed_misses` and the group time zone both need to exist in that schema from day one.
