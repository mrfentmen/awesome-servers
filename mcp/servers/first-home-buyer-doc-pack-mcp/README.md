# First Home Buyer Doc Pack Audit

First Home Buyer Doc Pack Audit: buyer document checklist, not legal advice. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/first-home-buyer-doc-pack-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "first-home-buyer-doc-pack-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/first-home-buyer-doc-pack-mcp"]
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
      "id": "buyer_docs-sample-1",
      "name": "Sample id entry",
      "category": "id",
      "tags": [
        "homebuyer"
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
      "id": "buyer_docs-sample-2",
      "name": "Sample income entry",
      "category": "income",
      "tags": [
        "homebuyer"
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
| `inventory_buyer_docs` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_buyer_docs_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_buyer_docs_coverage` | Show category coverage ratios and unknown categories. |
| `flag_buyer_docs_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_buyer_docs_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_buyer_docs_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_buyer_docs_baseline` | Compare category counts with the configured baseline. |
| `estimate_buyer_docs_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_buyer_docs_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_buyer_docs_dependencies` | Map dependency groups and show which ones are missing. |
| `test_buyer_docs_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_buyer_docs_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_buyer_docs_fixes` | Rank fixes by impact divided by effort. |
| `validate_buyer_docs_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_buyer_docs_duplicates` | Group items with the same category and normalized name. |
| `measure_buyer_docs_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_buyer_docs_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_buyer_docs_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_buyer_docs_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_buyer_docs_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_buyer_docs_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_buyer_docs_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_buyer_docs_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_buyer_docs_next_steps` | Recommend the next five actions with quick wins. |
| `open_buyer_docs_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
