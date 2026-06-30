# Color System

Single source of truth for every color in the app. All colors are expressed in
**OKLCH** and defined as CSS custom properties in [`src/index.css`](src/index.css)
(`:root` for light, `.dark` for dark). Tailwind exposes them as utilities via
[`tailwind.config.ts`](tailwind.config.ts).

> **Rule:** never hardcode a hex / rgb / hsl color in a component. Use a token.
> If a needed shade is missing, add a token here + in `index.css` first.

---

## Why OKLCH

OKLCH is perceptually uniform: equal lightness (`L`) steps look equally bright,
hue (`H`) stays stable across lightness, and chroma (`C`) is independent of both.
That makes the ramps below predictable and keeps palettes consistent. Syntax:
`oklch(L C H)` or `oklch(L C H / alpha)` — `L` 0–1, `C` 0–~0.4, `H` 0–360.

---

## Two token conventions

| Convention | Stored as | Used as | Example |
| --- | --- | --- | --- |
| **Functional** (shadcn theme) | bare channels `L C H` | `oklch(var(--x) / <alpha-value>)` in Tailwind config | `bg-primary`, `bg-muted/50` |
| **Palette** (`--color-*`) | full `oklch(...)` | `var(--color-x)` directly | `text-[var(--color-ink)]`, `text-ink` |

Functional tokens stay as bare channels so Tailwind can inject alpha (e.g.
`border-destructive/30`). Palette tokens hold a full color and are referenced
directly in arbitrary values and inline styles.

---

## Palette library (`--color-*`)

### Neutrals — text & surfaces

| Token | Tailwind | OKLCH | Role | Consolidated from |
| --- | --- | --- | --- | --- |
| `--color-ink` | `ink` | `0.227 0.066 279.78` | Primary text / darkest | #17173A, #1C1C1E, #101828, #051C2C, #171717 |
| `--color-charcoal` | `charcoal` | `0.293 0.023 235.598` | Dark slate surfaces / icons | #212E36, #2A2A2A, #2D2D2D |
| `--color-slate` | `slate` | `0.393 0.012 238.826` | Secondary text (Slate/800) | #40474C, #394150, #475467, #3D3D3D |
| `--color-grey` | `grey` | `0.553 0.046 284.785` | Secondary / tertiary grey text | #6F6F8D, #6C717F, #637882, #737373, #64748B, #6B7280, #64758B, #888 |
| `--color-grey-soft` | `grey-soft` | `0.713 0.024 260.709` | Muted / placeholder / disabled | #9AA3B2 |
| `--color-line-strong` | `line-strong` | `0.87 0 0` | Strong borders & dividers | #D4D4D4, #C9C9C9, #CCC, #C7CDD8 |
| `--color-line` | `line` | `0.928 0.006 264.531` | Default borders | #E5E7EB, #E7E7E8 |
| `--color-line-input` | `line-input` | `0.913 0.017 267.783` | Input / field borders | #DDE2EE |
| `--color-surface-2` | `surface-2` | `0.952 0.006 264.532` | Soft surface | #EDEFF3, #F2F5F9 |
| `--color-surface-1` | `surface-1` | `0.966 0.005 258.325` | Muted surface | #F2F4F7, #F3F4F6, #F6F6F6 |
| `--color-surface-0` | `surface-0` | `0.985 0.002 247.839` | Subtle surface | #F9FAFB, #F6F7F9, #FAFAFA |
| `--color-white` | — | `1 0 0` | White | #FFFFFF, #FFF |

### Royal blue — primary action

Royal Blue **#2F68E5** is the primary. All saturated action blues were unified
to it (buttons, focus ring, links, selected chip, shimmer-blue).

