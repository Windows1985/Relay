---
version: 1
slug: "app"
primary_target: "app"
related_targets: []
---

## Scope

Operate-mode surface: the core nightly loop — home/status, play, reveal — across `app/page.tsx`, `app/play/[roundId]/`, `app/reveal/[roundId]/`, and the group shell. Direction round self-directed rather than run through concept-seed/decision-page: this is a task-completion utility surface (open app, see status, play, see reveal), not a Persuade or Experience surface, so the full image-generation ceremony built for high-stakes marketing pages is disproportionate here. Disclosed to the user.

Audience: a pre-existing friend group checking in for ~2 minutes a night. Job: know the channel's status at a glance, play the one game, see the reveal. Constraint: locked reveal and countdown state must always be legible at a glance, on a phone, often one-handed, sometimes in a dark room at night.

## Direction contract

THESIS: Relay is a late-night radio-relay control panel, not a mobile-game menu — the interface behaves like the hardware the product is named for (amber LED digits, tactile bezels, a channel that only opens once you transmit), refusing the generic gradient-card mobile-game template every AI-generated game UI defaults to.

OWN-WORLD: Near-black warm charcoal ground (`#0b0d0a`–`#141712`); one committed signal-amber accent (`#ffb020` family) carrying 30–60% of key surfaces — timer digits, active fills, the lock/unlock indicator — never scattered as decoration. Martian Mono for all numerals, timers, and the wordmark (a segmented-display character no other product in this category uses); system sans stack for body/labels (Operate mode's license to use a workhorse face). Components read as physical panel hardware: inset bezels via layered box-shadow (never a flat card), full-width tactile buttons with a real pressed state, a circular "channel" meter that fills like a signal strength dial.

STORY: Open the app, see the group's channel status rendered like a radio dial — closed / opening soon / live / revealed — with an amber countdown. When live, one tap fills the whole viewport with the night's single game. Submitting reads as throwing a physical switch. Reveal reads as a vault dial turning, unlocking everyone's answers at once.

FIRST VIEWPORT: Full-bleed near-black ground. A large centered amber status/countdown readout in Martian Mono is the dominant focal point — this screen IS the product's clock face, not a dashboard card. A small chrome-etched label above it carries the group name and streak count. One tactile primary action (or the countdown itself, pre-open) anchors the lower third. No nav bar, no card chrome.

FORM: Self-directed "night-shift radio relay station" concept — no concept-seed roll (Operate-mode utility surface; see Scope).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved decisions

- Exact per-game (input_type) visual treatment inside the play screen — resolved per-component as each is built, within OWN-WORLD.
- Whether the channel-meter motif extends to the group leaderboard (Phase 8) — decide when that surface is built.
