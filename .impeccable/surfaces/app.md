---
version: 1
slug: "app"
primary_target: "app"
related_targets: []
---

## Scope

Redesign (visual-world replacement) of the whole authenticated app: home, play, reveal, group pages, shop, leaderboards, auth screens, plus two new surfaces (an admin panel for one designated account, and a PWA install explainer). The previous "night-shift radio relay" world (dark, amber, Martian Mono) is retired and treated only as evidence of what the product is, not authority over how it looks. Direction pinned by the user: "playful like Instagram, very easy interactions, good UX." A pinned brief beats the roll, so no concept-seed round was run (disclosed to the user).

Audience and job unchanged: a friend group checking in for ~2 minutes a night on a phone, one-handed. Constraint that survives the redesign: the round's phase (opens-at / live / revealed / settled) and the locked-reveal state must be readable at a glance; the primary action must always be one obvious tap.

## Direction contract

THESIS: Relay is a friends' feed you can only unlock by playing — the familiar Instagram grammar (story rings, a bottom tab bar, post cards, a heart) repurposed so that the whole feed stays locked until you've posted your own move. It refuses the dark "game console" look the previous world used and the generic gradient-card mobile-game look alike.

OWN-WORLD: White and warm-white surfaces (`#ffffff` / `#faf8f5`), near-black ink (`#171313`), cool-gray secondary text. One committed accent: the Instagram-style sunset gradient (`#f9a73e → #fb5f6a → #c13584 → #7c3aed`) used at page scale as fills — the story ring around the channel card, the primary button, the streak badge, the vote heart when active — never as text. Fredoka (rounded, bold, playful) for display and numerals; Nunito for body and UI. Big rounded cards (20px), soft diffuse shadows, generous 24px padding, 48px+ tap targets, a fixed bottom tab bar with five destinations. Icons are authored inline SVG in one stroke weight, never emoji.

STORY: Open the app → a story-ring card for your group shows tonight's state in one glance (countdown / LIVE / revealed). Tap the ring → the game fills the screen with one huge control. Post your move → the ring "completes" and the feed unlocks. Reveal is a feed of your friends' posts; voting is a heart tap. Streak and tokens live in the profile tab; the shop is a grid of try-on cards.

FIRST VIEWPORT: Top bar with the Relay wordmark (Fredoka) and a streak badge. Below it, the group's channel card: a large gradient story ring containing the status (countdown digits or "LIVE"), group name and "3/6 played" under it, and one full-width gradient primary button anchoring the card. Bottom tab bar pinned to the viewport: Home, Play, Board, Shop, Me. Nothing else competes.

FORM: User-pinned "playful like Instagram" — no seed key; the pin binds every dimension the roll would otherwise decide.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved decisions

- Whether the admin panel gets its own tab (it's one account; a link from Me is enough for now).
- Icon set may later move to a library if the authored set grows past ~12 glyphs.
