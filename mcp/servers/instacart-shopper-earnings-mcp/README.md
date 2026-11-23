# Instacart Shopper Earnings Tracker

Real local JSON analysis of instacart shopper earnings in the Instacart Shopper lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/instacart-shopper-earnings-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "instacart-shopper-earnings-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/instacart-shopper-earnings-mcp"]
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
      "id": "instacart_shopper_instacart_shopper_earnings-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "instacart-shopper",
        "instacart",
        "shopper"
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
      "id": "instacart_shopper_instacart_shopper_earnings-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "instacart-shopper",
        "instacart",
        "shopper"
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
| `inventory_instacart_shopper_instacart_shopper_earnings` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_instacart_shopper_instacart_shopper_earnings_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_instacart_shopper_instacart_shopper_earnings_coverage` | Show category coverage ratios and unknown categories. |
| `flag_instacart_shopper_instacart_shopper_earnings_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_instacart_shopper_instacart_shopper_earnings_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_instacart_shopper_instacart_shopper_earnings_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_instacart_shopper_instacart_shopper_earnings_baseline` | Compare category counts with the configured baseline. |
| `estimate_instacart_shopper_instacart_shopper_earnings_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_instacart_shopper_instacart_shopper_earnings_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_instacart_shopper_instacart_shopper_earnings_dependencies` | Map dependency groups and show which ones are missing. |
| `test_instacart_shopper_instacart_shopper_earnings_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_instacart_shopper_instacart_shopper_earnings_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_instacart_shopper_instacart_shopper_earnings_fixes` | Rank fixes by impact divided by effort. |
| `validate_instacart_shopper_instacart_shopper_earnings_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_instacart_shopper_instacart_shopper_earnings_duplicates` | Group items with the same category and normalized name. |
| `measure_instacart_shopper_instacart_shopper_earnings_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_instacart_shopper_instacart_shopper_earnings_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_instacart_shopper_instacart_shopper_earnings_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_instacart_shopper_instacart_shopper_earnings_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_instacart_shopper_instacart_shopper_earnings_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_instacart_shopper_instacart_shopper_earnings_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_instacart_shopper_instacart_shopper_earnings_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_instacart_shopper_instacart_shopper_earnings_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_instacart_shopper_instacart_shopper_earnings_next_steps` | Recommend the next five actions with quick wins. |
| `open_instacart_shopper_instacart_shopper_earnings_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
