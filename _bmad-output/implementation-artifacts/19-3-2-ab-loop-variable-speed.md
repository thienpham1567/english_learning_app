# Story 19.3.2: A-B Loop + Variable Speed

Status: review

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

- [x] Task 1: Build `AudioPlayer.tsx` with marker + rate controls (AC1, AC2, AC3).
- [x] Task 2: Migrate ShadowingMode and DictationMode to use it (AC4).
- [x] Task 3: Add keyboard-shortcut handler with focus guard (AC5).
- [x] Task 4: Visual polish — marker ticks on the progress bar, current rate badge.

### Review Findings

- [ ] [Review][Decision] **`,`/`.` speed shortcuts only fire in `selfManagedSpeed` mode** — AC5 specifies shortcuts on "the player" globally. Currently, `,`/`.` are silently ignored on the main listening page (external speed managed by `useListeningExercise`). Need to decide: (a) wire `,`/`.` to call `onCycleSpeed` in external mode too, or (b) document this as by-design since listening page has its own speed button.
- [ ] [Review][Patch] **Side effect (`play()`) inside `setLooping` setState updater** [AudioPlayer.tsx:~136] — calling `audioRef.current.play()` inside a `setLooping(prev => {...})` updater violates React purity rules; move play call outside the updater.
- [ ] [Review][Patch] **`]` keyboard shortcut silently no-ops when A not set** [AudioPlayer.tsx:~207] — `setB` returns early but the keyboard handler gives no feedback; add a subtle visual cue or console.warn so users understand why B wasn't set.
- [ ] [Review][Patch] **`play()` failure in loop not recovered** [AudioPlayer.tsx:~118] — in `handleEnded` loop branch, `.catch(() => {})` silently swallows errors; `isPlaying` stays `true` even if autoplay is blocked. Add `.catch(() => setIsPlaying(false))`.
- [ ] [Review][Patch] **No minimum A-B distance enforced** [AudioPlayer.tsx:~123] — segments shorter than ~250ms (one `timeupdate` tick) will never trigger the loop; guard with `if (currentTime - markerA < 0.25) return` in `setB`, or show a warning.
- [ ] [Review][Patch] **ShadowingMode replay counter badge is misleading** [ShadowingMode.tsx:~53] — `maxReplays=999` makes the "Nghe lại (999/999)" label confusing. Pass `maxReplays={Infinity}` or hide the replay button entirely in Shadowing's unlimited-replay context.
- [x] [Review][Defer] **Minor blob URL leak if component unmounts mid-synthesis** [useSentenceAudio.ts:~51] — race between abort and `createObjectURL`; new URL created after abort is never revoked. Low severity in practice.
- [x] [Review][Defer] **`eslint-disable-next-line` suppression in ShadowingMode/DictationMode useEffect** [ShadowingMode.tsx:~57, DictationMode.tsx:~85] — suppression is technically correct since `synthesize` is stable, but fragile if hook internals change.
- [x] [Review][Defer] **Markers persist on sentence retry (same audioUrl)** [AudioPlayer.tsx:AC6] — AC6 says markers clear on exercise switch; on same-sentence retry, markers intentionally persist. Acceptable but potentially surprising.
- [x] [Review][Defer] **StrictMode double-synthesis in dev** [useSentenceAudio.ts] — React StrictMode double-invokes effects; second call self-corrects by aborting first. Dev-only, no prod impact.

## Dev Agent Record

### Completion Notes
- Enhanced `AudioPlayer.tsx` (full rewrite, backward-compatible API) with 5-step speed selector (0.5/0.75/1/1.25/1.5×), A-B loop markers (Set A / Set B / Loop toggle / Clear), and `preservesPitch = true` set explicitly on every rate change.
- Created `useSentenceAudio` hook that synthesizes sentence text to blob URL via `/api/voice/synthesize`, enabling AudioPlayer to be used for sentence-level playback in ShadowingMode and DictationMode.
- Migrated both ShadowingMode and DictationMode from `useTextToSpeech` (which played audio internally) to `useSentenceAudio` + `AudioPlayer`. Both modes now get A-B loop + variable speed for free.
- Keyboard shortcuts built into AudioPlayer via container-level keydown listener with focus guard (checks `document.activeElement` is not INPUT/TEXTAREA/SELECT). Shortcuts: `[` Set A, `]` Set B, `L` toggle loop, `←/→` ±3s, `,/.` rate down/up, `Space` play/pause.
- Visual polish: green marker tick for A, red marker tick for B, highlighted A-B region on progress bar (green when looping, blue when markers set but not looping), rate badge gets accent color when speed ≠ 1×.
- AudioPlayer supports two modes: external speed management (legacy, for listening page) and `selfManagedSpeed` (for ShadowingMode/DictationMode where the player manages its own speed state).
- `useListeningExercise` hook's `cycleSpeed` expanded from 3 options (0.75/1/1.25) to 5 options (0.5/0.75/1/1.25/1.5) to match AC1.
- All markers cleared on `audioUrl` change (AC6 — transient state).
- Type-checked: zero new errors in changed files; only pre-existing dictionary test errors remain.

### File List
- `apps/web/app/(app)/listening/_components/AudioPlayer.tsx` (modified) — full rewrite with A-B loop, expanded speed, keyboard shortcuts, marker ticks.
- `apps/web/hooks/useSentenceAudio.ts` (new) — synthesizes sentence text to blob URL for AudioPlayer.
- `apps/web/app/(app)/listening/_components/ShadowingMode.tsx` (modified) — migrated to useSentenceAudio + AudioPlayer.
- `apps/web/app/(app)/listening/_components/DictationMode.tsx` (modified) — migrated to useSentenceAudio + AudioPlayer.
- `apps/web/hooks/useListeningExercise.ts` (modified) — expanded cycleSpeed to 5 options.

### Change Log
- 2026-04-21: Implemented Story 19.3.2. Enhanced AudioPlayer with A-B loop + variable speed + keyboard shortcuts + marker ticks. Migrated ShadowingMode and DictationMode to use AudioPlayer via new useSentenceAudio hook.

## Dev Notes

- Keep the component headless-ish — style via props/className. No ripping out existing play/pause icons; wrap them.
- `preservesPitch` defaults vary by browser; always set it explicitly.
- Do not use Web Audio API buffer manipulation — it's overkill for this scope.

## References

- [MDN: HTMLMediaElement.preservesPitch](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/preservesPitch)
- Existing listening modes: [apps/web/app/(app)/listening/_components/](apps/web/app/(app)/listening/_components/)
