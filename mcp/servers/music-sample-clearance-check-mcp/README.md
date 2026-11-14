# Sample Clearance Audit

Audit music samples for clearance status, denied sources, pending licenses and category coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/music-sample-clearance-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "music-sample-clearance-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/music-sample-clearance-check-mcp"]
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
      "id": "music-drum-break",
      "name": "Vintage drum break",
      "category": "sample",
      "tags": [
        "cleared"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-01",
      "condition": "good"
    },
    {
      "id": "music-synth-loop",
      "name": "Synth arpeggio loop",
      "category": "loop",
      "tags": [
        "pending"
      ],
      "cost": 25,
      "quantity": 1,
      "acquired": "2026-04-01",
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_sample_clearance` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_sample_clearance_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_sample_clearance_coverage` | Show category coverage ratios and unknown categories. |
| `flag_sample_clearance_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_sample_clearance_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_sample_clearance_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_sample_clearance_baseline` | Compare category counts with the configured baseline. |
| `estimate_sample_clearance_clearance_risk` | Calculate the primary metric for every item with mean and pass count. |
| `find_sample_clearance_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_sample_clearance_dependencies` | Map dependency groups and show which ones are missing. |
| `test_sample_clearance_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_sample_clearance_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_sample_clearance_fixes` | Rank fixes by impact divided by effort. |
| `validate_sample_clearance_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_sample_clearance_duplicates` | Group items with the same category and normalized name. |
| `measure_sample_clearance_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_sample_clearance_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_sample_clearance_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_sample_clearance_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_sample_clearance_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_sample_clearance_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_sample_clearance_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_sample_clearance_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_sample_clearance_next_steps` | Recommend the next five actions with quick wins. |
| `open_sample_clearance_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
