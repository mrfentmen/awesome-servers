# Avocado Pit Grow Simulator

Real local JSON analysis of avocado pit grow in the Avocado Pit lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/avocado-pit-grow-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "avocado-pit-grow-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/avocado-pit-grow-mcp"]
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
      "id": "avocado_pit_avocado_pit_grow-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "avocado-pit",
        "avocado",
        "pit"
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
      "id": "avocado_pit_avocado_pit_grow-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "avocado-pit",
        "avocado",
        "pit"
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
| `inventory_avocado_pit_avocado_pit_grow` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_avocado_pit_avocado_pit_grow_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_avocado_pit_avocado_pit_grow_coverage` | Show category coverage ratios and unknown categories. |
| `flag_avocado_pit_avocado_pit_grow_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_avocado_pit_avocado_pit_grow_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_avocado_pit_avocado_pit_grow_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_avocado_pit_avocado_pit_grow_baseline` | Compare category counts with the configured baseline. |
| `estimate_avocado_pit_avocado_pit_grow_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_avocado_pit_avocado_pit_grow_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_avocado_pit_avocado_pit_grow_dependencies` | Map dependency groups and show which ones are missing. |
| `test_avocado_pit_avocado_pit_grow_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_avocado_pit_avocado_pit_grow_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_avocado_pit_avocado_pit_grow_fixes` | Rank fixes by impact divided by effort. |
| `validate_avocado_pit_avocado_pit_grow_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_avocado_pit_avocado_pit_grow_duplicates` | Group items with the same category and normalized name. |
| `measure_avocado_pit_avocado_pit_grow_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_avocado_pit_avocado_pit_grow_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_avocado_pit_avocado_pit_grow_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_avocado_pit_avocado_pit_grow_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_avocado_pit_avocado_pit_grow_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_avocado_pit_avocado_pit_grow_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_avocado_pit_avocado_pit_grow_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_avocado_pit_avocado_pit_grow_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_avocado_pit_avocado_pit_grow_next_steps` | Recommend the next five actions with quick wins. |
| `open_avocado_pit_avocado_pit_grow_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
