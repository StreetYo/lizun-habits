# Habits for Lizun

Daily habits in the [Lizun](https://github.com/StreetYo/Lizun) island: a check for today, the
current streak and the last seven days at a glance. The closed island shows the next habit left
for today.

## Install

In Lizun, open Settings > Widgets > Add a widget, paste this link and press Install:

```
https://github.com/StreetYo/lizun-habits
```

To install a fixed version, use the link of a release instead, for example
`https://github.com/StreetYo/lizun-habits/releases/tag/v1.0.0`.

## Using it

- Type a habit in the field and press Enter; the field stays ready for the next one. Enter in an
  empty field, or Esc, gives the keyboard back to your app. Up to 12 habits; the list scrolls
  when they do not fit.
- Click the circle to check a habit for today, click it again to undo. The seven dots are the
  last seven days, today on the right; click a dot to fix a day you forgot.
- The number is the streak: days in a row, with a flame from two days on. Until you check a
  habit today, the streak still counts up to yesterday, so it does not look broken in the
  morning.
- Point at a habit and click the `...` button at the end of its row for the menu: rename
  (Enter saves, Esc cancels), move up or down, delete. Delete asks for a second click and
  removes the habit's history too.
- Days are calendar days in your time zone and change at midnight, also while the island is
  open. With "Day starts at" set to, say, 3, a check at 1 AM still counts for the evening
  before.

In the closed island the widget shows the next habit left for today and how many are done
(`2/5`). When all are done it hides, or, with "Hide when all are done" off, shows a check and
the best current streak.

Settings (Settings > Widgets > Habits): day starts at, show habits in the closed island, hide
from the closed island when all are done.

## Permissions

| Permission | Why |
|---|---|
| `storage` | Keeps the habits and the days they were done. They stay on this computer, in Lizun's own storage. |
| `activity` | Shows the next habit for today in the closed island. |

No network access.

## Development

The widget is plain HTML, CSS and JavaScript with no build step:

| File | What it is |
|---|---|
| `manifest.json` | Id, size, permissions, settings and their Russian translation |
| `index.html` | Page shown in the island |
| `main.js` | State, drawing, adding, the menu actions, the day changing at midnight |
| `row.js` | One habit's row: check, name, streak, dots, menu |
| `days.js` | Local days as `YYYY-MM-DD`, the next rollover, streaks |
| `store.js` | Loading and saving: `habits` holds the list, `history.<id>` the sorted days of one habit (about ten years kept) |
| `live.js` | The live activity in the closed island |
| `texts.js` | The widget's texts in English and Russian |
| `style.css` | Look, built on the island theme (`--lz-*` variables from `/__sdk/lizun.css`) |
| `icons/` | Icons as SVG files, drawn in the current text color through CSS masks |

To try changes, choose this folder in Settings > Widgets > Add a widget, or copy it to
`%APPDATA%\app.lizun.desktop\widgets\lizun.habits\` and press Reload. How widgets work:
[Writing a Lizun widget](https://github.com/StreetYo/Lizun/blob/master/docs/widgets.md).

To release a version, raise `version` in `manifest.json`, then tag and publish a GitHub release
(`v1.0.1`).
