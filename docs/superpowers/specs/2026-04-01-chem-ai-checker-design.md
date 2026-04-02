# Chemistry Guide AI Checker Design

## Goal

Add the same AI answer checking capability used in `SC10-U4-ES-LG.html` to `SC10-Chem-Learning-Guide.html`, with inline AI check controls available on every answer field in the chemistry guide.

## Scope

In scope:

- Add the AI settings panel used by the Earth Science guide.
- Add per-field AI check and reset controls to every answer field in the chemistry guide.
- Reuse the same client-side grading flow and shared widget script where possible.
- Preserve existing chemistry-specific behavior, especially local autosave and chemical subscript formatting.

Out of scope:

- Changing the grading prompt or backend API contract.
- Redesigning the Earth Science AI checker UI.
- Selectively enabling AI on only some chemistry questions.

## Requirements

The chemistry guide must:

- Show AI checking controls on every persisted answer field.
- Support short text inputs, inline fill-in inputs, and textareas.
- Keep the existing print behavior by hiding AI-only controls in print output.
- Avoid letting the chemical formatter rewrite AI UI text.
- Continue saving student answers locally exactly as it does now.

## Approach

Use `SC10-U4-ES-LG.html` as the reference implementation and port the same feature set into the chemistry guide with minimal behavioral drift.

### UI

- Add the same optional AI settings panel near the top of the page.
- Add the Earth Science AI checker CSS classes needed for inline controls, status text, and tips.
- Attach one inline AI control group to each answer field:
  - `Check with AI`
  - reset/clear button
  - inline feedback area

### Field Coverage

Every `.persist` answer field in `SC10-Chem-Learning-Guide.html` should receive AI controls, including:

- `textarea.persist`
- `input.persist`
- `input.inline-input.persist`
- name fields only if they are currently marked as `.persist`

If name fields are included by the current selector, we should explicitly exclude them during AI wiring, because they are not answer content and would create unnecessary grading UI.

## Data Flow

1. Student enters an answer.
2. Existing autosave continues to write the answer to localStorage.
3. Student clicks the inline AI check button.
4. The field value and surrounding prompt context are sent through the same grading path used in `SC10-U4-ES-LG.html`.
5. Inline feedback is shown next to that field.
6. Reset clears only the AI feedback state, not the saved student answer.

## Chemistry-Specific Constraints

The chemistry guide already runs `formatChemicalTextNodes()` to inject `<sub>` markup into formula text. That logic must continue to skip AI controls and AI settings content.

The formatter exclusion list should therefore include:

- `.ai-tools`
- `.ai-check-wrap`

This matches the pattern already present in the Earth Science guide and prevents chemical formatting from mutating the AI UI.

## Implementation Notes

- Prefer copying the smallest coherent slice from `SC10-U4-ES-LG.html` instead of hand-recreating behavior.
- Reuse `assets/page_ai_widget.js` if the chemistry guide can be wired to it cleanly.
- Keep new code names aligned with the Earth Science guide where practical so future maintenance stays simple.
- Preserve the previously fixed chemistry formatting behavior where formatted formula text inside grid labels must remain wrapped as a single inline node.

## Testing

Add regression checks that verify:

- the chemistry guide includes AI checker wiring;
- the chemistry guide includes the shared AI widget script or equivalent grading logic;
- chemistry formatter exclusions include AI UI containers;
- chemistry text formatting still wraps formatted text as a single replacement node;
- the existing subscript style regression still passes.

Manual verification:

- Load the chemistry guide in the browser.
- Confirm AI controls appear next to every answer field except excluded non-answer fields.
- Confirm the `u.` reaction row and other grid-based chemistry rows still render correctly.
- Confirm AI controls do not appear in print mode.

## Risks

- The chemistry guide is denser than the Earth Science guide, so adding controls to every field may visually crowd some sections.
- Inline fill-in questions may need slight spacing adjustments to prevent AI controls overlapping nearby content.
- If the Earth Science implementation assumes specific DOM structure, chemistry pages may need small adaptation hooks.

## Recommendation

Implement the Earth Science AI checker pattern with minimal deviation, while explicitly excluding non-answer fields such as student name inputs and protecting chemistry formatting from touching AI UI elements.
