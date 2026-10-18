# watchd — the same feeds, all day, with a push when a threshold is met

The packages in this repo answer when asked. The flood stage does not care whether anyone
asked. `watchd` closes that gap: it polls the same keyless feeds the subtree agents were
verified against, evaluates plain thresholds and notifies you through whatever channel you
hand it.

```
watchd/
  watchd.py                the watcher (stdlib only)
  conditions.example.json  the shape of a conditions file
  tests/test_watchd.py     offline tests (feeds injected; no network)
```

## Quick start

```bash
cd watchd
cp conditions.example.json conditions.json   # edit places, thresholds, notifiers
python3 watchd.py --config conditions.json --once     # one pass (cron-friendly)
python3 watchd.py --config conditions.json --loop     # poll forever
```

## What it watches

| kind | source (keyless) | question it answers |
|---|---|---|
| `air` | Open-Meteo air-quality, US AQI | "is the air over my threshold right now?" |
| `quakes` | USGS event service | "did a quake of M X happen within Y km in the last hour?" |
| `flood` | NWS NWPS `v1/gauges` | "is the gauge at or past its published flood stage?" |

Each fired alert carries the reading it saw — `US AQI 162 (over your threshold 150)`,
`M4.9 — 12 km from Fresno, 3 min ago` — so a notification never asks you to trust a bare
threshold flag without the number behind it.

## Notifiers

* `console` — loud STDOUT line (on by default)
* `file` — JSONL append: `{"kind": "file", "path": "alerts.jsonl"}`
* `webhook` — POST JSON to a URL; a dead webhook is logged and never stops the watcher

## Honesty, carried over from the agents

* A feed that did not answer is logged as a feed problem — it is never an alert.
* Refires are rate-limited (`refire_s`, default 3 h) so a stuck gauge cannot spam you.
* State lives in `--state watchd-state.json` (atomic writes; survives restarts).

## The obtainable service, in one paragraph

The code is free and self-hostable. What can be paid for is *running it for you*: higher
frequency polls, more channels (Telegram/email/SMS), per-need condition authoring, and
public incident pages. The plans page on the site is the pricing this paragraph becomes
when someone asks.
