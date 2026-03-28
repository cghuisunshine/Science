# Earth Science Flashcards AI Checker Design

**Date:** 2026-03-27

**Target file:** `earth_science_flashcards_practice.html`

## Goal

Replace the page's local keyword-based answer checker with the same API-configurable AI answer checker pattern used in `SC10-U4-ES-LG.html`, while preserving the existing flashcard study workflow.

## Current Context

- `earth_science_flashcards_practice.html` is a standalone flashcard page with:
  - a searchable/filterable question list
  - one textarea per card
  - a local keyword checker bound to each `Check` button
  - a `Show Answer` button and page-level `Check Visible` / `Reset All` actions
- `SC10-U4-ES-LG.html` already contains the approved AI grading pattern:
  - an `AI answer check` settings panel with API URL, `Test`, and status text
  - per-answer `Check` controls that call a grading endpoint
  - inline feedback UI for long-form grader responses
  - URL persistence and API availability handling

## Requirements

1. Remove the current local keyword grading path from `earth_science_flashcards_practice.html`.
2. Add the same AI grading configuration pattern used by `SC10-U4-ES-LG.html`.
3. Keep the flashcard page standalone and client-side only.
4. Preserve existing search, section filter, `Show Answer`, and reset workflows.
5. Keep `Check Visible`, but make it run AI checks instead of keyword checks.
6. Do not silently fall back to keyword grading if the AI grader is unavailable.
7. Show clear inline status for empty answers, missing API URL, loading state, success, and request failure.

## Chosen Approach

Mirror the `SC10-U4-ES-LG.html` AI checker pattern closely inside the flashcards page instead of designing a new checker flow.

### Why this approach

- It matches the user's explicit reference page.
- It reduces risk by reusing a known-good request/feedback model.
- It keeps the flashcards page simple: the study interaction stays the same, only the grading mechanism changes.

## UX Design

### Top-level AI controls

Add an `AI answer check` settings panel near the top of the page with:

- a `Grade API URL` text field
- a `Test` button
- a status text area
- a short explanation that the `Check` buttons send the question and student answer to the grader

Persist the API URL in `localStorage` so the page remembers it between sessions.

### Card-level behavior

Each flashcard keeps:

- the question
- the answer textarea
- the `Check` button
- the `Show Answer` button
- the hidden model answer panel

Behavior changes:

- `Check` no longer uses keyword counts.
- `Check` sends the question, the typed student answer, and the model answer to the AI grader.
- Feedback is shown inline in a longer-form tip/feedback block suitable for AI-generated comments.
- Empty answers should be blocked locally with a direct prompt.

### Batch behavior

- `Check Visible` iterates through currently visible cards and runs the AI check for each one sequentially.
- `Reset All` clears typed answers, AI feedback text, card state classes, and shown answer panels.

## Data Flow

### Request inputs per card

For each AI check, gather:

- question text
- student answer text
- model answer text
- optional section label if useful for grader context

### Grader integration

Use the same backend contract style as `SC10-U4-ES-LG.html`, so the flashcards page can point to the same grader service. The page should treat the grader response as displayable feedback text and not attempt local scoring.

### State handling

Store:

- the API URL in `localStorage`
- feedback content in the DOM for each card
- loading/disabled state on the card-level `Check` button during requests

Do not add new backend dependencies or build steps.

## Error Handling

- Missing API URL: show a clear inline warning and skip the request.
- Empty answer: show `Please type an answer first.`
- Network or timeout failure: show an inline `AI grading unavailable` message.
- Invalid or unexpected response: show a safe generic error instead of crashing.
- Repeated clicks during an in-flight request: ignore by disabling the active button until completion.

## Implementation Boundaries

### Files to modify

- `earth_science_flashcards_practice.html`

### Files used as reference only

- `SC10-U4-ES-LG.html`

### Explicit non-goals

- No redesign of the flashcard card layout
- No multilingual support changes
- No server implementation work
- No local keyword scoring fallback
- No migration to a build system or framework

## Verification Plan

1. Load `earth_science_flashcards_practice.html` in a browser and confirm no console errors.
2. Confirm the AI settings panel renders and the URL persists after reload.
3. Confirm `Test` updates the status text based on the configured endpoint.
4. Confirm single-card `Check`:
   - blocks empty input
   - disables while loading
   - renders returned AI feedback
5. Confirm `Check Visible` processes visible cards and leaves hidden cards untouched.
6. Confirm `Show Answer` still toggles independently of AI feedback.
7. Confirm `Reset All` clears textareas, feedback, card highlight state, and revealed answers.

## Acceptance Criteria

- The page no longer grades by keyword matching.
- The page exposes an AI grader URL setting and API test control.
- Each card can be checked through the AI grader with clear inline feedback.
- `Check Visible` uses AI grading for the visible set.
- Existing study workflows remain intact.
