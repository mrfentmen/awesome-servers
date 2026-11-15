# Emergency Water Match Audit

Match emergency water by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/earthquake-emergency-water-match-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "earthquake-emergency-water-match-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/earthquake-emergency-water-match-mcp"]
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
      "id": "emergency_water_match-stored-water",
      "name": "Stored water",
      "category": "storage",
      "tags": [
        "storage"
      ],
      "cost": 30,
      "quantity": 14,
      "condition": "new"
    },
    {
      "id": "emergency_water_match-water-filter",
      "name": "Water filter",
      "category": "treatment",
      "tags": [
        "treatment"
      ],
      "cost": 80,
      "quantity": 1,
      "condition": "new"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_emergency_water_match` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_emergency_water_match_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_emergency_water_match_coverage` | Show category coverage ratios and unknown categories. |
| `flag_emergency_water_match_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_emergency_water_match_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_emergency_water_match_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_emergency_water_match_baseline` | Compare category counts with the configured baseline. |
| `estimate_emergency_water_match_water_gallons` | Calculate the primary metric for every item with mean and pass count. |
| `find_emergency_water_match_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_emergency_water_match_dependencies` | Map dependency groups and show which ones are missing. |
| `test_emergency_water_match_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_emergency_water_match_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_emergency_water_match_fixes` | Rank fixes by impact divided by effort. |
| `validate_emergency_water_match_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_emergency_water_match_duplicates` | Group items with the same category and normalized name. |
| `measure_emergency_water_match_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_emergency_water_match_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_emergency_water_match_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_emergency_water_match_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_emergency_water_match_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_emergency_water_match_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_emergency_water_match_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_emergency_water_match_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_emergency_water_match_next_steps` | Recommend the next five actions with quick wins. |
| `open_emergency_water_match_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
