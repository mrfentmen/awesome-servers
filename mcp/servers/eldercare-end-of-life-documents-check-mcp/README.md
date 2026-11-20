# End-of-Life Documents Audit

Audit end-of-life documents by will, directives, beneficiaries, contacts coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/eldercare-end-of-life-documents-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "eldercare-end-of-life-documents-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/eldercare-end-of-life-documents-check-mcp"]
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
      "id": "eldercare_end_of_life_documents-will-1",
      "name": "Will primary",
      "category": "will",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 20,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_end_of_life_documents-directives-2",
      "name": "Directives primary",
      "category": "directives",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 35,
      "quantity": 7,
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
| `inventory_eldercare_end_of_life_documents` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_eldercare_end_of_life_documents_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_eldercare_end_of_life_documents_coverage` | Show category coverage ratios and unknown categories. |
| `flag_eldercare_end_of_life_documents_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_eldercare_end_of_life_documents_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_eldercare_end_of_life_documents_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_eldercare_end_of_life_documents_baseline` | Compare category counts with the configured baseline. |
| `estimate_eldercare_end_of_life_documents_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_eldercare_end_of_life_documents_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_eldercare_end_of_life_documents_dependencies` | Map dependency groups and show which ones are missing. |
| `test_eldercare_end_of_life_documents_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_eldercare_end_of_life_documents_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_eldercare_end_of_life_documents_fixes` | Rank fixes by impact divided by effort. |
| `validate_eldercare_end_of_life_documents_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_eldercare_end_of_life_documents_duplicates` | Group items with the same category and normalized name. |
| `measure_eldercare_end_of_life_documents_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_eldercare_end_of_life_documents_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_eldercare_end_of_life_documents_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_eldercare_end_of_life_documents_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_eldercare_end_of_life_documents_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_eldercare_end_of_life_documents_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_eldercare_end_of_life_documents_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_eldercare_end_of_life_documents_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_eldercare_end_of_life_documents_next_steps` | Recommend the next five actions with quick wins. |
| `open_eldercare_end_of_life_documents_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
