---
name: Relay
description: A friends' feed you can only unlock by playing — Instagram's grammar, one game a night
colors:
  paper: "#ffffff"
  paper-warm: "#faf8f5"
  ink: "#171313"
  ink-2: "#6b6670"
  line: "#ebe7e2"
  sunset-1: "#f9a73e"
  sunset-2: "#fb5f6a"
  sunset-3: "#c13584"
  sunset-4: "#7c3aed"
  danger: "#e5484d"
  ok: "#2fb36b"
  disabled-fill: "#e6e2dc"
  disabled-ink: "#9b95a0"
  ink-alpha-6: "rgba(23, 19, 19, 0.06)"
  ink-alpha-4: "rgba(23, 19, 19, 0.04)"
  sunset-3-alpha-28: "rgba(193, 53, 132, 0.28)"
  sunset-3-alpha-24: "rgba(193, 53, 132, 0.24)"
  sunset-3-alpha-15: "rgba(193, 53, 132, 0.15)"
  sunset-3-alpha-8: "rgba(193, 53, 132, 0.08)"
  cosmetic-rainbow-red: "#ff5c4d"
  cosmetic-rainbow-amber: "#ffb020"
  cosmetic-rainbow-green: "#5ce08a"
  cosmetic-rainbow-blue: "#4da3ff"
  cosmetic-rainbow-violet: "#b06bff"
  cosmetic-chrome-shadow: "#8a8f80"
  cosmetic-chrome-highlight: "#f4f6ee"
typography:
  display:
    fontFamily: "Fredoka"
    role: "headings, numerals, countdowns, wordmark, primary button labels"
  body:
    fontFamily: "Nunito"
    role: "body copy, labels, secondary buttons, UI text"
rounded:
  card: "20px"
  input: "14px"
  pill: "999px"
spacing:
  card-padding: "1.5rem"
  card-gap: "1rem"
  page-gutter: "1rem"
  tap-target-min: "48px"
---

# Design System: Relay

## Overview

**Creative North Star: "The Locked Feed"**

Relay borrows the grammar every group chat already knows from Instagram — story rings, a bottom tab bar, post cards, a heart — and repurposes it around one rule the platform it quotes doesn't have: the feed stays locked until you've posted your own move. The look is bright, rounded, and friendly; the tension comes entirely from the ring that hasn't completed yet.

This is an Operate-mode product used for about two minutes a night, one-handed, on a phone. Every screen has exactly one obvious primary action, tap targets are never smaller than 48px, and the primary button is the only thing on a screen wearing the gradient. Expression lives in a few load-bearing details — the ring, the heart, the streak badge, Fredoka's rounded numerals — never in decoration spread across the page.

**Key Characteristics:**
- White cards on a warm-white page; near-black ink; one sunset gradient as the single accent
- Fredoka for anything that should feel like a number or a title; Nunito for everything you read
- Instagram's component vocabulary (ring, tab bar, post card, heart) used literally, not as a mood

## Colors

Restrained-plus-one: neutrals carry the page; the sunset gradient is applied at component scale as a fill on exactly the elements that mean "act" or "alive."

### Primary
- **Sunset Gradient** (`#f9a73e → #fb5f6a → #c13584 → #7c3aed`, `135deg`): the story ring when a round is live/revealed, the primary button, the streak badge, the winner badge, and a filled heart's colour (`#fb5f6a`). Always a fill or a stroke, never text.

### Neutral
- **Paper** (`#ffffff`): every card and the tab bar.
- **Paper Warm** (`#faf8f5`): the page ground, input fields at rest, pressed-state fills, and the reaction pad's idle state.
- **Ink** (`#171313`): primary text and active tab icons.
- **Ink 2** (`#6b6670`): secondary text, hints, inactive tabs, meta labels. Always this warm gray — never a pure gray.
- **Line** (`#ebe7e2`): hairline borders on inputs, secondary buttons, list dividers, and the muted (not-live) story ring.

### Status
- **Ok** (`#2fb36b`): "streak lives", saved confirmations, the Wearing chip.
- **Danger** (`#e5484d`): errors, "streak broke", destructive confirms (Leave / Remove).

