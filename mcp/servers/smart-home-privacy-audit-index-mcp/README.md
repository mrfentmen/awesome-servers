# Smart Home Privacy Archive

Archive smart home privacy by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/smart-home-privacy-audit-index-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "smart-home-privacy-audit-index-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/smart-home-privacy-audit-index-mcp"]
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
      "id": "privacy_audit_index-camera",
      "name": "Indoor camera",
      "category": "camera",
      "tags": [
        "cloud",
        "video"
      ],
      "cost": 60,
      "quantity": 3,
      "condition": "fair"
    },
    {
      "id": "privacy_audit_index-doorbell",
      "name": "Video doorbell",
      "category": "camera",
      "tags": [
        "cloud",
        "motion"
      ],
      "cost": 120,
      "quantity": 2,
      "condition": "fair"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_privacy_audit_index` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_privacy_audit_index_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_privacy_audit_index_coverage` | Show category coverage ratios and unknown categories. |
| `flag_privacy_audit_index_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_privacy_audit_index_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_privacy_audit_index_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_privacy_audit_index_baseline` | Compare category counts with the configured baseline. |
| `estimate_privacy_audit_index_data_shared_services` | Calculate the primary metric for every item with mean and pass count. |
| `find_privacy_audit_index_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_privacy_audit_index_dependencies` | Map dependency groups and show which ones are missing. |
| `test_privacy_audit_index_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_privacy_audit_index_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_privacy_audit_index_fixes` | Rank fixes by impact divided by effort. |
| `validate_privacy_audit_index_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_privacy_audit_index_duplicates` | Group items with the same category and normalized name. |
| `measure_privacy_audit_index_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_privacy_audit_index_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_privacy_audit_index_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_privacy_audit_index_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_privacy_audit_index_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_privacy_audit_index_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_privacy_audit_index_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_privacy_audit_index_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_privacy_audit_index_next_steps` | Recommend the next five actions with quick wins. |
| `open_privacy_audit_index_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
