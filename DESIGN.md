# DESIGN.md — Nothing Design System

Design system reference for InterviewMind's frontend. All tokens are defined in `src/styles/globals.css`; Tailwind aliases in `tailwind.config.ts`.

---

## Philosophy

Flat surfaces. Typographic hierarchy. One red accent as an interrupt signal. Nothing else.

- **OLED black** as page background; three surface layers above it
- **Space Grotesk** for all reading: chat messages, prose, form inputs
- **Space Mono** for all metadata: labels, caps, buttons, timestamps
- **Doto** for display numbers/headlines ≥ 32 px only — never body text
- No gradients, shadows, blur, or skeleton screens in UI chrome
- One accent (`--accent` red) per screen maximum — only when something urgently needs attention

---

## Color Tokens

### Dark (default)

| Token | Value | Role |
|-------|-------|------|
| `--black` | `#000000` | Page background |
| `--surface` | `#111111` | Cards, panels |
| `--surface-raised` | `#1A1A1A` | User bubbles, elevated cards |
| `--border` | `#222222` | Hairline dividers |
| `--border-visible` | `#333333` | Visible borders |
| `--text-disabled` | `#767676`* | Disabled / decorative only |
| `--text-secondary` | `#999999` | Supporting text |
| `--text-primary` | `#E8E8E8` | Body text |
| `--text-display` | `#FFFFFF` | Headlines, active labels |
| `--accent` | `#D71921` | Error / urgent interrupt |
| `--accent-subtle` | `rgba(215,25,33,0.15)` | Accent tint |
| `--success` | `#4A9E5C` | Sharp readiness, verified evidence |
| `--warning` | `#D4A843` | Partial / weak evidence |
| `--interactive` | `#5B9BF6` | Links, focus, solid readiness |

### Light (`[data-theme="day"]`)

Same token names; values invert to light palette (`--black` → `#F5F5F5`, `--surface` → `#FFFFFF`, etc.).

### Contrast deviation

`--text-disabled` is `#767676` (4.54:1 on `#000000`). The Nothing skill spec says `#666666` (3.66:1), which fails WCAG AA 4.5:1. Raised to `#767676` for safety. This token is used exclusively for inactive/decorative content — technically exempt by WCAG 2.1 §1.4.3 — but the raise eliminates any ambiguity.

---

## Type Scale

All sizes are CSS custom properties available anywhere:

| Token | Size | Use |
|-------|------|-----|
| `--display-xl` | 72 px | Doto only |
| `--display-lg` | 48 px | Doto only |
| `--display-md` | 36 px | Doto only |
| `--heading` | 24 px | Space Grotesk medium |
| `--subheading` | 18 px | Space Grotesk regular |
| `--body` | 16 px | Space Grotesk — **minimum for chat and prose** |
| `--body-sm` | 14 px | Space Grotesk |
| `--caption` | 12 px | Space Mono |
| `--label` | 11 px | Space Mono ALL CAPS |

---

## Font Roles

| Context | Font | Notes |
|---------|------|-------|
| Display / hero numbers | Doto | ≥ 32 px only. Never body, never labels |
| Chat messages | Space Grotesk | ≥ 16 px, never Mono |
| Form inputs | Space Grotesk | ≥ 16 px — **overrides** general-purpose Mono default |
| Prose / paragraphs | Space Grotesk | ≥ 14 px |
| Labels / metadata / nav | Space Mono | ALL CAPS, ≤ 14 px |
| Buttons | Space Mono | ALL CAPS — buttons are labels, not prose |
| Timestamps | Space Mono | 11 px, `--text-disabled` |

---

## Spacing Scale (8 px base)

`--space-2xs` 2 px · `--space-xs` 4 px · `--space-sm` 8 px · `--space-md` 16 px · `--space-lg` 24 px · `--space-xl` 32 px · `--space-2xl` 48 px · `--space-3xl` 64 px · `--space-4xl` 96 px

---

## Radius Scale

| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | 4 px | Inputs, small badges |
| `--radius-md` | 8 px | Cards, user bubbles |
| `--radius-lg` | 16 px | Modals, large cards |
| pill | `9999px` | Buttons, pill badges |

---

## Motion

Duration: 150–250 ms micro, 300–400 ms transitions. Easing: `cubic-bezier(0.25, 0.1, 0.25, 1)` (ease-out). No spring/bounce. No scroll-jacking. No parallax.

---

## Primitives (`src/components/ui/`)

### Button

| Variant | Appearance |
|---------|-----------|
| `primary` | White pill, black text — default action |
| `secondary` | Bordered pill, `--text-primary` text |
| `ghost` | No border, no radius — tertiary actions |
| `destructive` | `--accent` border and text |

Sizes: `sm` / `md` / `lg`. Hover: brightness filter only. No shadows. Disabled: `opacity-40`.

### Input / Textarea

Label: Space Mono 11 px ALL CAPS `--text-secondary`.
Input text: Space Grotesk 16 px `--text-primary`.
Variants: `underline` (bottom border only) / `outline` (full border `--radius-sm`).
Error: `--accent` border + Space Mono message below.

### Card

Variants: `default` (surface + border) / `raised` (surface-raised + border) / `bordered` (surface + border-visible).
Sizes: `sm` (radius-md) / `md` (radius-lg). No shadows.

### Badge

Border-only pill or technical (4 px radius). Space Mono ALL CAPS. No fill. Active: `--text-display` border + text.

### Spinner

8-segment hardware-style ring. Text fallback: `[LOADING...]` in Space Mono. No skeleton screens.

---

## Status Color Mapping

| Level / Quality | Color | Token |
|-----------------|-------|-------|
| sharp / verified | `#4A9E5C` | `--success` |
| solid / interactive | `#5B9BF6` | `--interactive` |
| basic | `#999999` | `--text-secondary` |
| unpublished | `#767676` | `--text-disabled` |
| weak / partial | `#D4A843` | `--warning` |
| refusal / error | `#D71921` | `--accent` |

---

## Anti-patterns (never add)

- No gradients in UI chrome (background images for data visualization only)
- No `box-shadow` or `drop-shadow` on any UI element
- No `backdrop-filter: blur()` — all glass utilities are removed
- No blob animations or organic shape movement
- No skeleton screens — use `[LOADING...]` bracket text or the Spinner primitive
- No border-radius > 16 px on cards
- No `100vw` or `w-screen` (mobile causes horizontal scroll) — use `w-full`

---

## Adding New UI

Before adding a new component or token:

1. Check if spacing or color difference alone suffices
2. Use an existing primitive (Button, Input, Card, Badge) before writing new markup
3. Token first — if you need a color that isn't in the palette, add it to `:root` in `globals.css` and the Tailwind alias in `tailwind.config.ts`
4. If the token only appears once, use the CSS var inline — no need to add a Tailwind alias
5. Match the three-layer hierarchy: one primary, one secondary, tertiary at edges

---

## Tailwind Aliases (`nd-*`)

All Nothing tokens are available as Tailwind utilities via the `nd-` prefix:

```
nd-black, nd-surface, nd-surface-raised, nd-border, nd-border-visible,
nd-text-disabled, nd-text-secondary, nd-text-primary, nd-text-display,
nd-accent, nd-accent-subtle, nd-success, nd-warning, nd-interactive
```

Font families: `font-display` (Doto), `font-sans` (Space Grotesk), `font-mono` (Space Mono).

---

## Deviations from Skill

| Deviation | Reason |
|-----------|--------|
| Fonts via `next/font/google` | Next.js optimization; skill recommends `<link>` |
| Input text: Space Grotesk (not Space Mono) | Chat/form legibility at 16 px; Mono at that size is too narrow |
| `--text-disabled` raised to `#767676` | WCAG safety margin; skill specifies `#666666` (3.66:1 fails AA) |
| Toast component kept | Existing usage; deprecated — use inline `[STATUS]` text for new UI |
| Doto limited to ≥ 32 px | Stricter than skill's ≥ 36 px; nothing below 32 px looks good in Doto |
