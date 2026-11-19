# Cafe Crawl Simulator

Real local JSON analysis of cafe crawl in the Coffee lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/coffee-cafe-crawl-sim-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "coffee-cafe-crawl-sim-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/coffee-cafe-crawl-sim-mcp"]
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
      "id": "coffee_coffee_cafe_crawl_sim-inputs-1",
      "name": "Inputs primary",
      "category": "inputs",
      "tags": [
        "coffee",
        "coffee",
        "cafe"
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
      "id": "coffee_coffee_cafe_crawl_sim-scenarios-2",
      "name": "Scenarios primary",
      "category": "scenarios",
      "tags": [
        "coffee",
        "coffee",
        "cafe"
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
| `inventory_coffee_coffee_cafe_crawl_sim` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_coffee_coffee_cafe_crawl_sim_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_coffee_coffee_cafe_crawl_sim_coverage` | Show category coverage ratios and unknown categories. |
| `flag_coffee_coffee_cafe_crawl_sim_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_coffee_coffee_cafe_crawl_sim_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_coffee_coffee_cafe_crawl_sim_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_coffee_coffee_cafe_crawl_sim_baseline` | Compare category counts with the configured baseline. |
| `estimate_coffee_coffee_cafe_crawl_sim_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_coffee_coffee_cafe_crawl_sim_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_coffee_coffee_cafe_crawl_sim_dependencies` | Map dependency groups and show which ones are missing. |
| `test_coffee_coffee_cafe_crawl_sim_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_coffee_coffee_cafe_crawl_sim_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_coffee_coffee_cafe_crawl_sim_fixes` | Rank fixes by impact divided by effort. |
| `validate_coffee_coffee_cafe_crawl_sim_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_coffee_coffee_cafe_crawl_sim_duplicates` | Group items with the same category and normalized name. |
| `measure_coffee_coffee_cafe_crawl_sim_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_coffee_coffee_cafe_crawl_sim_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_coffee_coffee_cafe_crawl_sim_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_coffee_coffee_cafe_crawl_sim_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_coffee_coffee_cafe_crawl_sim_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_coffee_coffee_cafe_crawl_sim_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_coffee_coffee_cafe_crawl_sim_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_coffee_coffee_cafe_crawl_sim_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_coffee_coffee_cafe_crawl_sim_next_steps` | Recommend the next five actions with quick wins. |
| `open_coffee_coffee_cafe_crawl_sim_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
