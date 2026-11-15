# API Spec Audit

Audit API endpoints, schemas, authentication, errors and examples before a contract ships. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/technology-api-spec-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "technology-api-spec-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/technology-api-spec-check-mcp"]
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
      "id": "api_spec-get-accounts",
      "name": "GET /accounts",
      "category": "endpoints",
      "tags": [
        "read",
        "json"
      ],
      "cost": 4,
      "quantity": 92,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "api_spec-post-transfers",
      "name": "POST /transfers",
      "category": "endpoints",
      "tags": [
        "write",
        "json"
      ],
      "cost": 6,
      "quantity": 65,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_api_spec` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_api_spec_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_api_spec_coverage` | Show category coverage ratios and unknown categories. |
| `flag_api_spec_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_api_spec_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_api_spec_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_api_spec_baseline` | Compare category counts with the configured baseline. |
| `estimate_api_spec_spec_coverage` | Calculate the primary metric for every item with mean and pass count. |
| `find_api_spec_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_api_spec_dependencies` | Map dependency groups and show which ones are missing. |
| `test_api_spec_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_api_spec_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_api_spec_fixes` | Rank fixes by impact divided by effort. |
| `validate_api_spec_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_api_spec_duplicates` | Group items with the same category and normalized name. |
| `measure_api_spec_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_api_spec_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_api_spec_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_api_spec_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_api_spec_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_api_spec_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_api_spec_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_api_spec_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_api_spec_next_steps` | Recommend the next five actions with quick wins. |
| `open_api_spec_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
