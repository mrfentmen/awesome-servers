# Executor Checklist Audit

Audit executor checklist by documents, accounts, taxes, notifications coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/estate-executor-checklist-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "estate-executor-checklist-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/estate-executor-checklist-check-mcp"]
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
      "id": "estate_executor_checklist-documents-1",
      "name": "Documents primary",
      "category": "documents",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_executor_checklist-accounts-2",
      "name": "Accounts primary",
      "category": "accounts",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
| `inventory_estate_executor_checklist` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_estate_executor_checklist_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_estate_executor_checklist_coverage` | Show category coverage ratios and unknown categories. |
| `flag_estate_executor_checklist_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_estate_executor_checklist_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_estate_executor_checklist_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_estate_executor_checklist_baseline` | Compare category counts with the configured baseline. |
| `estimate_estate_executor_checklist_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_estate_executor_checklist_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_estate_executor_checklist_dependencies` | Map dependency groups and show which ones are missing. |
| `test_estate_executor_checklist_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_estate_executor_checklist_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_estate_executor_checklist_fixes` | Rank fixes by impact divided by effort. |
| `validate_estate_executor_checklist_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_estate_executor_checklist_duplicates` | Group items with the same category and normalized name. |
| `measure_estate_executor_checklist_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_estate_executor_checklist_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_estate_executor_checklist_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_estate_executor_checklist_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_estate_executor_checklist_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_estate_executor_checklist_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_estate_executor_checklist_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_estate_executor_checklist_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_estate_executor_checklist_next_steps` | Recommend the next five actions with quick wins. |
| `open_estate_executor_checklist_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
