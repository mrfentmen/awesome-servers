# Fermentation Log Audit

Fermentation Log Audit: kimchi sourdough yogurt batch log. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/fermentation-log-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "fermentation-log-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/fermentation-log-mcp"]
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
      "id": "ferment_log-sample-1",
      "name": "Sample kimchi entry",
      "category": "kimchi",
      "tags": [
        "fermentation"
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
      "id": "ferment_log-sample-2",
      "name": "Sample sourdough entry",
      "category": "sourdough",
      "tags": [
        "fermentation"
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
| `inventory_ferment_log` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_ferment_log_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_ferment_log_coverage` | Show category coverage ratios and unknown categories. |
| `flag_ferment_log_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_ferment_log_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_ferment_log_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_ferment_log_baseline` | Compare category counts with the configured baseline. |
| `estimate_ferment_log_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_ferment_log_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_ferment_log_dependencies` | Map dependency groups and show which ones are missing. |
| `test_ferment_log_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_ferment_log_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_ferment_log_fixes` | Rank fixes by impact divided by effort. |
| `validate_ferment_log_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_ferment_log_duplicates` | Group items with the same category and normalized name. |
| `measure_ferment_log_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_ferment_log_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_ferment_log_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_ferment_log_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_ferment_log_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_ferment_log_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_ferment_log_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_ferment_log_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_ferment_log_next_steps` | Recommend the next five actions with quick wins. |
| `open_ferment_log_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
