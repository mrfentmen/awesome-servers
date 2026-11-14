# Fabric Care Audit

Audit fabric types for care burden, cost per wear, condition and coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/fashion-fabric-care-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "fashion-fabric-care-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/fashion-fabric-care-check-mcp"]
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
      "id": "fabric-tee",
      "name": "Cotton tee",
      "category": "cotton",
      "tags": [
        "machine-wash"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "fabric-sweater",
      "name": "Wool sweater",
      "category": "wool",
      "tags": [
        "hand-wash"
      ],
      "cost": 90,
      "quantity": 5,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_fabric_care` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_fabric_care_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_fabric_care_coverage` | Show category coverage ratios and unknown categories. |
| `flag_fabric_care_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_fabric_care_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_fabric_care_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_fabric_care_baseline` | Compare category counts with the configured baseline. |
| `estimate_fabric_care_cost_per_use` | Calculate the primary metric for every item with mean and pass count. |
| `find_fabric_care_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_fabric_care_dependencies` | Map dependency groups and show which ones are missing. |
| `test_fabric_care_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_fabric_care_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_fabric_care_fixes` | Rank fixes by impact divided by effort. |
| `validate_fabric_care_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_fabric_care_duplicates` | Group items with the same category and normalized name. |
| `measure_fabric_care_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_fabric_care_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_fabric_care_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_fabric_care_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_fabric_care_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_fabric_care_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_fabric_care_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_fabric_care_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_fabric_care_next_steps` | Recommend the next five actions with quick wins. |
| `open_fabric_care_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
