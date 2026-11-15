# Bird Strike Audit

Audit window strike risk, decals, lighting and feeder placement for a building. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/animals-bird-strike-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "animals-bird-strike-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/animals-bird-strike-check-mcp"]
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
      "id": "bird_strike-large-window",
      "name": "Large window",
      "category": "windows",
      "tags": [
        "windows"
      ],
      "cost": 120,
      "quantity": 4,
      "condition": "worn"
    },
    {
      "id": "bird_strike-decal-coverage",
      "name": "Decal coverage",
      "category": "decals",
      "tags": [
        "decals"
      ],
      "cost": 30,
      "quantity": 60,
      "condition": "fair"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_bird_strike` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_bird_strike_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_bird_strike_coverage` | Show category coverage ratios and unknown categories. |
| `flag_bird_strike_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_bird_strike_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_bird_strike_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_bird_strike_baseline` | Compare category counts with the configured baseline. |
| `estimate_bird_strike_strike_risk` | Calculate the primary metric for every item with mean and pass count. |
| `find_bird_strike_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_bird_strike_dependencies` | Map dependency groups and show which ones are missing. |
| `test_bird_strike_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_bird_strike_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_bird_strike_fixes` | Rank fixes by impact divided by effort. |
| `validate_bird_strike_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_bird_strike_duplicates` | Group items with the same category and normalized name. |
| `measure_bird_strike_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_bird_strike_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_bird_strike_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_bird_strike_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_bird_strike_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_bird_strike_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_bird_strike_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_bird_strike_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_bird_strike_next_steps` | Recommend the next five actions with quick wins. |
| `open_bird_strike_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
