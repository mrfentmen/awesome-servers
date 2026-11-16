# Grooming Slot Audit

Audit grooming slot by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/petco-grooming-slot-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "petco-grooming-slot-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/petco-grooming-slot-check-mcp"]
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
      "id": "grooming_slot-bath",
      "name": "Bath appointment",
      "category": "bath",
      "tags": [
        "medium-dog",
        "weekend"
      ],
      "cost": 55,
      "quantity": 9,
      "condition": "fair"
    },
    {
      "id": "grooming_slot-haircut",
      "name": "Full haircut",
      "category": "haircut",
      "tags": [
        "poodle",
        "standing"
      ],
      "cost": 90,
      "quantity": 14,
      "condition": "worn"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_grooming_slot` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_grooming_slot_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_grooming_slot_coverage` | Show category coverage ratios and unknown categories. |
| `flag_grooming_slot_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_grooming_slot_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_grooming_slot_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_grooming_slot_baseline` | Compare category counts with the configured baseline. |
| `estimate_grooming_slot_wait_days` | Calculate the primary metric for every item with mean and pass count. |
| `find_grooming_slot_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_grooming_slot_dependencies` | Map dependency groups and show which ones are missing. |
| `test_grooming_slot_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_grooming_slot_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_grooming_slot_fixes` | Rank fixes by impact divided by effort. |
| `validate_grooming_slot_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_grooming_slot_duplicates` | Group items with the same category and normalized name. |
| `measure_grooming_slot_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_grooming_slot_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_grooming_slot_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_grooming_slot_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_grooming_slot_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_grooming_slot_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_grooming_slot_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_grooming_slot_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_grooming_slot_next_steps` | Recommend the next five actions with quick wins. |
| `open_grooming_slot_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
