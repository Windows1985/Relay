---
name: Relay
description: A night-shift radio-relay control panel for a friend group's nightly minigame
colors:
  ground: "#0b0d0a"
  ground-raised: "#14170f"
  panel: "#191d14"
  ink: "#eef0e6"
  ink-dim: "#9aa08e"
  amber: "#ffb020"
  amber-dim: "#8a5c14"
  danger: "#ff5c4d"
  ok: "#5ce08a"
  amber-pressed: "#d98d10"
  ink-on-amber: "#1a1204"
  disabled-fill: "#3a3a32"
  disabled-shadow: "#22221d"
typography:
  mono:
    fontFamily: "Martian Mono"
    role: "numerals, timers, wordmark, status labels"
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    role: "body copy, form labels, prose"
rounded:
  panel: "1rem"
  inset: "0.75rem"
  button: "0.85rem"
---

# Design System: Relay

## Overview

**Creative North Star: "The Night-Shift Radio Relay"**

Relay behaves like the hardware its name describes: a late-night signal-relay control panel, not a mobile-game menu. The interface is near-black, low-glare, and legible one-handed in a dark room — because that's the actual scene: a friend checking their phone at 9pm before bed. One committed amber accent, styled like an LED digit or a VU meter, carries every moment that matters (the countdown, the live indicator, the lock/unlock state). Everything else recedes into dark, recessed panel surfaces.

This is an Operate-mode surface — task completion (check status, play, see reveal) — so the personality lives in a handful of load-bearing details (the countdown typography, the tactile button press, the bezel depth) rather than in decoration spread across the whole page. No gradient cards, no mobile-game chrome, no generic dashboard layout.

**Key Characteristics:**
- Near-black warm charcoal ground; amber is the only saturated color in the system
- Martian Mono for anything numeric or time-based; system sans everywhere else
- Physical-hardware component language: recessed bezels, tactile pressed buttons, no flat cards

## Colors

One committed accent on a near-black ground — Restrained-plus-one, applied at page scale, never scattered as decoration.

### Primary
- **Signal Amber** (`#ffb020`): the countdown/status readout, the primary action button, the lock/unlock indicator, winner highlights. This is the only saturated color in the system — its presence always means "this is live, this is the moment."

### Neutral
- **Near-Black Ground** (`#0b0d0a`): page background.
- **Raised Ground** (`#14170f`): recessed/inset surfaces (`.bezel-inset`) — inputs, secondary panels.
- **Panel** (`#191d14`): the primary bezel surface (`.bezel`) — the main content panel on every screen.
- **Ink** (`#eef0e6`): primary text.
- **Ink Dim** (`#9aa08e`): secondary/label text, always tinted warm off-white, never pure gray.

### Status
- **Danger** (`#ff5c4d`): errors, streak-broken state, report actions.
- **Ok** (`#5ce08a`): streak-survived confirmation.

### Derived (button/state shades, not independent palette choices)
- **Amber Pressed** (`#d98d10`): the gradient's dark edge and the tactile button's resting shadow — a darkened Signal Amber, not a second accent.
- **Ink on Amber** (`#1a1204`): text/icon color specifically for content sitting on the amber fill.
- **Disabled Fill** (`#3a3a32`) / **Disabled Shadow** (`#22221d`): the `.btn-tactile:disabled` state — desaturated rather than a dimmed amber, per the Component rule that disabled never reads as "dimmer amber."

### Named Rules
**The One Signal Rule.** Amber only marks what's live or actionable right now — a countdown, a primary button, a winner. It never decorates a static label or a neutral state; if nothing needs attention, nothing is amber.

## Typography

**Display/Mono Font:** Martian Mono (with monospace fallback)
**Body Font:** system-ui stack (Operate-mode surfaces are licensed to use a workhorse system face where a webfont adds no comprehension value)

**Character:** Martian Mono's segmented-display letterforms carry the "hardware" identity everywhere a number or countdown appears; the system sans stays out of the way for everything else.

