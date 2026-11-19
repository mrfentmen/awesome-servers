# Home Energy Waste Walkthrough Audit

Home Energy Waste Walkthrough Audit: room by room energy waste checklist. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/home-energy-waste-walkthrough-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "home-energy-waste-walkthrough-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/home-energy-waste-walkthrough-mcp"]
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
      "id": "energy_walk-sample-1",
      "name": "Sample living areas entry",
      "category": "living",
      "tags": [
        "energy"
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
      "id": "energy_walk-sample-2",
      "name": "Sample kitchen entry",
      "category": "kitchen",
      "tags": [
        "energy"
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
| `inventory_energy_walk` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_energy_walk_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_energy_walk_coverage` | Show category coverage ratios and unknown categories. |
| `flag_energy_walk_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_energy_walk_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_energy_walk_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_energy_walk_baseline` | Compare category counts with the configured baseline. |
| `estimate_energy_walk_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_energy_walk_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_energy_walk_dependencies` | Map dependency groups and show which ones are missing. |
| `test_energy_walk_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_energy_walk_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_energy_walk_fixes` | Rank fixes by impact divided by effort. |
| `validate_energy_walk_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_energy_walk_duplicates` | Group items with the same category and normalized name. |
| `measure_energy_walk_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_energy_walk_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_energy_walk_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_energy_walk_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_energy_walk_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_energy_walk_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_energy_walk_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_energy_walk_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_energy_walk_next_steps` | Recommend the next five actions with quick wins. |
| `open_energy_walk_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
