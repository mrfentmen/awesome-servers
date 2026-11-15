# Log Anomaly Planning Audit

Plan log anomaly by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/technology-log-anomaly-plan-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "technology-log-anomaly-plan-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/technology-log-anomaly-plan-mcp"]
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
      "id": "log_anomaly_plan-checkout-timeout",
      "name": "checkout timeout",
      "category": "errors",
      "tags": [
        "error",
        "checkout"
      ],
      "cost": 4,
      "quantity": 12,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "log_anomaly_plan-payment-gateway-502",
      "name": "payment gateway 502",
      "category": "errors",
      "tags": [
        "error",
        "payments"
      ],
      "cost": 6,
      "quantity": 8,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "worn"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_log_anomaly_plan` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_log_anomaly_plan_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_log_anomaly_plan_coverage` | Show category coverage ratios and unknown categories. |
| `flag_log_anomaly_plan_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_log_anomaly_plan_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_log_anomaly_plan_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_log_anomaly_plan_baseline` | Compare category counts with the configured baseline. |
| `estimate_log_anomaly_plan_occurrences` | Calculate the primary metric for every item with mean and pass count. |
| `find_log_anomaly_plan_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_log_anomaly_plan_dependencies` | Map dependency groups and show which ones are missing. |
| `test_log_anomaly_plan_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_log_anomaly_plan_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_log_anomaly_plan_fixes` | Rank fixes by impact divided by effort. |
| `validate_log_anomaly_plan_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_log_anomaly_plan_duplicates` | Group items with the same category and normalized name. |
| `measure_log_anomaly_plan_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_log_anomaly_plan_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_log_anomaly_plan_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_log_anomaly_plan_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_log_anomaly_plan_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_log_anomaly_plan_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_log_anomaly_plan_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_log_anomaly_plan_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_log_anomaly_plan_next_steps` | Recommend the next five actions with quick wins. |
| `open_log_anomaly_plan_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
