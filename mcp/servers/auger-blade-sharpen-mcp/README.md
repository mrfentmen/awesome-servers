# Auger Blade Sharpen Archive

Real local JSON analysis of auger blade sharpen in the Auger Blade lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/auger-blade-sharpen-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "auger-blade-sharpen-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/auger-blade-sharpen-mcp"]
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
      "id": "auger_blade_auger_blade_sharpen-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "auger-blade",
        "auger",
        "blade"
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
      "id": "auger_blade_auger_blade_sharpen-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "auger-blade",
        "auger",
        "blade"
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
| `inventory_auger_blade_auger_blade_sharpen` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_auger_blade_auger_blade_sharpen_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_auger_blade_auger_blade_sharpen_coverage` | Show category coverage ratios and unknown categories. |
| `flag_auger_blade_auger_blade_sharpen_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_auger_blade_auger_blade_sharpen_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_auger_blade_auger_blade_sharpen_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_auger_blade_auger_blade_sharpen_baseline` | Compare category counts with the configured baseline. |
| `estimate_auger_blade_auger_blade_sharpen_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_auger_blade_auger_blade_sharpen_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_auger_blade_auger_blade_sharpen_dependencies` | Map dependency groups and show which ones are missing. |
| `test_auger_blade_auger_blade_sharpen_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_auger_blade_auger_blade_sharpen_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_auger_blade_auger_blade_sharpen_fixes` | Rank fixes by impact divided by effort. |
| `validate_auger_blade_auger_blade_sharpen_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_auger_blade_auger_blade_sharpen_duplicates` | Group items with the same category and normalized name. |
| `measure_auger_blade_auger_blade_sharpen_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_auger_blade_auger_blade_sharpen_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_auger_blade_auger_blade_sharpen_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_auger_blade_auger_blade_sharpen_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_auger_blade_auger_blade_sharpen_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_auger_blade_auger_blade_sharpen_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_auger_blade_auger_blade_sharpen_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_auger_blade_auger_blade_sharpen_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_auger_blade_auger_blade_sharpen_next_steps` | Recommend the next five actions with quick wins. |
| `open_auger_blade_auger_blade_sharpen_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
