# Bathroom Fan Size Tracker

Real local JSON analysis of bathroom fan size in the Bathroom Fan lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/bathroom-fan-size-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "bathroom-fan-size-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/bathroom-fan-size-mcp"]
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
      "id": "bathroom_fan_bathroom_fan_size-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "bathroom-fan",
        "bathroom",
        "fan"
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
      "id": "bathroom_fan_bathroom_fan_size-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "bathroom-fan",
        "bathroom",
        "fan"
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
| `inventory_bathroom_fan_bathroom_fan_size` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_bathroom_fan_bathroom_fan_size_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_bathroom_fan_bathroom_fan_size_coverage` | Show category coverage ratios and unknown categories. |
| `flag_bathroom_fan_bathroom_fan_size_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_bathroom_fan_bathroom_fan_size_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_bathroom_fan_bathroom_fan_size_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_bathroom_fan_bathroom_fan_size_baseline` | Compare category counts with the configured baseline. |
| `estimate_bathroom_fan_bathroom_fan_size_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_bathroom_fan_bathroom_fan_size_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_bathroom_fan_bathroom_fan_size_dependencies` | Map dependency groups and show which ones are missing. |
| `test_bathroom_fan_bathroom_fan_size_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_bathroom_fan_bathroom_fan_size_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_bathroom_fan_bathroom_fan_size_fixes` | Rank fixes by impact divided by effort. |
| `validate_bathroom_fan_bathroom_fan_size_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_bathroom_fan_bathroom_fan_size_duplicates` | Group items with the same category and normalized name. |
| `measure_bathroom_fan_bathroom_fan_size_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_bathroom_fan_bathroom_fan_size_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_bathroom_fan_bathroom_fan_size_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_bathroom_fan_bathroom_fan_size_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_bathroom_fan_bathroom_fan_size_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_bathroom_fan_bathroom_fan_size_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_bathroom_fan_bathroom_fan_size_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_bathroom_fan_bathroom_fan_size_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_bathroom_fan_bathroom_fan_size_next_steps` | Recommend the next five actions with quick wins. |
| `open_bathroom_fan_bathroom_fan_size_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
