# Instructor Feedback HTML Design

Date: 2026-04-04

## Goal

Create a standalone HTML page for instructor feedback that is intended for LMS/browser viewing rather than print-first use. The page should feel polished and formal, remain easy to read on desktop and mobile, and present the provided feedback text without student-specific fields.

## Context

- Repository already contains multiple standalone HTML teaching pages.
- The user selected a polished on-screen presentation instead of a print-first sheet.
- The user selected a formal report visual direction over editorial or progress-report variants.
- The page should remain generic and must not include `Student Name`, `Course`, or `Date` fields.

## Recommended Approach

Build a single self-contained HTML file with embedded CSS and semantic content structure.

This approach is preferred because:

- it matches the repository's existing pattern of standalone HTML resources
- it is easy to upload or link in an LMS
- it avoids external dependencies
- it supports responsive reading without requiring JavaScript

## Information Architecture

The page will use a straightforward single-column structure:

1. Intro header
2. Main feedback summary
3. Improvement section

### Intro header

- Title: `Instructor Feedback`
- Short subtitle indicating Unit 1 biology feedback context

### Main feedback summary

Render the first three provided paragraphs as reading-focused content blocks.

### Improvement section

Render `Ways to improve your answers` as a distinct section containing five clearly separated improvement items.

## Visual Direction

The design should follow a formal report aesthetic:

- warm off-white content surface
- darker surrounding page background for contrast in LMS/browser view
- serif-forward heading treatment for a school-report feel
- restrained accent color in the brown/earth range
- strong spacing and section dividers instead of dashboard components

The page should explicitly avoid:

- dashboard-like KPI cards
- corporate SaaS styling
- decorative badges or filler UI
- oversized rounded corners
- blue-heavy default AI-like palettes

## Responsive Behavior

- Desktop: centered reading surface with generous margins and spacing
- Tablet/mobile: reduce horizontal padding, preserve hierarchy, keep a single column
- No horizontal scrolling

## Accessibility

- Use semantic headings and section structure
- Maintain readable line length and strong text contrast
- Avoid relying on color alone for meaning
- Preserve straightforward reading order

## Error Handling / Risks

Primary implementation risk is over-styling the page so it feels like a dashboard rather than instructor feedback. The design should remain visually intentional but text-first.

## Testing

Verification should cover:

- opening the page directly in a browser
- checking readability at desktop and mobile widths
- confirming the provided content appears exactly and in full
- confirming the layout works without external assets

