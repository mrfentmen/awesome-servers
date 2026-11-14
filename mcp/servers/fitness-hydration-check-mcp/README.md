# Hydration Audit

Audit bottles, powders, electrolytes and mugs for hydration capacity and daily coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/fitness-hydration-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "fitness-hydration-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/fitness-hydration-check-mcp"]
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
      "id": "hydration-bottle",
      "name": "Insulated bottle",
      "category": "bottle",
      "tags": [
        "steel"
      ],
      "cost": 30,
      "quantity": 32,
      "acquired": "2026-01-01",
      "condition": "good"
    },
    {
      "id": "hydration-powder",
      "name": "Electrolyte powder",
      "category": "powder",
      "tags": [
        "citrus"
      ],
      "cost": 20,
      "quantity": 24,
      "acquired": "2026-06-01",
      "expires": "2027-06-01",
      "condition": "new"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_hydration` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_hydration_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_hydration_coverage` | Show category coverage ratios and unknown categories. |
| `flag_hydration_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_hydration_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_hydration_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_hydration_baseline` | Compare category counts with the configured baseline. |
| `estimate_hydration_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_hydration_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_hydration_dependencies` | Map dependency groups and show which ones are missing. |
| `test_hydration_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_hydration_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_hydration_fixes` | Rank fixes by impact divided by effort. |
| `validate_hydration_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_hydration_duplicates` | Group items with the same category and normalized name. |
| `measure_hydration_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_hydration_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_hydration_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_hydration_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_hydration_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_hydration_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_hydration_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_hydration_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_hydration_next_steps` | Recommend the next five actions with quick wins. |
| `open_hydration_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
