# Riding Mower Belt Simulator

Real local JSON analysis of riding mower belt in the Riding Mower lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/riding-mower-belt-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "riding-mower-belt-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/riding-mower-belt-mcp"]
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
      "id": "riding_mower_riding_mower_belt-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "riding-mower",
        "riding",
        "mower"
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
      "id": "riding_mower_riding_mower_belt-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "riding-mower",
        "riding",
        "mower"
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
| `inventory_riding_mower_riding_mower_belt` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_riding_mower_riding_mower_belt_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_riding_mower_riding_mower_belt_coverage` | Show category coverage ratios and unknown categories. |
| `flag_riding_mower_riding_mower_belt_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_riding_mower_riding_mower_belt_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_riding_mower_riding_mower_belt_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_riding_mower_riding_mower_belt_baseline` | Compare category counts with the configured baseline. |
| `estimate_riding_mower_riding_mower_belt_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_riding_mower_riding_mower_belt_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_riding_mower_riding_mower_belt_dependencies` | Map dependency groups and show which ones are missing. |
| `test_riding_mower_riding_mower_belt_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_riding_mower_riding_mower_belt_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_riding_mower_riding_mower_belt_fixes` | Rank fixes by impact divided by effort. |
| `validate_riding_mower_riding_mower_belt_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_riding_mower_riding_mower_belt_duplicates` | Group items with the same category and normalized name. |
| `measure_riding_mower_riding_mower_belt_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_riding_mower_riding_mower_belt_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_riding_mower_riding_mower_belt_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_riding_mower_riding_mower_belt_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_riding_mower_riding_mower_belt_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_riding_mower_riding_mower_belt_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_riding_mower_riding_mower_belt_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_riding_mower_riding_mower_belt_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_riding_mower_riding_mower_belt_next_steps` | Recommend the next five actions with quick wins. |
| `open_riding_mower_riding_mower_belt_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
