# Runbook Gap Audit

Audit detection, diagnosis, remediation, rollback and verification steps for operational gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/technology-runbook-gap-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "technology-runbook-gap-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/technology-runbook-gap-check-mcp"]
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
      "id": "runbook_gap-high-error-rate-alert",
      "name": "High error rate alert",
      "category": "detection",
      "tags": [
        "alert",
        "errors"
      ],
      "cost": 1,
      "quantity": 0,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "new"
    },
    {
      "id": "runbook_gap-queue-backlog-alert",
      "name": "Queue backlog alert",
      "category": "detection",
      "tags": [
        "alert",
        "queue"
      ],
      "cost": 1,
      "quantity": 1,
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
| `inventory_runbook_gap` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_runbook_gap_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_runbook_gap_coverage` | Show category coverage ratios and unknown categories. |
| `flag_runbook_gap_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_runbook_gap_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_runbook_gap_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_runbook_gap_baseline` | Compare category counts with the configured baseline. |
| `estimate_runbook_gap_gap_count` | Calculate the primary metric for every item with mean and pass count. |
| `find_runbook_gap_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_runbook_gap_dependencies` | Map dependency groups and show which ones are missing. |
| `test_runbook_gap_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_runbook_gap_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_runbook_gap_fixes` | Rank fixes by impact divided by effort. |
| `validate_runbook_gap_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_runbook_gap_duplicates` | Group items with the same category and normalized name. |
| `measure_runbook_gap_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_runbook_gap_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_runbook_gap_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_runbook_gap_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_runbook_gap_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_runbook_gap_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_runbook_gap_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_runbook_gap_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_runbook_gap_next_steps` | Recommend the next five actions with quick wins. |
| `open_runbook_gap_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
