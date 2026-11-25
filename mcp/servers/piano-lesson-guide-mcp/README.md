# piano lesson guide Guide

Real local JSON analysis of piano lesson guide in the Music & Audio lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/piano-lesson-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "piano-lesson-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/piano-lesson-guide-mcp"]
    }
  }
}
```

## Input

Pass an array, an object with an `items` array, or a JSON file path. Every item needs a name and category. Cost, quantity, dates, condition, tags and notes are optional.

```json
{
  "items": [
    {
      "id": "music_piano_lesson_guide-music-1",
      "name": "music primary",
      "category": "music",
      "tags": [
        "music-audio",
        "piano",
        "lesson"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "music_piano_lesson_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "music-audio",
        "piano",
        "lesson"
      ],
      "cost": 35,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-29",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_music_piano_lesson_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_music_piano_lesson_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_music_piano_lesson_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_music_piano_lesson_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_music_piano_lesson_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_music_piano_lesson_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_music_piano_lesson_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_music_piano_lesson_guide_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_music_piano_lesson_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_music_piano_lesson_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_music_piano_lesson_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_music_piano_lesson_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_music_piano_lesson_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_music_piano_lesson_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_music_piano_lesson_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_music_piano_lesson_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_music_piano_lesson_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_music_piano_lesson_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_music_piano_lesson_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_music_piano_lesson_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_music_piano_lesson_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_music_piano_lesson_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_music_piano_lesson_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_music_piano_lesson_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_music_piano_lesson_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
