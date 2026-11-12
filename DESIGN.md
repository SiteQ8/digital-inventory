# Design

The world is the sheet itself: a paper kept with a family's important documents, written in ink and closed with one stamp. The page is a working tool, so the world lends only its materials and one signature.

## Materials

| Token | Value | Job |
|---|---|---|
| `--paper` | #F2F0EA | the ground |
| `--sheet` | #FBFAF6 | fields and chips, the lighter paper you write on |
| `--ink` | #1B2430 | text and the main action |
| `--ink-soft` | #4E5863 | secondary text, field borders |
| `--line`, `--line-soft` | #C9C5B9, #DEDBD1 | rules |
| `--stamp` | #0E5A4B | the stamp ink: what is done, what is current, focus |
| `--amber` on `--amber-wash` | #744700 on #F3E6CB | what is missing, and warnings |
| `--danger` | #962819 | removal only |

The stamp green is never decoration. It marks a finished asset, the current tab, the seal and the focus ring.

## Type

Markazi Text carries the name, view headings, the seal's figure and the printed sheet's titles: the document's voice. Tajawal carries everything else. Sizes are fixed: 14, 16, 18, 22, 30 and 44 px. Arabic body text runs at a line height of 1.75.

## Form

* One ruled list, a line per asset. No cards and no shadows.
* One radius (4 px), one rule weight (1 px), one mark weight (2 px).
* Spacing from one scale: 4, 8, 12, 16, 24, 32, 48, 64 px.
* Every control is at least 44 px tall.
* One button family: ink fill for the main action of a view, an outline for the rest, underlined text for quiet actions.

## The signature: the seal

A stamp in the header whose ring fills as steps are completed, with the count beside it. When nothing is missing, a copy is saved and the sheet is printed, it reads "Sealed". It is the only element that moves on its own (280 ms, ease out).

## Motion

Buttons press to 0.97 in 160 ms. The row marker turns in 160 ms. Hover styles apply only to fine pointers. Under reduced motion nothing moves.

## Print

The printed sheet is black on white, A4, two pages: the inventory with signature lines, then the family guide with what the recipient does for each asset.

## Rules the tests hold

Colours and durations exist only as tokens. Both languages carry the same keys. The page loads nothing from another host.