### Derived (states and depth, not independent choices)
- **Disabled Fill** (`#e6e2dc`) / **Disabled Ink** (`#9b95a0`): a disabled primary button loses the gradient entirely — it must never read as "a dimmer version of go."
- **Ink alpha 6% / 4%**: the two layers of the card shadow.
- **Sunset-3 alpha 28% / 24%**: the primary button's resting and pressed glow. **15%**: input focus ring. **8%**: the selected-state fill on choice rows (name pick, admin mode grid).

### Shop Cosmetics (scoped to purchasable name colours, never used elsewhere)
Per relay-spec.md's Shop section, rainbow and chrome are the two cosmetics that need colours outside the core system. Confined to `.name-rainbow` / `.name-chrome` in globals.css.
- **Rainbow sweep**: `#ff5c4d, #ffb020, #5ce08a, #4da3ff, #b06bff`.
- **Chrome ramp**: `#8a8f80` (shadow) / `#f4f6ee` (highlight).

### Named Rules
**The One Gradient Rule.** The sunset gradient appears on at most one button per screen and on the ring/badges that report state. If two things on a screen wear it, one of them is wrong.

**The Fill-Not-Text Rule.** The gradient is never applied to text; the text-clipping technique is reserved for the two shop cosmetics (rainbow, chrome) that are literally named after that effect. Emphasis in type comes from Fredoka and size.

## Typography

**Display Font:** Fredoka (with system-ui fallback)
**Body Font:** Nunito (with system-ui fallback)

**Character:** Both faces have rounded terminals, so headings and body read as one friendly voice at two weights of intent. Fredoka is bold enough to carry a countdown at 60px and a tab label at 11px; Nunito stays quiet underneath it.

### Hierarchy
- **Countdown / big number** (Fredoka 600, `text-5xl`–`text-6xl`, `tabular-nums` via `.num`): inside the story ring, the tap counter, the result reveal. The largest thing on any screen it appears on.
- **Page title** (Fredoka 700, `text-2xl`): one per screen, in the header row beside a back chevron.
- **Card heading** (Fredoka 600, `text-lg`–`text-xl`): one per card.
- **Body** (Nunito 400, `text-sm`–`text-base`, Ink): prompts, descriptions, post text (post text steps up to Fredoka 600 `text-xl`).
- **Meta / label** (Nunito 700, `text-xs`, Ink 2, sometimes `uppercase tracking-wide`): chips, hints, tab labels, section eyebrows inside cards.

### Named Rules
**The Numbers Are Fredoka Rule.** Any number a player compares — a countdown, a score, a token balance, a streak, a rank — is set in Fredoka with tabular figures (`.num`). Nunito never carries a number that matters.

## Layout

Single column, phone-first, `max-width: 28rem` centered (`.page`), 16px gutters, cards stacked with a 16–20px gap. A fixed bottom tab bar (`.tabbar`, five destinations, 56px rows, safe-area padded) is present on every authenticated screen and hidden on auth screens; `.page` reserves its height. Screens open with a one-row header (back chevron + title, or wordmark + streak badge on Home) and then lead with the single card that matters. Desktop is not a design target: the column simply centers.

## Elevation & Depth

