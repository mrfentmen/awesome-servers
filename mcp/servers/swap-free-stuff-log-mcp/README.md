# Swap Free Stuff Log Audit

Swap Free Stuff Log Audit: tool seed toy book gear swap log. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/swap-free-stuff-log-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "swap-free-stuff-log-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/swap-free-stuff-log-mcp"]
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
      "id": "swap_log-sample-1",
      "name": "Sample tools entry",
      "category": "tools",
      "tags": [
        "swap"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "swap_log-sample-2",
      "name": "Sample seeds entry",
      "category": "seeds",
      "tags": [
        "swap"
      ],
      "cost": 30,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_swap_log` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_swap_log_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_swap_log_coverage` | Show category coverage ratios and unknown categories. |
| `flag_swap_log_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_swap_log_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_swap_log_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_swap_log_baseline` | Compare category counts with the configured baseline. |
| `estimate_swap_log_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_swap_log_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_swap_log_dependencies` | Map dependency groups and show which ones are missing. |
| `test_swap_log_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_swap_log_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_swap_log_fixes` | Rank fixes by impact divided by effort. |
| `validate_swap_log_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_swap_log_duplicates` | Group items with the same category and normalized name. |
| `measure_swap_log_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_swap_log_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_swap_log_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_swap_log_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_swap_log_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_swap_log_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_swap_log_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_swap_log_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_swap_log_next_steps` | Recommend the next five actions with quick wins. |
| `open_swap_log_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
