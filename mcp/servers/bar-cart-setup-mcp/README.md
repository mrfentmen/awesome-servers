# Bar Cart Setup Matcher

Real local JSON analysis of bar cart setup in the Bar Cart lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/bar-cart-setup-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "bar-cart-setup-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/bar-cart-setup-mcp"]
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
      "id": "bar_cart_bar_cart_setup-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "bar-cart",
        "bar",
        "cart"
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
      "id": "bar_cart_bar_cart_setup-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "bar-cart",
        "bar",
        "cart"
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
| `inventory_bar_cart_bar_cart_setup` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_bar_cart_bar_cart_setup_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_bar_cart_bar_cart_setup_coverage` | Show category coverage ratios and unknown categories. |
| `flag_bar_cart_bar_cart_setup_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_bar_cart_bar_cart_setup_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_bar_cart_bar_cart_setup_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_bar_cart_bar_cart_setup_baseline` | Compare category counts with the configured baseline. |
| `estimate_bar_cart_bar_cart_setup_clearance_risk` | Calculate the primary metric for every item with mean and pass count. |
| `find_bar_cart_bar_cart_setup_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_bar_cart_bar_cart_setup_dependencies` | Map dependency groups and show which ones are missing. |
| `test_bar_cart_bar_cart_setup_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_bar_cart_bar_cart_setup_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_bar_cart_bar_cart_setup_fixes` | Rank fixes by impact divided by effort. |
| `validate_bar_cart_bar_cart_setup_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_bar_cart_bar_cart_setup_duplicates` | Group items with the same category and normalized name. |
| `measure_bar_cart_bar_cart_setup_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_bar_cart_bar_cart_setup_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_bar_cart_bar_cart_setup_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_bar_cart_bar_cart_setup_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_bar_cart_bar_cart_setup_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_bar_cart_bar_cart_setup_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_bar_cart_bar_cart_setup_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_bar_cart_bar_cart_setup_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_bar_cart_bar_cart_setup_next_steps` | Recommend the next five actions with quick wins. |
| `open_bar_cart_bar_cart_setup_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