Soft, diffuse, and shallow. Cards float 2px above the warm page on a two-layer ink shadow; nothing else casts a shadow except the primary button, whose glow is the accent colour itself at low alpha. No inset/recessed surfaces (that was the retired world's language). Borders are hairline `Line` and only on inputs, secondary buttons, and choice rows.

### Shadow Vocabulary
- **Card** (`0 2px 12px rgba(23,19,19,.06), 0 1px 2px rgba(23,19,19,.04)`): every `.card`.
- **Primary glow** (`0 6px 18px rgba(193,53,132,.28)`, pressed `0 3px 10px …,.24`): `.btn-primary` only.
- **Winner outline** (`0 0 0 2.5px sunset-3` stacked above the card shadow): the winning post card.

### Named Rules
**The Floating Card Rule.** Depth means "this is a card." Surfaces are either the page or a card; there is no third level, and cards never nest.

## Shapes

Rounded everything, with three radii that never mix roles: **20px** for cards, images, and the reaction pad; **14px** for inputs; **999px** (pill) for buttons, chips, badges, avatars, and rings. Big single-purpose controls (the tap counter, start/stop) are full circles (`h-52 w-52`). Icons are authored inline SVG at a 1.9 stroke, 24px box, `currentColor` — one set, one weight, never emoji.

## Components

### Buttons
- **Primary (`.btn-primary`):** sunset gradient fill, white Fredoka label, pill, 52px tall, full width in cards; presses scale to 0.97 with a reduced glow. Disabled loses the gradient (Disabled Fill / Disabled Ink).
- **Secondary (`.btn-secondary`):** Paper fill, hairline Line border, Nunito 700, pill, 48px; presses tint to Paper Warm.
- **Big control:** `.btn-primary` sized as a circle for the one huge game control (tap counter, start/stop); `.num` at `text-4xl`–`text-6xl`.
- **Text button:** Ink 2 or Sunset-3, Nunito 700, `min-h-11` — only for tertiary actions (Not now, Report, mode switch).

### Story Ring (signature component)
`.ring` (gradient, 5px) wrapping `.ring-inner` (Paper circle). Live/revealed rounds get the gradient; locked/scheduled rounds get `.ring-muted` (Line). The ring holds the round's status — countdown digits, LIVE, a check — and is the focal element of Home, the Play tab's empty state, the profile, and the winner callout. Completing your post plays `.ring-complete` once.

### Cards / Containers
- **Corner:** 20px. **Background:** Paper. **Shadow:** Card. **Border:** none. **Padding:** 24px (`p-6`) for content cards, 20px (`p-5`) for form cards, 8px (`p-2`) for list cards whose rows carry their own padding.
- **List row:** `min-h-14`, avatar + label + trailing meta/chip; pressable rows tint to Paper Warm.

### Post card (reveal)
Header (avatar, `Name` with cosmetic, Winner badge or score chip), body (square image at 20px radius, or Fredoka `text-xl` text), footer (heart with count/label, Report as a text button). The winner's card takes the outline shadow.

### Chips & Badges
- **Chip (`.chip`):** Paper Warm, Line border, Nunito 700 `text-xs`, Ink 2; carries meta (streak, count, state).
- **Badge (`.badge-sunset`):** gradient fill, white Fredoka; the streak on Home, the Winner label, the shop balance.

### Inputs / Fields
- **Style (`.input`):** Paper Warm fill, Line border, 14px radius, 48px tall; labels are Nunito 700 `text-sm` above the field.
- **Focus:** border to Sunset-3 plus a 15%-alpha ring; fill goes to Paper.
- **Choice rows** (name pick, admin mode grid): Line border at rest; Sunset-3 border + 8%-alpha fill when selected, with a check icon.

### Navigation
- **Tab bar:** five tabs (Home, Play, Board, Shop, Me), Ink 2 at rest, Ink + a Sunset-3 icon when current, `aria-current="page"`. Hidden on `/join`, `/pick-username`, `/j/*`, `/auth/*`.
- **In-page header:** back chevron (44px hit area) + Fredoka title; Home swaps the chevron for the wordmark and adds the streak badge.

### Avatar
`.avatar`: 40px Paper Warm circle, Line border, one Fredoka initial. Wrapped in `.ring` for rank #1 and the profile.

## Do's and Don'ts

### Do:
- **Do** give every screen exactly one `.btn-primary`, full width, as the last thing in its card.
- **Do** put every player-compared number in `.num`.
- **Do** keep list rows and choice rows at `min-h-14` and any tappable text at `min-h-11`.
- **Do** write button labels as what happens next ("Play now", "Post it", "Wear it", "Lock it in"), never as nouns.
- **Do** use the ring for state and the heart for votes — the two Instagram verbs the product actually shares.

### Don't:
- **Don't** put the gradient on text, on a second button, or on a card background.
- **Don't** introduce a second accent hue; status colours (Ok/Danger) are the only non-gradient colour allowed and only for status.
- **Don't** use inset/recessed surfaces, dark backgrounds, or monospace — those belong to the retired "radio relay" world and must not leak back in.
- **Don't** use a browser `confirm()`; destructive actions (Leave, Remove, Replace tonight's round) confirm inline with two buttons.
- **Don't** substitute emoji for an icon; extend `components/icons.tsx` instead.
