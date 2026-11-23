# Light Dimmer Install Audit

Real local JSON analysis of light dimmer install in the Light Dimmer lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/light-dimmer-install-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "light-dimmer-install-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/light-dimmer-install-mcp"]
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
      "id": "light_dimmer_light_dimmer_install-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "light-dimmer",
        "light",
        "dimmer"
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
      "id": "light_dimmer_light_dimmer_install-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "light-dimmer",
        "light",
        "dimmer"
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
| `inventory_light_dimmer_light_dimmer_install` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_light_dimmer_light_dimmer_install_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_light_dimmer_light_dimmer_install_coverage` | Show category coverage ratios and unknown categories. |
| `flag_light_dimmer_light_dimmer_install_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_light_dimmer_light_dimmer_install_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_light_dimmer_light_dimmer_install_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_light_dimmer_light_dimmer_install_baseline` | Compare category counts with the configured baseline. |
| `estimate_light_dimmer_light_dimmer_install_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_light_dimmer_light_dimmer_install_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_light_dimmer_light_dimmer_install_dependencies` | Map dependency groups and show which ones are missing. |
| `test_light_dimmer_light_dimmer_install_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_light_dimmer_light_dimmer_install_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_light_dimmer_light_dimmer_install_fixes` | Rank fixes by impact divided by effort. |
| `validate_light_dimmer_light_dimmer_install_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_light_dimmer_light_dimmer_install_duplicates` | Group items with the same category and normalized name. |
| `measure_light_dimmer_light_dimmer_install_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_light_dimmer_light_dimmer_install_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_light_dimmer_light_dimmer_install_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_light_dimmer_light_dimmer_install_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_light_dimmer_light_dimmer_install_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_light_dimmer_light_dimmer_install_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_light_dimmer_light_dimmer_install_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_light_dimmer_light_dimmer_install_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_light_dimmer_light_dimmer_install_next_steps` | Recommend the next five actions with quick wins. |
| `open_light_dimmer_light_dimmer_install_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
