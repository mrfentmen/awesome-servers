# Golf Lesson Finder Archive

Real local JSON analysis of golf lesson finder in the Golf Lesson lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/golf-lesson-finder-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "golf-lesson-finder-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/golf-lesson-finder-mcp"]
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
      "id": "golf_lesson_golf_lesson_finder-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "golf-lesson",
        "golf",
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
      "id": "golf_lesson_golf_lesson_finder-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "golf-lesson",
        "golf",
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
| `inventory_golf_lesson_golf_lesson_finder` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_golf_lesson_golf_lesson_finder_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_golf_lesson_golf_lesson_finder_coverage` | Show category coverage ratios and unknown categories. |
| `flag_golf_lesson_golf_lesson_finder_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_golf_lesson_golf_lesson_finder_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_golf_lesson_golf_lesson_finder_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_golf_lesson_golf_lesson_finder_baseline` | Compare category counts with the configured baseline. |
| `estimate_golf_lesson_golf_lesson_finder_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_golf_lesson_golf_lesson_finder_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_golf_lesson_golf_lesson_finder_dependencies` | Map dependency groups and show which ones are missing. |
| `test_golf_lesson_golf_lesson_finder_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_golf_lesson_golf_lesson_finder_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_golf_lesson_golf_lesson_finder_fixes` | Rank fixes by impact divided by effort. |
| `validate_golf_lesson_golf_lesson_finder_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_golf_lesson_golf_lesson_finder_duplicates` | Group items with the same category and normalized name. |
| `measure_golf_lesson_golf_lesson_finder_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_golf_lesson_golf_lesson_finder_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_golf_lesson_golf_lesson_finder_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_golf_lesson_golf_lesson_finder_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_golf_lesson_golf_lesson_finder_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_golf_lesson_golf_lesson_finder_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_golf_lesson_golf_lesson_finder_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_golf_lesson_golf_lesson_finder_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_golf_lesson_golf_lesson_finder_next_steps` | Recommend the next five actions with quick wins. |
| `open_golf_lesson_golf_lesson_finder_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
