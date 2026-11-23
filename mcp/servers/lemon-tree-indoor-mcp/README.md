# Lemon Tree Indoor Compare

Real local JSON analysis of lemon tree indoor in the Lemon Tree lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/lemon-tree-indoor-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "lemon-tree-indoor-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/lemon-tree-indoor-mcp"]
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
      "id": "lemon_tree_lemon_tree_indoor-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "lemon-tree",
        "lemon",
        "tree"
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
      "id": "lemon_tree_lemon_tree_indoor-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "lemon-tree",
        "lemon",
        "tree"
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
| `inventory_lemon_tree_lemon_tree_indoor` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_lemon_tree_lemon_tree_indoor_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_lemon_tree_lemon_tree_indoor_coverage` | Show category coverage ratios and unknown categories. |
| `flag_lemon_tree_lemon_tree_indoor_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_lemon_tree_lemon_tree_indoor_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_lemon_tree_lemon_tree_indoor_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_lemon_tree_lemon_tree_indoor_baseline` | Compare category counts with the configured baseline. |
| `estimate_lemon_tree_lemon_tree_indoor_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_lemon_tree_lemon_tree_indoor_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_lemon_tree_lemon_tree_indoor_dependencies` | Map dependency groups and show which ones are missing. |
| `test_lemon_tree_lemon_tree_indoor_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_lemon_tree_lemon_tree_indoor_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_lemon_tree_lemon_tree_indoor_fixes` | Rank fixes by impact divided by effort. |
| `validate_lemon_tree_lemon_tree_indoor_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_lemon_tree_lemon_tree_indoor_duplicates` | Group items with the same category and normalized name. |
| `measure_lemon_tree_lemon_tree_indoor_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_lemon_tree_lemon_tree_indoor_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_lemon_tree_lemon_tree_indoor_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_lemon_tree_lemon_tree_indoor_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_lemon_tree_lemon_tree_indoor_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_lemon_tree_lemon_tree_indoor_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_lemon_tree_lemon_tree_indoor_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_lemon_tree_lemon_tree_indoor_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_lemon_tree_lemon_tree_indoor_next_steps` | Recommend the next five actions with quick wins. |
| `open_lemon_tree_lemon_tree_indoor_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
