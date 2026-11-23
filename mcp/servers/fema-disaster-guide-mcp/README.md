# Fema Disaster Guide Audit

Real local JSON analysis of fema disaster guide in the Fema Disaster lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/fema-disaster-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "fema-disaster-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/fema-disaster-guide-mcp"]
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
      "id": "fema_disaster_fema_disaster_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "fema-disaster",
        "fema",
        "disaster"
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
      "id": "fema_disaster_fema_disaster_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "fema-disaster",
        "fema",
        "disaster"
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
| `inventory_fema_disaster_fema_disaster_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_fema_disaster_fema_disaster_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_fema_disaster_fema_disaster_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_fema_disaster_fema_disaster_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_fema_disaster_fema_disaster_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_fema_disaster_fema_disaster_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_fema_disaster_fema_disaster_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_fema_disaster_fema_disaster_guide_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_fema_disaster_fema_disaster_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_fema_disaster_fema_disaster_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_fema_disaster_fema_disaster_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_fema_disaster_fema_disaster_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_fema_disaster_fema_disaster_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_fema_disaster_fema_disaster_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_fema_disaster_fema_disaster_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_fema_disaster_fema_disaster_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_fema_disaster_fema_disaster_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_fema_disaster_fema_disaster_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_fema_disaster_fema_disaster_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_fema_disaster_fema_disaster_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_fema_disaster_fema_disaster_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_fema_disaster_fema_disaster_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_fema_disaster_fema_disaster_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_fema_disaster_fema_disaster_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_fema_disaster_fema_disaster_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
