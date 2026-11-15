# Moon Phase Audit

Audit moon phase, rise time, cloud cover and viewing location for a night observation. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/nasa-moon-phase-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "nasa-moon-phase-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/nasa-moon-phase-check-mcp"]
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
      "id": "moon_phase-waxing-moon",
      "name": "Waxing moon",
      "category": "phase",
      "tags": [
        "phase"
      ],
      "cost": 0,
      "quantity": 62,
      "condition": "good"
    },
    {
      "id": "moon_phase-moonrise",
      "name": "Moonrise",
      "category": "rise",
      "tags": [
        "rise"
      ],
      "cost": 0,
      "quantity": 19,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_moon_phase` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_moon_phase_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_moon_phase_coverage` | Show category coverage ratios and unknown categories. |
| `flag_moon_phase_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_moon_phase_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_moon_phase_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_moon_phase_baseline` | Compare category counts with the configured baseline. |
| `estimate_moon_phase_illumination_pct` | Calculate the primary metric for every item with mean and pass count. |
| `find_moon_phase_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_moon_phase_dependencies` | Map dependency groups and show which ones are missing. |
| `test_moon_phase_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_moon_phase_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_moon_phase_fixes` | Rank fixes by impact divided by effort. |
| `validate_moon_phase_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_moon_phase_duplicates` | Group items with the same category and normalized name. |
| `measure_moon_phase_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_moon_phase_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_moon_phase_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_moon_phase_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_moon_phase_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_moon_phase_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_moon_phase_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_moon_phase_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_moon_phase_next_steps` | Recommend the next five actions with quick wins. |
| `open_moon_phase_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
