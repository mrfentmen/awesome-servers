# Hickory Nut Crack Planner

Real local JSON analysis of hickory nut crack in the Hickory Nut lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/hickory-nut-crack-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "hickory-nut-crack-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/hickory-nut-crack-mcp"]
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
      "id": "hickory_nut_hickory_nut_crack-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "hickory-nut",
        "hickory",
        "nut"
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
      "id": "hickory_nut_hickory_nut_crack-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "hickory-nut",
        "hickory",
        "nut"
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
| `inventory_hickory_nut_hickory_nut_crack` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_hickory_nut_hickory_nut_crack_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_hickory_nut_hickory_nut_crack_coverage` | Show category coverage ratios and unknown categories. |
| `flag_hickory_nut_hickory_nut_crack_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_hickory_nut_hickory_nut_crack_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_hickory_nut_hickory_nut_crack_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_hickory_nut_hickory_nut_crack_baseline` | Compare category counts with the configured baseline. |
| `estimate_hickory_nut_hickory_nut_crack_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_hickory_nut_hickory_nut_crack_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_hickory_nut_hickory_nut_crack_dependencies` | Map dependency groups and show which ones are missing. |
| `test_hickory_nut_hickory_nut_crack_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_hickory_nut_hickory_nut_crack_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_hickory_nut_hickory_nut_crack_fixes` | Rank fixes by impact divided by effort. |
| `validate_hickory_nut_hickory_nut_crack_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_hickory_nut_hickory_nut_crack_duplicates` | Group items with the same category and normalized name. |
| `measure_hickory_nut_hickory_nut_crack_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_hickory_nut_hickory_nut_crack_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_hickory_nut_hickory_nut_crack_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_hickory_nut_hickory_nut_crack_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_hickory_nut_hickory_nut_crack_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_hickory_nut_hickory_nut_crack_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_hickory_nut_hickory_nut_crack_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_hickory_nut_hickory_nut_crack_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_hickory_nut_hickory_nut_crack_next_steps` | Recommend the next five actions with quick wins. |
| `open_hickory_nut_hickory_nut_crack_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
