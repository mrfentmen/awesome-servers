# Junk Drawer Organize Archive

Real local JSON analysis of junk drawer organize in the Junk Drawer lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/junk-drawer-organize-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "junk-drawer-organize-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/junk-drawer-organize-mcp"]
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
      "id": "junk_drawer_junk_drawer_organize-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "junk-drawer",
        "junk",
        "drawer"
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
      "id": "junk_drawer_junk_drawer_organize-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "junk-drawer",
        "junk",
        "drawer"
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
| `inventory_junk_drawer_junk_drawer_organize` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_junk_drawer_junk_drawer_organize_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_junk_drawer_junk_drawer_organize_coverage` | Show category coverage ratios and unknown categories. |
| `flag_junk_drawer_junk_drawer_organize_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_junk_drawer_junk_drawer_organize_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_junk_drawer_junk_drawer_organize_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_junk_drawer_junk_drawer_organize_baseline` | Compare category counts with the configured baseline. |
| `estimate_junk_drawer_junk_drawer_organize_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_junk_drawer_junk_drawer_organize_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_junk_drawer_junk_drawer_organize_dependencies` | Map dependency groups and show which ones are missing. |
| `test_junk_drawer_junk_drawer_organize_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_junk_drawer_junk_drawer_organize_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_junk_drawer_junk_drawer_organize_fixes` | Rank fixes by impact divided by effort. |
| `validate_junk_drawer_junk_drawer_organize_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_junk_drawer_junk_drawer_organize_duplicates` | Group items with the same category and normalized name. |
| `measure_junk_drawer_junk_drawer_organize_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_junk_drawer_junk_drawer_organize_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_junk_drawer_junk_drawer_organize_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_junk_drawer_junk_drawer_organize_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_junk_drawer_junk_drawer_organize_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_junk_drawer_junk_drawer_organize_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_junk_drawer_junk_drawer_organize_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_junk_drawer_junk_drawer_organize_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_junk_drawer_junk_drawer_organize_next_steps` | Recommend the next five actions with quick wins. |
| `open_junk_drawer_junk_drawer_organize_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
