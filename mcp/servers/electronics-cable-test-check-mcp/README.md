# Cable Test Audit

Audit cable test by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/electronics-cable-test-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "electronics-cable-test-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/electronics-cable-test-check-mcp"]
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
      "id": "cable_test-usbc",
      "name": "USB-C 100W cable",
      "category": "usb-c",
      "tags": [
        "100w",
        "braided"
      ],
      "cost": 25,
      "quantity": 96,
      "condition": "good"
    },
    {
      "id": "cable_test-hdmi",
      "name": "HDMI 2.1 cable",
      "category": "hdmi",
      "tags": [
        "8k",
        "certified"
      ],
      "cost": 18,
      "quantity": 92,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_cable_test` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_cable_test_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_cable_test_coverage` | Show category coverage ratios and unknown categories. |
| `flag_cable_test_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_cable_test_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_cable_test_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_cable_test_baseline` | Compare category counts with the configured baseline. |
| `estimate_cable_test_continuity_score` | Calculate the primary metric for every item with mean and pass count. |
| `find_cable_test_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_cable_test_dependencies` | Map dependency groups and show which ones are missing. |
| `test_cable_test_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_cable_test_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_cable_test_fixes` | Rank fixes by impact divided by effort. |
| `validate_cable_test_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_cable_test_duplicates` | Group items with the same category and normalized name. |
| `measure_cable_test_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_cable_test_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_cable_test_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_cable_test_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_cable_test_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_cable_test_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_cable_test_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_cable_test_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_cable_test_next_steps` | Recommend the next five actions with quick wins. |
| `open_cable_test_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
