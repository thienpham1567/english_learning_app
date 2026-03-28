# SVG Logo Update — Design Spec

**Date:** 2026-03-29
**Status:** Approved

---

## Overview

Update `public/english-logo-app.svg` from the current muted teal-navy / warm cream palette to an "Elevated Premium" Deep Navy + Metallic Gold palette. Layout and shapes are unchanged — palette swap only.

---

## Changes

### Color Palette

| Token | Before | After |
|-------|--------|-------|
| Background fill | `#1A2B2F` | `#0F1B2D` |
| Gradient name | `warmCreamGradient` | `goldGradient` |
| Gradient stop 0% | `#E5D8B0` | `#B8922A` |
| Gradient stop 50% | `#F8F1E0` | `#E8C86D` |
| Gradient stop 100% | `#D4C49A` | `#B8922A` |
| White fills (`#F4F7F6`) | unchanged | unchanged |

### What Uses the Gradient

- Book highlight lines (top rule, middle rule, bottom rule)
- Star/sparkle decoration on the book
- "ENGLISH" subtitle text

### What Stays White (`#F4F7F6`)

- Book spine vertical bar
- "THIEN" heading text

---

## Files Touched

| File | Change |
|------|--------|
| `public/english-logo-app.svg` | Palette swap as described |
