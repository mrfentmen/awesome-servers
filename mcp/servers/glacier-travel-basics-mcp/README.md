# Glacier Travel Basics Audit

Real local JSON analysis of glacier travel basics in the Glacier Travel lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/glacier-travel-basics-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "glacier-travel-basics-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/glacier-travel-basics-mcp"]
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
      "id": "glacier_travel_glacier_travel_basics-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "glacier-travel",
        "glacier",
        "travel"
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
      "id": "glacier_travel_glacier_travel_basics-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "glacier-travel",
        "glacier",
        "travel"
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
| `inventory_glacier_travel_glacier_travel_basics` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_glacier_travel_glacier_travel_basics_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_glacier_travel_glacier_travel_basics_coverage` | Show category coverage ratios and unknown categories. |
| `flag_glacier_travel_glacier_travel_basics_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_glacier_travel_glacier_travel_basics_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_glacier_travel_glacier_travel_basics_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_glacier_travel_glacier_travel_basics_baseline` | Compare category counts with the configured baseline. |
| `estimate_glacier_travel_glacier_travel_basics_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_glacier_travel_glacier_travel_basics_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_glacier_travel_glacier_travel_basics_dependencies` | Map dependency groups and show which ones are missing. |
| `test_glacier_travel_glacier_travel_basics_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_glacier_travel_glacier_travel_basics_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_glacier_travel_glacier_travel_basics_fixes` | Rank fixes by impact divided by effort. |
| `validate_glacier_travel_glacier_travel_basics_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_glacier_travel_glacier_travel_basics_duplicates` | Group items with the same category and normalized name. |
| `measure_glacier_travel_glacier_travel_basics_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_glacier_travel_glacier_travel_basics_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_glacier_travel_glacier_travel_basics_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_glacier_travel_glacier_travel_basics_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_glacier_travel_glacier_travel_basics_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_glacier_travel_glacier_travel_basics_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_glacier_travel_glacier_travel_basics_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_glacier_travel_glacier_travel_basics_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_glacier_travel_glacier_travel_basics_next_steps` | Recommend the next five actions with quick wins. |
| `open_glacier_travel_glacier_travel_basics_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
