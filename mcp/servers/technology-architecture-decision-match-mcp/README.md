# Architecture Decision Match Audit

Match architecture decision by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/technology-architecture-decision-match-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "technology-architecture-decision-match-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/technology-architecture-decision-match-mcp"]
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
      "id": "architecture_decision_match-payments-service-boundary",
      "name": "Payments service boundary",
      "category": "context",
      "tags": [
        "context",
        "payments"
      ],
      "cost": 4,
      "quantity": 0,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "architecture_decision_match-event-bus-ownership",
      "name": "Event bus ownership",
      "category": "context",
      "tags": [
        "context",
        "events"
      ],
      "cost": 3,
      "quantity": 2,
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
| `inventory_architecture_decision_match` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_architecture_decision_match_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_architecture_decision_match_coverage` | Show category coverage ratios and unknown categories. |
| `flag_architecture_decision_match_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_architecture_decision_match_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_architecture_decision_match_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_architecture_decision_match_baseline` | Compare category counts with the configured baseline. |
| `estimate_architecture_decision_match_open_questions` | Calculate the primary metric for every item with mean and pass count. |
| `find_architecture_decision_match_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_architecture_decision_match_dependencies` | Map dependency groups and show which ones are missing. |
| `test_architecture_decision_match_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_architecture_decision_match_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_architecture_decision_match_fixes` | Rank fixes by impact divided by effort. |
| `validate_architecture_decision_match_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_architecture_decision_match_duplicates` | Group items with the same category and normalized name. |
| `measure_architecture_decision_match_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_architecture_decision_match_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_architecture_decision_match_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_architecture_decision_match_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_architecture_decision_match_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_architecture_decision_match_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_architecture_decision_match_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_architecture_decision_match_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_architecture_decision_match_next_steps` | Recommend the next five actions with quick wins. |
| `open_architecture_decision_match_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
