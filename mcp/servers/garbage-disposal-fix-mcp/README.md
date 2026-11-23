# Garbage Disposal Fix Audit

Real local JSON analysis of garbage disposal fix in the Garbage Disposal lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/garbage-disposal-fix-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "garbage-disposal-fix-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/garbage-disposal-fix-mcp"]
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
      "id": "garbage_disposal_garbage_disposal_fix-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "garbage-disposal",
        "garbage",
        "disposal"
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
      "id": "garbage_disposal_garbage_disposal_fix-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "garbage-disposal",
        "garbage",
        "disposal"
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
| `inventory_garbage_disposal_garbage_disposal_fix` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_garbage_disposal_garbage_disposal_fix_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_garbage_disposal_garbage_disposal_fix_coverage` | Show category coverage ratios and unknown categories. |
| `flag_garbage_disposal_garbage_disposal_fix_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_garbage_disposal_garbage_disposal_fix_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_garbage_disposal_garbage_disposal_fix_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_garbage_disposal_garbage_disposal_fix_baseline` | Compare category counts with the configured baseline. |
| `estimate_garbage_disposal_garbage_disposal_fix_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_garbage_disposal_garbage_disposal_fix_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_garbage_disposal_garbage_disposal_fix_dependencies` | Map dependency groups and show which ones are missing. |
| `test_garbage_disposal_garbage_disposal_fix_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_garbage_disposal_garbage_disposal_fix_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_garbage_disposal_garbage_disposal_fix_fixes` | Rank fixes by impact divided by effort. |
| `validate_garbage_disposal_garbage_disposal_fix_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_garbage_disposal_garbage_disposal_fix_duplicates` | Group items with the same category and normalized name. |
| `measure_garbage_disposal_garbage_disposal_fix_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_garbage_disposal_garbage_disposal_fix_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_garbage_disposal_garbage_disposal_fix_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_garbage_disposal_garbage_disposal_fix_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_garbage_disposal_garbage_disposal_fix_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_garbage_disposal_garbage_disposal_fix_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_garbage_disposal_garbage_disposal_fix_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_garbage_disposal_garbage_disposal_fix_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_garbage_disposal_garbage_disposal_fix_next_steps` | Recommend the next five actions with quick wins. |
| `open_garbage_disposal_garbage_disposal_fix_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
