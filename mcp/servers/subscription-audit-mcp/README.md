# Subscription Audit Guide

Real local JSON analysis of subscription audit in the Money Moves lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/subscription-audit-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "subscription-audit-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/subscription-audit-mcp"]
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
      "id": "money_moves_subscription_audit-models-1",
      "name": "Models primary",
      "category": "models",
      "tags": [
        "money-moves",
        "subscription",
        "audit"
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
      "id": "money_moves_subscription_audit-prices-2",
      "name": "Prices primary",
      "category": "prices",
      "tags": [
        "money-moves",
        "subscription",
        "audit"
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
| `inventory_money_moves_subscription_audit` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_money_moves_subscription_audit_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_money_moves_subscription_audit_coverage` | Show category coverage ratios and unknown categories. |
| `flag_money_moves_subscription_audit_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_money_moves_subscription_audit_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_money_moves_subscription_audit_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_money_moves_subscription_audit_baseline` | Compare category counts with the configured baseline. |
| `estimate_money_moves_subscription_audit_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_money_moves_subscription_audit_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_money_moves_subscription_audit_dependencies` | Map dependency groups and show which ones are missing. |
| `test_money_moves_subscription_audit_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_money_moves_subscription_audit_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_money_moves_subscription_audit_fixes` | Rank fixes by impact divided by effort. |
| `validate_money_moves_subscription_audit_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_money_moves_subscription_audit_duplicates` | Group items with the same category and normalized name. |
| `measure_money_moves_subscription_audit_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_money_moves_subscription_audit_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_money_moves_subscription_audit_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_money_moves_subscription_audit_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_money_moves_subscription_audit_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_money_moves_subscription_audit_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_money_moves_subscription_audit_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_money_moves_subscription_audit_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_money_moves_subscription_audit_next_steps` | Recommend the next five actions with quick wins. |
| `open_money_moves_subscription_audit_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
