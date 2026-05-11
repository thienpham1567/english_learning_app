---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Consolidate 23 English learning modules into a focused TOEIC 4-Skills self-study app'
session_goals: 'Merge, group, restructure all modules around TOEIC L/R/S/W exam structure. Eliminate redundancy.'
selected_approach: 'AI-Recommended'
techniques_used: [affinity-mapping, constraint-removal, reverse-brainstorming, deep-dive-analysis]
ideas_generated: [deep-dive-analysis, upgrade-refactor-plan]
context_file: ''
session_continued: true
continuation_date: '2026-05-11T11:20:00+07:00'
---

# Brainstorming Session Results

**Facilitator:** Thienpham
**Date:** 2026-05-11

## Session Overview

**Topic:** Consolidating 23 modules into a pure TOEIC 4-Skills self-study app
**Goals:** Restructure navigation, merge redundant modules, make every feature serve TOEIC preparation

### Context Guidance

_App currently has 23 routes organized in 5 sidebar groups: Luyện tập (9 items), Ngữ pháp (2), Từ vựng (3), Kiểm tra & Ôn tập (3), Khám phá (1). Target: TOEIC 4 Skills (L&R 990pts + S&W 400pts)._

### Session Setup

_Deep dive analysis of all 23 existing pages completed. User confirmed TOEIC 4 Skills target with module consolidation approach._

## Continuation Session — Deep Dive & Planning

### Deep Dive Analysis Completed

Full exhaustive analysis of every layer of the app:
- 163 TSX files, ~40K LOC
- 44 API routes vs 11 sidebar items
- 18 custom hooks (2 unused)
- 12 orphaned routes (~3,226 LOC)
- Critical bug: `/toeic-practice` is 404
- IELTS leftovers in TOEIC-only app
- No dashboard, no onboarding, no predicted score UI

**Artifact:** `deep_dive_analysis.md`

### Upgrade & Refactor Plan — APPROVED ✅

5-phase plan covering ~11 working days:
1. **Phase 1** (1 day): Hotfix broken route + purge IELTS
2. **Phase 2** (3 days): Dashboard + Onboarding + Predicted Score
3. **Phase 3** (3 days): TOEIC Skills Hub restructure (ReadingTab, SpeakingTab expansion)
4. **Phase 4** (2 days): Route cleanup + API pruning
5. **Phase 5** (2 days): Design system + DX polish

**Artifact:** `upgrade_refactor_plan.md`
**Status:** Approved by user on 2026-05-11
