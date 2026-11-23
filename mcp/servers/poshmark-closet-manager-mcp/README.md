# Poshmark Closet Manager Tracker

Real local JSON analysis of poshmark closet manager in the Poshmark Closet lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/poshmark-closet-manager-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "poshmark-closet-manager-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/poshmark-closet-manager-mcp"]
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
      "id": "poshmark_closet_poshmark_closet_manager-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "poshmark-closet",
        "poshmark",
        "closet"
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
      "id": "poshmark_closet_poshmark_closet_manager-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "poshmark-closet",
        "poshmark",
        "closet"
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
| `inventory_poshmark_closet_poshmark_closet_manager` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_poshmark_closet_poshmark_closet_manager_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_poshmark_closet_poshmark_closet_manager_coverage` | Show category coverage ratios and unknown categories. |
| `flag_poshmark_closet_poshmark_closet_manager_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_poshmark_closet_poshmark_closet_manager_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_poshmark_closet_poshmark_closet_manager_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_poshmark_closet_poshmark_closet_manager_baseline` | Compare category counts with the configured baseline. |
| `estimate_poshmark_closet_poshmark_closet_manager_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_poshmark_closet_poshmark_closet_manager_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_poshmark_closet_poshmark_closet_manager_dependencies` | Map dependency groups and show which ones are missing. |
| `test_poshmark_closet_poshmark_closet_manager_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_poshmark_closet_poshmark_closet_manager_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_poshmark_closet_poshmark_closet_manager_fixes` | Rank fixes by impact divided by effort. |
| `validate_poshmark_closet_poshmark_closet_manager_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_poshmark_closet_poshmark_closet_manager_duplicates` | Group items with the same category and normalized name. |
| `measure_poshmark_closet_poshmark_closet_manager_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_poshmark_closet_poshmark_closet_manager_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_poshmark_closet_poshmark_closet_manager_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_poshmark_closet_poshmark_closet_manager_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_poshmark_closet_poshmark_closet_manager_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_poshmark_closet_poshmark_closet_manager_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_poshmark_closet_poshmark_closet_manager_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_poshmark_closet_poshmark_closet_manager_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_poshmark_closet_poshmark_closet_manager_next_steps` | Recommend the next five actions with quick wins. |
| `open_poshmark_closet_poshmark_closet_manager_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
