# Emergency Kit Expiry Audit

Emergency Kit Expiry Audit: audit kit food water battery and med expiry. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/emergency-kit-expiry-audit-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "emergency-kit-expiry-audit-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/emergency-kit-expiry-audit-mcp"]
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
      "id": "emergency_kit-sample-1",
      "name": "Sample food entry",
      "category": "food",
      "tags": [
        "emergency"
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
      "id": "emergency_kit-sample-2",
      "name": "Sample water entry",
      "category": "water",
      "tags": [
        "emergency"
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
| `inventory_emergency_kit` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_emergency_kit_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_emergency_kit_coverage` | Show category coverage ratios and unknown categories. |
| `flag_emergency_kit_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_emergency_kit_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_emergency_kit_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_emergency_kit_baseline` | Compare category counts with the configured baseline. |
| `estimate_emergency_kit_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_emergency_kit_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_emergency_kit_dependencies` | Map dependency groups and show which ones are missing. |
| `test_emergency_kit_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_emergency_kit_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_emergency_kit_fixes` | Rank fixes by impact divided by effort. |
| `validate_emergency_kit_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_emergency_kit_duplicates` | Group items with the same category and normalized name. |
| `measure_emergency_kit_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_emergency_kit_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_emergency_kit_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_emergency_kit_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_emergency_kit_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_emergency_kit_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_emergency_kit_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_emergency_kit_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_emergency_kit_next_steps` | Recommend the next five actions with quick wins. |
| `open_emergency_kit_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
