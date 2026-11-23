# Sump Pump Guide Matcher

Real local JSON analysis of sump pump guide in the Sump Pump lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/sump-pump-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "sump-pump-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/sump-pump-guide-mcp"]
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
      "id": "sump_pump_sump_pump_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "sump-pump",
        "sump",
        "pump"
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
      "id": "sump_pump_sump_pump_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "sump-pump",
        "sump",
        "pump"
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
| `inventory_sump_pump_sump_pump_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_sump_pump_sump_pump_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_sump_pump_sump_pump_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_sump_pump_sump_pump_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_sump_pump_sump_pump_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_sump_pump_sump_pump_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_sump_pump_sump_pump_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_sump_pump_sump_pump_guide_clearance_risk` | Calculate the primary metric for every item with mean and pass count. |
| `find_sump_pump_sump_pump_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_sump_pump_sump_pump_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_sump_pump_sump_pump_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_sump_pump_sump_pump_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_sump_pump_sump_pump_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_sump_pump_sump_pump_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_sump_pump_sump_pump_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_sump_pump_sump_pump_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_sump_pump_sump_pump_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_sump_pump_sump_pump_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_sump_pump_sump_pump_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_sump_pump_sump_pump_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_sump_pump_sump_pump_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_sump_pump_sump_pump_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_sump_pump_sump_pump_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_sump_pump_sump_pump_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_sump_pump_sump_pump_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
