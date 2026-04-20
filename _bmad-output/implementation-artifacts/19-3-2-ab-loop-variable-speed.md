# Story 19.3.2: A-B Loop + Variable Speed

Status: ready-for-dev

## Story

As a self-learner, I want to loop a specific segment of a listening passage and slow it down without changing pitch — so I can drill tricky phrases until I catch every word.

**Epic:** 19 — Four-Skills Enhancement
**Sprint:** R11 — Listening Advanced
**Story ID:** 19.3.2
**Dependencies:** —

## Acceptance Criteria

1. **AC1** — Audio player on `listening/*` modes gains controls: playback rate (0.5× / 0.75× / 1× / 1.25× / 1.5×) and an A-B loop pair of markers.
2. **AC2** — A-B loop: click "Set A" at current time, "Set B" at a later time, toggle "Loop" to replay the A–B segment continuously. A dedicated "Clear" resets both markers.
3. **AC3** — Playback rate uses `HTMLAudioElement.playbackRate` with `preservesPitch = true` (Chrome/Safari/Firefox all support this now). Verify pitch preservation in the UI by listing a small note beneath the control.
4. **AC4** — A new component `AudioPlayer.tsx` encapsulates this and is used from ShadowingMode, DictationMode, and any future listening surfaces. Existing internals should migrate to use it (refactor, not duplicate).
5. **AC5** — Keyboard shortcuts: `[` = Set A, `]` = Set B, `L` = toggle loop, `←/→` = ±3s, `,`/`.` = rate down/up. Shortcuts only fire when the player is focused (not during transcript typing).
6. **AC6** — State is transient (not persisted); switching exercises clears markers.

## Tasks

- [ ] Task 1: Build `AudioPlayer.tsx` with marker + rate controls (AC1, AC2, AC3).
- [ ] Task 2: Migrate ShadowingMode and DictationMode to use it (AC4).
- [ ] Task 3: Add keyboard-shortcut handler with focus guard (AC5).
- [ ] Task 4: Visual polish — marker ticks on the progress bar, current rate badge.

## Dev Notes

- Keep the component headless-ish — style via props/className. No ripping out existing play/pause icons; wrap them.
- `preservesPitch` defaults vary by browser; always set it explicitly.
- Do not use Web Audio API buffer manipulation — it's overkill for this scope.

## References

- [MDN: HTMLMediaElement.preservesPitch](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/preservesPitch)
- Existing listening modes: [apps/web/app/(app)/listening/_components/](apps/web/app/(app)/listening/_components/)
