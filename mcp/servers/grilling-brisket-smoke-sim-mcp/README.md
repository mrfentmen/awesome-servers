# Brisket Smoke Simulator

Real local JSON analysis of brisket smoke in the Grilling lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/grilling-brisket-smoke-sim-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "grilling-brisket-smoke-sim-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/grilling-brisket-smoke-sim-mcp"]
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
      "id": "grilling_grilling_brisket_smoke_sim-inputs-1",
      "name": "Inputs primary",
      "category": "inputs",
      "tags": [
        "grilling",
        "grilling",
        "brisket"
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
      "id": "grilling_grilling_brisket_smoke_sim-scenarios-2",
      "name": "Scenarios primary",
      "category": "scenarios",
      "tags": [
        "grilling",
        "grilling",
        "brisket"
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
| `inventory_grilling_grilling_brisket_smoke_sim` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_grilling_grilling_brisket_smoke_sim_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_grilling_grilling_brisket_smoke_sim_coverage` | Show category coverage ratios and unknown categories. |
| `flag_grilling_grilling_brisket_smoke_sim_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_grilling_grilling_brisket_smoke_sim_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_grilling_grilling_brisket_smoke_sim_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_grilling_grilling_brisket_smoke_sim_baseline` | Compare category counts with the configured baseline. |
| `estimate_grilling_grilling_brisket_smoke_sim_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_grilling_grilling_brisket_smoke_sim_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_grilling_grilling_brisket_smoke_sim_dependencies` | Map dependency groups and show which ones are missing. |
| `test_grilling_grilling_brisket_smoke_sim_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_grilling_grilling_brisket_smoke_sim_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_grilling_grilling_brisket_smoke_sim_fixes` | Rank fixes by impact divided by effort. |
| `validate_grilling_grilling_brisket_smoke_sim_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_grilling_grilling_brisket_smoke_sim_duplicates` | Group items with the same category and normalized name. |
| `measure_grilling_grilling_brisket_smoke_sim_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_grilling_grilling_brisket_smoke_sim_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_grilling_grilling_brisket_smoke_sim_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_grilling_grilling_brisket_smoke_sim_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_grilling_grilling_brisket_smoke_sim_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_grilling_grilling_brisket_smoke_sim_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_grilling_grilling_brisket_smoke_sim_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_grilling_grilling_brisket_smoke_sim_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_grilling_grilling_brisket_smoke_sim_next_steps` | Recommend the next five actions with quick wins. |
| `open_grilling_grilling_brisket_smoke_sim_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
