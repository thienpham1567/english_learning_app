# Story 19.4.2: Click-to-Define Inline + Save to Vocab

Status: ready-for-dev

## Story

As a self-learner, I want to click any word in a reading passage and see a definition popover with pronunciation, examples, and a one-tap "Save to my vocabulary" — so looking up and adding words doesn't break my reading flow.

**Epic:** 19 — Four-Skills Enhancement
**Sprint:** R12 — Reading Advanced
**Story ID:** 19.4.2
**Dependencies:** —

## Acceptance Criteria

1. **AC1** — Passage body renders each token as clickable; clicking a word opens a popover anchored to the token.
2. **AC2** — Popover content: headword (lemma), IPA, brief definition, 1 example sentence, a TTS play button (reusing `useTextToSpeech`), "Save to vocab" button, and (if word already saved) "View in notebook" link.
3. **AC3** — Lookup uses the existing dictionary service (`/api/dictionary/...`). If the dictionary has no entry for the surface form but a lemma exists, the popover uses the lemma.
4. **AC4** — "Save to vocab" calls existing `POST /api/vocabulary` and closes with a toast; idempotent if already saved.
5. **AC5** — Selecting multiple words (text-selection drag) supports "Save phrase" — stores the selection as a collocation entry.
6. **AC6** — Works for both 19.4.1 passages and the existing reading pages (no duplication). UI uses Radix Popover or headlessui — no ad-hoc absolute-position floater.

## Tasks

- [ ] Task 1: Build `WordClickableText.tsx` that tokenizes and renders with click handlers (AC1).
- [ ] Task 2: Build `WordPopover.tsx` using Radix Popover (AC2, AC6).
- [ ] Task 3: Wire lookup with fallback-to-lemma logic (AC3).
- [ ] Task 4: Wire save-to-vocab and phrase-save (AC4, AC5).
- [ ] Task 5: Migrate existing reading passages to use the new component.

## Dev Notes

- Tokenization should preserve punctuation as non-clickable — only alphabetic tokens are clickable.
- Popover should be dismissable via Esc and outside-click.
- Avoid N+1 dictionary calls on render — only fetch on click.

## References

- Existing dictionary: [apps/web/app/api/dictionary/](apps/web/app/api/dictionary/)
- Existing vocab API: [apps/web/app/api/vocabulary/](apps/web/app/api/vocabulary/)
- [Radix Popover](https://www.radix-ui.com/primitives/docs/components/popover)