| Token | Tailwind | OKLCH | Role | Consolidated from |
| --- | --- | --- | --- | --- |
| `--color-royal` | `royal` | `0.554 0.199 263.043` | **Primary action (#2F68E5)** | #2F68E5, #0056F8, #007BFF, #3B82F6, #5C80FF, #0A8FFD |
| `--color-royal-strong` | `royal-strong` | `0.441 0.205 262.067` | Pressed / border / hover-dark | #0043C1 |
| `--color-royal-pale` | `royal-pale` | `0.953 0.022 260.723` | Pale tint background | #E7F0FF, #EDF3FF |
| `--color-royal-pale-soft` | `royal-pale-soft` | `0.978 0.01 261.789` | Softer pale tint | #F4F8FF |

### Navy / cobalt — brand secondary (kept distinct, not flattened to royal)

| Token | Tailwind | OKLCH | Role | Consolidated from |
| --- | --- | --- | --- | --- |
| `--color-navy` | `navy` / `cobalt-blue` | `0.394 0.147 261.904` | Cobalt brand (gradients, avatars) | #143F93, #1E3A8A |
| `--color-navy-deep` | `navy-deep` | `0.32 0.128 259.637` | Deep gradient stop | #002D72, #0F2D70 |
| `--color-navy-deepest` | `navy-deepest` | `0.251 0.093 258.021` | Deepest gradient stop | #001F4D |
| `--color-steel` | `steel` | `0.426 0.108 247.015` | Deep ocean blue accent | #085286 |

### Semantic / accent

| Token | Tailwind | OKLCH | Role | Consolidated from |
| --- | --- | --- | --- | --- |
| `--color-success` | `success` | `0.639 0.145 155.921` | Success / positive | #22A565 |
| `--color-mint` | `mint` | `0.726 0.155 164.016` | Mint / positive-bright | #00C48C |
| `--color-warning` | `warning` | `0.765 0.144 81.869` | Warning / amber | #E0A82E, #E7B231 |
| `--color-orange` | `orange` | `0.681 0.208 41.372` | Orange accent | #FC5E02, #E8552B |
| `--color-danger` | `danger` | `0.576 0.209 29.482` | Destructive / error | #D92D20 |
| `--color-pink` | `pink` | `0.832 0.12 343.407` | Pink accent | #FFA8DC |
| `--color-plum` | `plum` | `0.257 0.038 310.318` | Logo disc background | #291E31 |

---

## Functional tokens (shadcn theme)

Bare `L C H` channels in `:root` / `.dark`; consumed as `bg-*`, `text-*`,
`border-*`, etc. Converted 1:1 from the previous HSL values to OKLCH.

| Token | Light `L C H` | Dark `L C H` |
| --- | --- | --- |
| `--background` | `1 0 0` | `0.246 0.003 274.881` |
| `--foreground` | `0.137 0.036 258.526` | `1 0 0` |
| `--card` / `--popover` | `1 0 0` | `0.287 0.005 271.245` / `0.276 0.007 268.603` |
| `--primary` | `0.208 0.04 265.727` | `0.985 0 0` |
| `--secondary` / `--muted` | `0.968 0.007 247.895` | `0.287 0.005 271.245` |
| `--muted-foreground` | `0.555 0.041 257.44` | `0.789 0 0` |
| `--accent` | `0.754 0.125 243.665` | `0.754 0.125 243.665` |
| `--destructive` | `0.637 0.208 25.326` | `0.396 0.133 25.721` |
| `--border` / `--input` | `0.929 0.013 255.532` | `0.378 0.003 264.524` / `0.328 0.004 271.282` |
| `--input-border` | `0.863 0.022 256.738` | `0.462 0.003 286.288` |
| `--ring` | `0.137 0.036 258.526` | `0.754 0.125 243.665` |
| `--tertiary-foreground` | `0.523 0.036 285.093` | `0.789 0 0` |
| `--sidebar-*` | see `index.css` | see `index.css` |
| `--avatar-bg` | `oklch(0.911 0.018 271.219 / 0.2)` | same |

---

## Shadows & overlays

Shadow / overlay alphas are effect-specific (not palette colors) and stay as
inline `oklch(L C H / alpha)` literals — e.g. `oklch(0 0 0 / 0.05)` (black),
`oklch(1 0 0 / 0.24)` (white), `oklch(0.21 0.034 263.436 / 0.22)` (#101828).
Inside Tailwind arbitrary values they use underscores for spaces, e.g.
`shadow-[0px_1px_0px_0px_oklch(0_0_0_/_0.02)]`.

---

## Usage

```tsx
// Palette token via Tailwind semantic name (preferred)
<p className="text-ink bg-surface-1 border border-line">…</p>
<button className="bg-royal text-white hover:bg-royal-strong">Send</button>

// Palette token via arbitrary value (when a one-off is needed)
<div className="text-[var(--color-grey)] border-[var(--color-line-input)]" />

// Functional token with opacity modifier
<div className="bg-muted/50 border-destructive/30" />

// Inline style
<div style={{ background: "var(--color-royal-pale)" }} />
```

## Maintenance

1. Add the token to `:root` (and `.dark` if it differs) in `src/index.css`.
2. Expose it in `tailwind.config.ts` under `theme.extend.colors`.
3. Document it in the tables above.
4. Convert any hex with the OKLCH skill (`.agents/skills/oklch-skill`) or
   [oklch.fyi](https://oklch.fyi). Never commit a raw hex/rgb/hsl in a component.
