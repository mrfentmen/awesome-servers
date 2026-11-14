# Smart Home Compatibility Audit

Audit hubs, lights, sensors and plugs for protocol overlap and compatibility. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/smart-home-device-compat-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "smart-home-device-compat-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/smart-home-device-compat-check-mcp"]
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
      "id": "smart-hub",
      "name": "Matter hub",
      "category": "hub",
      "tags": [
        "wifi",
        "matter"
      ],
      "cost": 90,
      "quantity": 1,
      "condition": "new"
    },
    {
      "id": "smart-light",
      "name": "Wi-Fi bulb",
      "category": "light",
      "tags": [
        "wifi"
      ],
      "cost": 20,
      "quantity": 3,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_device_compat` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_device_compat_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_device_compat_coverage` | Show category coverage ratios and unknown categories. |
| `flag_device_compat_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_device_compat_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_device_compat_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_device_compat_baseline` | Compare category counts with the configured baseline. |
| `estimate_device_compat_active_overlap` | Calculate the primary metric for every item with mean and pass count. |
| `find_device_compat_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_device_compat_dependencies` | Map dependency groups and show which ones are missing. |
| `test_device_compat_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_device_compat_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_device_compat_fixes` | Rank fixes by impact divided by effort. |
| `validate_device_compat_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_device_compat_duplicates` | Group items with the same category and normalized name. |
| `measure_device_compat_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_device_compat_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_device_compat_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_device_compat_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_device_compat_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_device_compat_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_device_compat_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_device_compat_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_device_compat_next_steps` | Recommend the next five actions with quick wins. |
| `open_device_compat_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
