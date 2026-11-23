# Roto Rooter Drain Tracker

Real local JSON analysis of roto rooter drain in the Roto Rooter lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/roto-rooter-drain-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "roto-rooter-drain-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/roto-rooter-drain-mcp"]
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
      "id": "roto_rooter_roto_rooter_drain-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "roto-rooter",
        "roto",
        "rooter"
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
      "id": "roto_rooter_roto_rooter_drain-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "roto-rooter",
        "roto",
        "rooter"
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
| `inventory_roto_rooter_roto_rooter_drain` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_roto_rooter_roto_rooter_drain_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_roto_rooter_roto_rooter_drain_coverage` | Show category coverage ratios and unknown categories. |
| `flag_roto_rooter_roto_rooter_drain_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_roto_rooter_roto_rooter_drain_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_roto_rooter_roto_rooter_drain_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_roto_rooter_roto_rooter_drain_baseline` | Compare category counts with the configured baseline. |
| `estimate_roto_rooter_roto_rooter_drain_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_roto_rooter_roto_rooter_drain_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_roto_rooter_roto_rooter_drain_dependencies` | Map dependency groups and show which ones are missing. |
| `test_roto_rooter_roto_rooter_drain_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_roto_rooter_roto_rooter_drain_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_roto_rooter_roto_rooter_drain_fixes` | Rank fixes by impact divided by effort. |
| `validate_roto_rooter_roto_rooter_drain_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_roto_rooter_roto_rooter_drain_duplicates` | Group items with the same category and normalized name. |
| `measure_roto_rooter_roto_rooter_drain_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_roto_rooter_roto_rooter_drain_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_roto_rooter_roto_rooter_drain_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_roto_rooter_roto_rooter_drain_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_roto_rooter_roto_rooter_drain_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_roto_rooter_roto_rooter_drain_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_roto_rooter_roto_rooter_drain_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_roto_rooter_roto_rooter_drain_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_roto_rooter_roto_rooter_drain_next_steps` | Recommend the next five actions with quick wins. |
| `open_roto_rooter_roto_rooter_drain_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
