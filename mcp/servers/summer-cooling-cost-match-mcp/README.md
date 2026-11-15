# Cooling Cost Match Audit

Match cooling cost by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/summer-cooling-cost-match-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "summer-cooling-cost-match-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/summer-cooling-cost-match-mcp"]
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
      "id": "cooling_cost_match-ac-unit",
      "name": "AC unit",
      "category": "ac",
      "tags": [
        "ac"
      ],
      "cost": 300,
      "quantity": 120,
      "condition": "good"
    },
    {
      "id": "cooling_cost_match-ceiling-fan",
      "name": "Ceiling fan",
      "category": "fan",
      "tags": [
        "fan"
      ],
      "cost": 120,
      "quantity": 15,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_cooling_cost_match` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_cooling_cost_match_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_cooling_cost_match_coverage` | Show category coverage ratios and unknown categories. |
| `flag_cooling_cost_match_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_cooling_cost_match_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_cooling_cost_match_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_cooling_cost_match_baseline` | Compare category counts with the configured baseline. |
| `estimate_cooling_cost_match_monthly_cost` | Calculate the primary metric for every item with mean and pass count. |
| `find_cooling_cost_match_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_cooling_cost_match_dependencies` | Map dependency groups and show which ones are missing. |
| `test_cooling_cost_match_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_cooling_cost_match_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_cooling_cost_match_fixes` | Rank fixes by impact divided by effort. |
| `validate_cooling_cost_match_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_cooling_cost_match_duplicates` | Group items with the same category and normalized name. |
| `measure_cooling_cost_match_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_cooling_cost_match_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_cooling_cost_match_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_cooling_cost_match_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_cooling_cost_match_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_cooling_cost_match_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_cooling_cost_match_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_cooling_cost_match_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_cooling_cost_match_next_steps` | Recommend the next five actions with quick wins. |
| `open_cooling_cost_match_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
