# Design

## The world: sheet and biro

A white sheet, black print, and one blue. The form is printed in black. Whatever a person wrote on it is in blue, as on a paper form filled in with a biro, and blue is also the one main action. Nothing else is tinted.

This replaced an earlier cream paper, serif and green look, which read as a default.

## How it was decided

The parts a template would fix were drawn at random from fixed lists, not picked by taste:

| Part | Drawn |
|---|---|
| Palette | white, near black, one grey step, one blue |
| Type | SUSE, with IBM Plex Sans Arabic for Arabic |
| Hero | words, a collage of the tool in three sets, one large button |
| Bar | words in the middle, name at the start, action at the end |
| Rhythm | one dark band in the second half, holding the strongest picture |
| Close | one line and one button across the page, on a slab with the footer |
| Buttons | pills |
| Moment | a line climbs the dark band and carries its colour up |

Two draws were redrawn because they did not fit: a bar with a large menu panel (the page has four links), and a moment that splits a headline into letters (Arabic letters join, so they cannot be split).

## Tokens

| Token | Value | Job |
|---|---|---|
| `--bg` | #ffffff | the sheet |
| `--surface` | #f4f4f4 | panels, notes, the closing slab |
| `--ink` | #111111 | print |
| `--muted` | #6b6b6b | secondary print |
| `--line`, `--line-strong` | #e2e2e2, #bdbdbd | rules, field borders |
| `--accent` | #1a4be0 | what a person wrote, the main action, done, focus |
| `--accent-wash` | #edf1fe | the chosen row, the focus ring |
| `--inv-bg`, `--inv-ink` | #111111, #ffffff | the dark band |
| `--danger` | #b3261e | removal and the warning about a typed secret |

Type: 13, 14, 16, 20, 28, 48 and 52 px (30 and 40 on a phone). Weights 400 and 500 only. Latin headings are tracked in by 3%. Arabic is never tracked, because tracking breaks its joins.

Space: 4, 8, 12, 16, 24, 32, 48, 64, 96 px. Radius: 8 fields, 12 cards, 24 slabs, pills for buttons. Every control is at least 44 px tall.

## The front page

Six screens at 1440 by 900, one section each: hero, the tool window, three steps, the sheet on the dark band, questions, the close with the footer. Every picture is the tool itself, drawn live from a sample inventory in which roles stand where names would.

One grid of twelve columns, one pair of text lines. Sections are parted by space or a full ground change, never by boxes.

## The tool

A working screen first: a bar with four sections, then the list of assets beside the open asset. On a phone the list and the open asset take turns. Controls are the browser's own: inputs, selects, checkboxes, links.

The signature is the ink: every value a person typed is blue, in the fields, in the list and on the sheet shown on the front page. Print is black only.

## Motion

| Motion | Why |
|---|---|
| The hero enters once: the heading rises line by line, then the lead and button, the collage settles | the words arrive first, then what to do |
| The collage changes set every 2.8 s | three sides of the tool in the space of one |
| One loop in the tool window, 3.2 s | shows a step ticked and the asset turning complete |
| The line on the dark band, tied to the scroll | marks the turn from the tool to the paper |
| Buttons step up 1 px on hover and sink on press, links draw their line | every control answers |

Hover moves only for a fine pointer. Each moving picture has a pause button. A phone and reduced motion get the still picture. Nothing fades in because the page scrolled.

## Rules the tests hold

Colours and durations exist only as tokens. Both languages carry the same keys. No page names another host or carries a style attribute.