### Hierarchy
- **Readout** (bold, `text-5xl`–`text-6xl`, tabular-nums, Martian Mono, amber): the countdown/status digits — the dominant focal point of every screen.
- **Status label** (bold, `text-xl`–`text-2xl`, uppercase, tracking-widest, Martian Mono, amber): "LIVE", "REVEALED", "VOTE OPEN".
- **Body** (system sans, `text-sm`–`text-base`, ink): prompts, descriptions, form labels.
- **Meta label** (`text-xs`, tracking-[0.3em], uppercase, ink-dim): group name + streak, secondary context above the main readout.

## Layout

Single-column, mobile-first, max-width `24rem` (`max-w-sm`) centered content — this is a phone-in-one-hand product, and desktop width is never the design target. One primary panel (`.bezel`) per screen holds the focal content; no nav bar, no card grid, no dashboard chrome. Generous vertical rhythm (`gap-6`, `py-10`) keeps the countdown/status readout as the dominant element rather than one item in a list.

## Elevation & Depth

Hybrid: recessed bezels via layered `box-shadow` (never a flat card, never a drop shadow floating a surface up). The panel language reads as *machined into* the page, not laid on top of it.

### Shadow Vocabulary
- **`.bezel`** (`inset 0 1px 0 bezel-light, inset 0 -2px 6px bezel-dark, 0 1px 0 rgba(255,255,255,.03)`): the primary content panel — a shallow physical recess.
- **`.bezel-inset`** (`inset 0 2px 6px bezel-dark, inset 0 -1px 0 bezel-light`): deeper recess for inputs and secondary tiles.
- **`.btn-tactile`** (`0 3px 0 amber-dim, 0 6px 12px rgba(0,0,0,.4)`, collapsing to `0 0 0` + a `translateY(3px)` on `:active`): a physical button press, not a hover-fade.

### Named Rules
**The Machined-In Rule.** Nothing floats. Every surface is either the ground, or recessed into it. A raised drop-shadow card is a bug, not a stylistic choice.

## Shapes

Rounded rectangles throughout (`0.75`–`1rem` radius) with no sharp corners and no pill shapes — soft enough to read as machined plastic/metal, not soft enough to read as a mobile-game card. Buttons are full-width by default; only single-glyph or icon-style controls (the tap-fast counter) go circular.

## Components

### Buttons
- **Shape:** `0.85rem` radius, full-width by default.
- **Primary (`.btn-tactile`):** amber gradient fill, dark ink text, tactile shadow-collapse press state (see Elevation). This is the only button style in the system — there is no secondary/ghost variant, because every screen has exactly one primary action.
- **Disabled:** desaturates to a flat gray-green (`#3a3a32`) with a matching dark shadow — never just lowered opacity on the amber fill, which would read as a dimmer amber rather than an inactive control.

### Panels
- **Corner style:** `1rem` (`.bezel`) / `0.75rem` (`.bezel-inset`).
- **Background:** `panel` / `ground-raised` respectively.
- **Shadow strategy:** see Elevation — always recessed, never raised.
- **Border:** none; depth comes entirely from the inset shadow, not a stroke.

### Inputs / Fields
- **Style:** `.bezel-inset` treatment — the same recessed language as panels, so a text field reads as part of the hardware, not a bolted-on web form control.
- **Focus:** amber ring (`ring-2 ring-amber`) — the one place a border is used, and only on interaction.

### Status Readout (signature component)
The large Martian Mono countdown/status digit block is Relay's signature element — every screen's first viewport is built around it, not around a header or nav. It always renders in amber, always tabular-nums, and is the single largest text on any screen.

## Do's and Don'ts

### Do:
- **Do** keep amber as the only saturated color anywhere in the system (see The One Signal Rule).
- **Do** render every countdown, score, and streak number in Martian Mono with `tabular-nums`.
- **Do** build every panel as a recess (`.bezel` / `.bezel-inset`), never a raised card.
- **Do** keep the layout single-column, mobile-first, `max-w-sm`.

### Don't:
- **Don't** add a second accent color, even for a "nice to have" — a second color halves the amber's meaning.
- **Don't** use a drop-shadow / raised-card treatment anywhere; it breaks the machined-panel language.
- **Don't** reach for a gradient-card mobile-game aesthetic (rounded icon tiles, soft pastel gradients, badge-shaped stat chips) — that's the exact category default this direction refuses.
- **Don't** style body copy or labels in Martian Mono — it's reserved for numerals/timers/status, per The Machined-In identity; using it for prose turns a deliberate signal into decoration.
