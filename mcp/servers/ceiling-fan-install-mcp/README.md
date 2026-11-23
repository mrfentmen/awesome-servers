# Ceiling Fan Install Audit

Real local JSON analysis of ceiling fan install in the Ceiling Fan lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/ceiling-fan-install-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "ceiling-fan-install-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/ceiling-fan-install-mcp"]
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
      "id": "ceiling_fan_ceiling_fan_install-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "ceiling-fan",
        "ceiling",
        "fan"
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
      "id": "ceiling_fan_ceiling_fan_install-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "ceiling-fan",
        "ceiling",
        "fan"
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
| `inventory_ceiling_fan_ceiling_fan_install` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_ceiling_fan_ceiling_fan_install_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_ceiling_fan_ceiling_fan_install_coverage` | Show category coverage ratios and unknown categories. |
| `flag_ceiling_fan_ceiling_fan_install_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_ceiling_fan_ceiling_fan_install_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_ceiling_fan_ceiling_fan_install_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_ceiling_fan_ceiling_fan_install_baseline` | Compare category counts with the configured baseline. |
| `estimate_ceiling_fan_ceiling_fan_install_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_ceiling_fan_ceiling_fan_install_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_ceiling_fan_ceiling_fan_install_dependencies` | Map dependency groups and show which ones are missing. |
| `test_ceiling_fan_ceiling_fan_install_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_ceiling_fan_ceiling_fan_install_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_ceiling_fan_ceiling_fan_install_fixes` | Rank fixes by impact divided by effort. |
| `validate_ceiling_fan_ceiling_fan_install_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_ceiling_fan_ceiling_fan_install_duplicates` | Group items with the same category and normalized name. |
| `measure_ceiling_fan_ceiling_fan_install_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_ceiling_fan_ceiling_fan_install_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_ceiling_fan_ceiling_fan_install_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_ceiling_fan_ceiling_fan_install_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_ceiling_fan_ceiling_fan_install_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_ceiling_fan_ceiling_fan_install_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_ceiling_fan_ceiling_fan_install_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_ceiling_fan_ceiling_fan_install_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_ceiling_fan_ceiling_fan_install_next_steps` | Recommend the next five actions with quick wins. |
| `open_ceiling_fan_ceiling_fan_install_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
