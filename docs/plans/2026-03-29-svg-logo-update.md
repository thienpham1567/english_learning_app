# SVG Logo Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `public/english-logo-app.svg` to the "Elevated Premium" palette — Deep Navy background and Metallic Gold gradient, keeping all shapes and layout unchanged.

**Architecture:** Palette-only SVG edit — rename the gradient, swap the background fill, replace stop colors. No layout, viewBox, or shape changes.

**Tech Stack:** SVG (plain text edit)

---

## Files

- Modify: `public/english-logo-app.svg`

---

### Task 1: Swap palette to Deep Navy + Metallic Gold

**Files:**
- Modify: `public/english-logo-app.svg`

- [ ] **Step 1: Replace background fill and rename gradient**

Open `public/english-logo-app.svg` and apply ALL of the following changes at once:

1. Background rect: `fill="#1A2B2F"` → `fill="#0F1B2D"`
2. Gradient id: `warmCreamGradient` → `goldGradient` (rename in `<defs>` AND every `fill="url(#warmCreamGradient)"` reference — there are 3 of them)
3. Gradient stop colors:
   - Stop 0%: `stop-color="#E5D8B0"` → `stop-color="#B8922A"`
   - Stop 50%: `stop-color="#F8F1E0"` → `stop-color="#E8C86D"`
   - Stop 100%: `stop-color="#D4C49A"` → `stop-color="#B8922A"`

The final file must look exactly like this:

```svg
<svg width="250" height="150" viewBox="0 0 250 150" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#B8922A"/> <stop offset="50%" stop-color="#E8C86D"/> <stop offset="100%" stop-color="#B8922A"/> </linearGradient>
  </defs>

  <rect width="250" height="150" rx="10" fill="#0F1B2D"/>

  <g transform="translate(60, 40)">
    <path d="M6 0 C8 0, 10 2, 10 4 V56 C10 58, 8 60, 6 60 C4 60, 2 58, 2 56 V4 C2 2, 4 0, 6 0 Z" fill="#F4F7F6"/>

    <path d="M-12 6 C-14 6, -16 4, -16 2 C-16 0, -14 -2, -12 -2 H52 C54 -2, 56 0, 56 2 C56 4, 54 6, 52 6 Z" fill="url(#goldGradient)"/>

    <path d="M12 28 C14 28, 16 30, 16 32 C16 34, 14 36, 12 36 H38 C40 36, 42 34, 42 32 C42 30, 40 28, 38 28 Z" fill="#F4F7F6"/>

    <path d="M6 50 C8 50, 10 52, 10 54 C10 56, 8 58, 6 58 H46 C48 58, 50 56, 50 54 C50 52, 48 50, 46 50 Z" fill="#F4F7F6"/>

    <path d="M48 6 L51 12 L57 12 L52.5 16.5 L54 22.5 L48 19.5 L42 22.5 L43.5 16.5 L39 12 L45 12 Z" fill="url(#goldGradient)"/>
  </g>

  <g transform="translate(130, 80)">
    <text x="0" y="0" font-family="Lexend, sans-serif" font-weight="700" font-size="28" fill="#F4F7F6" letter-spacing="1">THIEN</text>

    <text x="0" y="24" font-family="Montserrat, sans-serif" font-weight="100" font-size="16" fill="url(#goldGradient)" letter-spacing="2">ENGLISH</text>
  </g>
</svg>
```

- [ ] **Step 2: Verify no `warmCreamGradient` references remain**

Run:
```bash
grep -c "warmCreamGradient" public/english-logo-app.svg
```

Expected output: `0`

- [ ] **Step 3: Commit**

```bash
git add public/english-logo-app.svg
git commit -m "feat: update logo to Elevated Premium palette — Deep Navy + Metallic Gold"
```
