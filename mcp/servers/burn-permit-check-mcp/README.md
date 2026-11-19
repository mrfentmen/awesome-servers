# Burn Permit Check Audit

Burn Permit Check Audit: multi-area burn permit checklist. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/burn-permit-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "burn-permit-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/burn-permit-check-mcp"]
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
      "id": "burn_permit-sample-1",
      "name": "Sample yard waste entry",
      "category": "yard",
      "tags": [
        "burn"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "burn_permit-sample-2",
      "name": "Sample bonfires entry",
      "category": "bonfire",
      "tags": [
        "burn"
      ],
      "cost": 30,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_burn_permit` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_burn_permit_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_burn_permit_coverage` | Show category coverage ratios and unknown categories. |
| `flag_burn_permit_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_burn_permit_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_burn_permit_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_burn_permit_baseline` | Compare category counts with the configured baseline. |
| `estimate_burn_permit_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_burn_permit_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_burn_permit_dependencies` | Map dependency groups and show which ones are missing. |
| `test_burn_permit_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_burn_permit_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_burn_permit_fixes` | Rank fixes by impact divided by effort. |
| `validate_burn_permit_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_burn_permit_duplicates` | Group items with the same category and normalized name. |
| `measure_burn_permit_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_burn_permit_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_burn_permit_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_burn_permit_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_burn_permit_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_burn_permit_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_burn_permit_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_burn_permit_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_burn_permit_next_steps` | Recommend the next five actions with quick wins. |
| `open_burn_permit_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
