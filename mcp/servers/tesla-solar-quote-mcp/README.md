# Tesla Solar Quote Tracker

Real local JSON analysis of tesla solar quote in the Tesla Solar lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/tesla-solar-quote-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "tesla-solar-quote-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/tesla-solar-quote-mcp"]
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
      "id": "tesla_solar_tesla_solar_quote-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "tesla-solar",
        "tesla",
        "solar"
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
      "id": "tesla_solar_tesla_solar_quote-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "tesla-solar",
        "tesla",
        "solar"
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
| `inventory_tesla_solar_tesla_solar_quote` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_tesla_solar_tesla_solar_quote_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_tesla_solar_tesla_solar_quote_coverage` | Show category coverage ratios and unknown categories. |
| `flag_tesla_solar_tesla_solar_quote_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_tesla_solar_tesla_solar_quote_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_tesla_solar_tesla_solar_quote_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_tesla_solar_tesla_solar_quote_baseline` | Compare category counts with the configured baseline. |
| `estimate_tesla_solar_tesla_solar_quote_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_tesla_solar_tesla_solar_quote_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_tesla_solar_tesla_solar_quote_dependencies` | Map dependency groups and show which ones are missing. |
| `test_tesla_solar_tesla_solar_quote_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_tesla_solar_tesla_solar_quote_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_tesla_solar_tesla_solar_quote_fixes` | Rank fixes by impact divided by effort. |
| `validate_tesla_solar_tesla_solar_quote_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_tesla_solar_tesla_solar_quote_duplicates` | Group items with the same category and normalized name. |
| `measure_tesla_solar_tesla_solar_quote_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_tesla_solar_tesla_solar_quote_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_tesla_solar_tesla_solar_quote_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_tesla_solar_tesla_solar_quote_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_tesla_solar_tesla_solar_quote_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_tesla_solar_tesla_solar_quote_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_tesla_solar_tesla_solar_quote_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_tesla_solar_tesla_solar_quote_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_tesla_solar_tesla_solar_quote_next_steps` | Recommend the next five actions with quick wins. |
| `open_tesla_solar_tesla_solar_quote_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
