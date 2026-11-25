# gap-insurance checklist Checklist

Real local JSON analysis of gap-insurance checklist in the Auto Buying & Ownership lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/gap-insurance-checklist-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "gap-insurance-checklist-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/gap-insurance-checklist-mcp"]
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
      "id": "auto_gap_insurance_checklist-auto-1",
      "name": "auto primary",
      "category": "auto",
      "tags": [
        "auto-buying-ownership",
        "gap",
        "insurance"
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
      "id": "auto_gap_insurance_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "auto-buying-ownership",
        "gap",
        "insurance"
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
| `inventory_auto_gap_insurance_checklist` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_auto_gap_insurance_checklist_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_auto_gap_insurance_checklist_coverage` | Show category coverage ratios and unknown categories. |
| `flag_auto_gap_insurance_checklist_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_auto_gap_insurance_checklist_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_auto_gap_insurance_checklist_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_auto_gap_insurance_checklist_baseline` | Compare category counts with the configured baseline. |
| `estimate_auto_gap_insurance_checklist_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_auto_gap_insurance_checklist_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_auto_gap_insurance_checklist_dependencies` | Map dependency groups and show which ones are missing. |
| `test_auto_gap_insurance_checklist_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_auto_gap_insurance_checklist_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_auto_gap_insurance_checklist_fixes` | Rank fixes by impact divided by effort. |
| `validate_auto_gap_insurance_checklist_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_auto_gap_insurance_checklist_duplicates` | Group items with the same category and normalized name. |
| `measure_auto_gap_insurance_checklist_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_auto_gap_insurance_checklist_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_auto_gap_insurance_checklist_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_auto_gap_insurance_checklist_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_auto_gap_insurance_checklist_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_auto_gap_insurance_checklist_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_auto_gap_insurance_checklist_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_auto_gap_insurance_checklist_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_auto_gap_insurance_checklist_next_steps` | Recommend the next five actions with quick wins. |
| `open_auto_gap_insurance_checklist_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
