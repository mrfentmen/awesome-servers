# retro-gaming compare Compare

Real local JSON analysis of retro-gaming compare in the Entertainment & Gaming lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/retro-gaming-compare-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "retro-gaming-compare-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/retro-gaming-compare-mcp"]
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
      "id": "entertainment_retro_gaming_compare-entertainment-1",
      "name": "entertainment primary",
      "category": "entertainment",
      "tags": [
        "entertainment-gaming",
        "retro",
        "gaming"
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
      "id": "entertainment_retro_gaming_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "entertainment-gaming",
        "retro",
        "gaming"
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
| `inventory_entertainment_retro_gaming_compare` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_entertainment_retro_gaming_compare_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_entertainment_retro_gaming_compare_coverage` | Show category coverage ratios and unknown categories. |
| `flag_entertainment_retro_gaming_compare_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_entertainment_retro_gaming_compare_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_entertainment_retro_gaming_compare_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_entertainment_retro_gaming_compare_baseline` | Compare category counts with the configured baseline. |
| `estimate_entertainment_retro_gaming_compare_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_entertainment_retro_gaming_compare_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_entertainment_retro_gaming_compare_dependencies` | Map dependency groups and show which ones are missing. |
| `test_entertainment_retro_gaming_compare_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_entertainment_retro_gaming_compare_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_entertainment_retro_gaming_compare_fixes` | Rank fixes by impact divided by effort. |
| `validate_entertainment_retro_gaming_compare_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_entertainment_retro_gaming_compare_duplicates` | Group items with the same category and normalized name. |
| `measure_entertainment_retro_gaming_compare_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_entertainment_retro_gaming_compare_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_entertainment_retro_gaming_compare_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_entertainment_retro_gaming_compare_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_entertainment_retro_gaming_compare_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_entertainment_retro_gaming_compare_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_entertainment_retro_gaming_compare_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_entertainment_retro_gaming_compare_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_entertainment_retro_gaming_compare_next_steps` | Recommend the next five actions with quick wins. |
| `open_entertainment_retro_gaming_compare_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
