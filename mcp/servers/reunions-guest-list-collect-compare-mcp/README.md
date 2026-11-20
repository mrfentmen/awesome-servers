# Guest List Collect Compare

Real local JSON analysis of guest list collect in the Family Reunions lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/reunions-guest-list-collect-compare-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "reunions-guest-list-collect-compare-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/reunions-guest-list-collect-compare-mcp"]
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
      "id": "reunions_reunions_guest_list_collect_compare-options-1",
      "name": "Options primary",
      "category": "options",
      "tags": [
        "family-reunions",
        "reunions",
        "guest"
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
      "id": "reunions_reunions_guest_list_collect_compare-prices-2",
      "name": "Prices primary",
      "category": "prices",
      "tags": [
        "family-reunions",
        "reunions",
        "guest"
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
| `inventory_reunions_reunions_guest_list_collect_compare` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_reunions_reunions_guest_list_collect_compare_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_reunions_reunions_guest_list_collect_compare_coverage` | Show category coverage ratios and unknown categories. |
| `flag_reunions_reunions_guest_list_collect_compare_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_reunions_reunions_guest_list_collect_compare_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_reunions_reunions_guest_list_collect_compare_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_reunions_reunions_guest_list_collect_compare_baseline` | Compare category counts with the configured baseline. |
| `estimate_reunions_reunions_guest_list_collect_compare_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_reunions_reunions_guest_list_collect_compare_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_reunions_reunions_guest_list_collect_compare_dependencies` | Map dependency groups and show which ones are missing. |
| `test_reunions_reunions_guest_list_collect_compare_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_reunions_reunions_guest_list_collect_compare_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_reunions_reunions_guest_list_collect_compare_fixes` | Rank fixes by impact divided by effort. |
| `validate_reunions_reunions_guest_list_collect_compare_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_reunions_reunions_guest_list_collect_compare_duplicates` | Group items with the same category and normalized name. |
| `measure_reunions_reunions_guest_list_collect_compare_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_reunions_reunions_guest_list_collect_compare_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_reunions_reunions_guest_list_collect_compare_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_reunions_reunions_guest_list_collect_compare_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_reunions_reunions_guest_list_collect_compare_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_reunions_reunions_guest_list_collect_compare_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_reunions_reunions_guest_list_collect_compare_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_reunions_reunions_guest_list_collect_compare_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_reunions_reunions_guest_list_collect_compare_next_steps` | Recommend the next five actions with quick wins. |
| `open_reunions_reunions_guest_list_collect_compare_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
