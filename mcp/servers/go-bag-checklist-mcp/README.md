# Go Bag Checklist Matcher

Real local JSON analysis of go bag checklist in the Go Bag lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/go-bag-checklist-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "go-bag-checklist-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/go-bag-checklist-mcp"]
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
      "id": "go_bag_go_bag_checklist-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "go-bag",
        "go",
        "bag"
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
      "id": "go_bag_go_bag_checklist-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "go-bag",
        "go",
        "bag"
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
| `inventory_go_bag_go_bag_checklist` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_go_bag_go_bag_checklist_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_go_bag_go_bag_checklist_coverage` | Show category coverage ratios and unknown categories. |
| `flag_go_bag_go_bag_checklist_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_go_bag_go_bag_checklist_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_go_bag_go_bag_checklist_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_go_bag_go_bag_checklist_baseline` | Compare category counts with the configured baseline. |
| `estimate_go_bag_go_bag_checklist_clearance_risk` | Calculate the primary metric for every item with mean and pass count. |
| `find_go_bag_go_bag_checklist_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_go_bag_go_bag_checklist_dependencies` | Map dependency groups and show which ones are missing. |
| `test_go_bag_go_bag_checklist_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_go_bag_go_bag_checklist_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_go_bag_go_bag_checklist_fixes` | Rank fixes by impact divided by effort. |
| `validate_go_bag_go_bag_checklist_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_go_bag_go_bag_checklist_duplicates` | Group items with the same category and normalized name. |
| `measure_go_bag_go_bag_checklist_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_go_bag_go_bag_checklist_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_go_bag_go_bag_checklist_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_go_bag_go_bag_checklist_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_go_bag_go_bag_checklist_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_go_bag_go_bag_checklist_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_go_bag_go_bag_checklist_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_go_bag_go_bag_checklist_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_go_bag_go_bag_checklist_next_steps` | Recommend the next five actions with quick wins. |
| `open_go_bag_go_bag_checklist_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
