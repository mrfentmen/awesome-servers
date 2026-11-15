# COBOL Copybook Audit

Audit copybook fields, PIC clauses, redefines and record length for a COBOL program. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/ibm-cobol-copybook-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "ibm-cobol-copybook-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/ibm-cobol-copybook-check-mcp"]
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
      "id": "cobol_copybook-customer-record",
      "name": "Customer record",
      "category": "fields",
      "tags": [
        "fields"
      ],
      "cost": 0,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "cobol_copybook-pic-clause",
      "name": "PIC clause",
      "category": "pic",
      "tags": [
        "pic"
      ],
      "cost": 0,
      "quantity": 8,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_cobol_copybook` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_cobol_copybook_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_cobol_copybook_coverage` | Show category coverage ratios and unknown categories. |
| `flag_cobol_copybook_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_cobol_copybook_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_cobol_copybook_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_cobol_copybook_baseline` | Compare category counts with the configured baseline. |
| `estimate_cobol_copybook_field_count` | Calculate the primary metric for every item with mean and pass count. |
| `find_cobol_copybook_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_cobol_copybook_dependencies` | Map dependency groups and show which ones are missing. |
| `test_cobol_copybook_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_cobol_copybook_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_cobol_copybook_fixes` | Rank fixes by impact divided by effort. |
| `validate_cobol_copybook_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_cobol_copybook_duplicates` | Group items with the same category and normalized name. |
| `measure_cobol_copybook_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_cobol_copybook_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_cobol_copybook_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_cobol_copybook_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_cobol_copybook_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_cobol_copybook_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_cobol_copybook_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_cobol_copybook_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_cobol_copybook_next_steps` | Recommend the next five actions with quick wins. |
| `open_cobol_copybook_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
