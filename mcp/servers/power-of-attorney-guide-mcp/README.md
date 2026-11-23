# Power Of Attorney Compare

Real local JSON analysis of power of attorney in the Power Of lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/power-of-attorney-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "power-of-attorney-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/power-of-attorney-guide-mcp"]
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
      "id": "power_of_power_of_attorney_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "power-of",
        "power",
        "of"
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
      "id": "power_of_power_of_attorney_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "power-of",
        "power",
        "of"
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
| `inventory_power_of_power_of_attorney_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_power_of_power_of_attorney_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_power_of_power_of_attorney_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_power_of_power_of_attorney_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_power_of_power_of_attorney_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_power_of_power_of_attorney_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_power_of_power_of_attorney_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_power_of_power_of_attorney_guide_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_power_of_power_of_attorney_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_power_of_power_of_attorney_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_power_of_power_of_attorney_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_power_of_power_of_attorney_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_power_of_power_of_attorney_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_power_of_power_of_attorney_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_power_of_power_of_attorney_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_power_of_power_of_attorney_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_power_of_power_of_attorney_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_power_of_power_of_attorney_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_power_of_power_of_attorney_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_power_of_power_of_attorney_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_power_of_power_of_attorney_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_power_of_power_of_attorney_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_power_of_power_of_attorney_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_power_of_power_of_attorney_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_power_of_power_of_attorney_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
