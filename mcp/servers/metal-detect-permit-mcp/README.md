# Metal Detect Permit Budget

Real local JSON analysis of metal detect permit in the Metal Detect lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/metal-detect-permit-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "metal-detect-permit-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/metal-detect-permit-mcp"]
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
      "id": "metal_detect_metal_detect_permit-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "metal-detect",
        "metal",
        "detect"
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
      "id": "metal_detect_metal_detect_permit-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "metal-detect",
        "metal",
        "detect"
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
| `inventory_metal_detect_metal_detect_permit` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_metal_detect_metal_detect_permit_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_metal_detect_metal_detect_permit_coverage` | Show category coverage ratios and unknown categories. |
| `flag_metal_detect_metal_detect_permit_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_metal_detect_metal_detect_permit_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_metal_detect_metal_detect_permit_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_metal_detect_metal_detect_permit_baseline` | Compare category counts with the configured baseline. |
| `estimate_metal_detect_metal_detect_permit_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_metal_detect_metal_detect_permit_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_metal_detect_metal_detect_permit_dependencies` | Map dependency groups and show which ones are missing. |
| `test_metal_detect_metal_detect_permit_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_metal_detect_metal_detect_permit_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_metal_detect_metal_detect_permit_fixes` | Rank fixes by impact divided by effort. |
| `validate_metal_detect_metal_detect_permit_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_metal_detect_metal_detect_permit_duplicates` | Group items with the same category and normalized name. |
| `measure_metal_detect_metal_detect_permit_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_metal_detect_metal_detect_permit_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_metal_detect_metal_detect_permit_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_metal_detect_metal_detect_permit_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_metal_detect_metal_detect_permit_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_metal_detect_metal_detect_permit_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_metal_detect_metal_detect_permit_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_metal_detect_metal_detect_permit_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_metal_detect_metal_detect_permit_next_steps` | Recommend the next five actions with quick wins. |
| `open_metal_detect_metal_detect_permit_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
