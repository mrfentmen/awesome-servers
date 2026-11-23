# Chewy Autoship Tracker Tracker

Real local JSON analysis of chewy autoship tracker in the Chewy Autoship lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/chewy-autoship-tracker-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "chewy-autoship-tracker-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/chewy-autoship-tracker-mcp"]
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
      "id": "chewy_autoship_chewy_autoship_tracker-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "chewy-autoship",
        "chewy",
        "autoship"
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
      "id": "chewy_autoship_chewy_autoship_tracker-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "chewy-autoship",
        "chewy",
        "autoship"
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
| `inventory_chewy_autoship_chewy_autoship_tracker` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_chewy_autoship_chewy_autoship_tracker_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_chewy_autoship_chewy_autoship_tracker_coverage` | Show category coverage ratios and unknown categories. |
| `flag_chewy_autoship_chewy_autoship_tracker_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_chewy_autoship_chewy_autoship_tracker_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_chewy_autoship_chewy_autoship_tracker_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_chewy_autoship_chewy_autoship_tracker_baseline` | Compare category counts with the configured baseline. |
| `estimate_chewy_autoship_chewy_autoship_tracker_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_chewy_autoship_chewy_autoship_tracker_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_chewy_autoship_chewy_autoship_tracker_dependencies` | Map dependency groups and show which ones are missing. |
| `test_chewy_autoship_chewy_autoship_tracker_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_chewy_autoship_chewy_autoship_tracker_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_chewy_autoship_chewy_autoship_tracker_fixes` | Rank fixes by impact divided by effort. |
| `validate_chewy_autoship_chewy_autoship_tracker_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_chewy_autoship_chewy_autoship_tracker_duplicates` | Group items with the same category and normalized name. |
| `measure_chewy_autoship_chewy_autoship_tracker_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_chewy_autoship_chewy_autoship_tracker_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_chewy_autoship_chewy_autoship_tracker_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_chewy_autoship_chewy_autoship_tracker_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_chewy_autoship_chewy_autoship_tracker_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_chewy_autoship_chewy_autoship_tracker_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_chewy_autoship_chewy_autoship_tracker_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_chewy_autoship_chewy_autoship_tracker_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_chewy_autoship_chewy_autoship_tracker_next_steps` | Recommend the next five actions with quick wins. |
| `open_chewy_autoship_chewy_autoship_tracker_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
