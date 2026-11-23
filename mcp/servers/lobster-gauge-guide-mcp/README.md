# Lobster Gauge Guide Compare

Real local JSON analysis of lobster gauge guide in the Lobster Gauge lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/lobster-gauge-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "lobster-gauge-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/lobster-gauge-guide-mcp"]
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
      "id": "lobster_gauge_lobster_gauge_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "lobster-gauge",
        "lobster",
        "gauge"
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
      "id": "lobster_gauge_lobster_gauge_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "lobster-gauge",
        "lobster",
        "gauge"
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
| `inventory_lobster_gauge_lobster_gauge_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_lobster_gauge_lobster_gauge_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_lobster_gauge_lobster_gauge_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_lobster_gauge_lobster_gauge_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_lobster_gauge_lobster_gauge_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_lobster_gauge_lobster_gauge_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_lobster_gauge_lobster_gauge_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_lobster_gauge_lobster_gauge_guide_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_lobster_gauge_lobster_gauge_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_lobster_gauge_lobster_gauge_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_lobster_gauge_lobster_gauge_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_lobster_gauge_lobster_gauge_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_lobster_gauge_lobster_gauge_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_lobster_gauge_lobster_gauge_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_lobster_gauge_lobster_gauge_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_lobster_gauge_lobster_gauge_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_lobster_gauge_lobster_gauge_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_lobster_gauge_lobster_gauge_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_lobster_gauge_lobster_gauge_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_lobster_gauge_lobster_gauge_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_lobster_gauge_lobster_gauge_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_lobster_gauge_lobster_gauge_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_lobster_gauge_lobster_gauge_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_lobster_gauge_lobster_gauge_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_lobster_gauge_lobster_gauge_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
