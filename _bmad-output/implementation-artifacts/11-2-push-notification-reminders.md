# Story 11.2: Push Notification System

Status: in-progress

## Story

As a learner,
I want daily reminders to study,
So that I don't forget and break my streak.

## Acceptance Criteria (from epics.md)

1. Push subscriptions stored in `push_subscription` table
2. Non-intrusive banner prompts for notification permission on first visit
3. Vercel Cron job triggers daily push delivery at 20:00 VN
4. Personalized content based on streak/flashcards/default
5. Users can disable notifications in settings

## Tasks / Subtasks

- [ ] Task 1: Push Subscription Schema + API
- [ ] Task 2: VAPID Key Generation + Web Push Setup
- [ ] Task 3: Notification Permission Banner
- [ ] Task 4: Cron API Route for Daily Push
- [ ] Task 5: Vercel Cron Config

## Dev Agent Record

### File List
