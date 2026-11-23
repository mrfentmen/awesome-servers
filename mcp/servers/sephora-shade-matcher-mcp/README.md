# Sephora Shade Matcher Tracker

Real local JSON analysis of sephora shade matcher in the Sephora Shade lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/sephora-shade-matcher-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "sephora-shade-matcher-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/sephora-shade-matcher-mcp"]
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
      "id": "sephora_shade_sephora_shade_matcher-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "sephora-shade",
        "sephora",
        "shade"
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
      "id": "sephora_shade_sephora_shade_matcher-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "sephora-shade",
        "sephora",
        "shade"
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
| `inventory_sephora_shade_sephora_shade_matcher` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_sephora_shade_sephora_shade_matcher_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_sephora_shade_sephora_shade_matcher_coverage` | Show category coverage ratios and unknown categories. |
| `flag_sephora_shade_sephora_shade_matcher_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_sephora_shade_sephora_shade_matcher_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_sephora_shade_sephora_shade_matcher_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_sephora_shade_sephora_shade_matcher_baseline` | Compare category counts with the configured baseline. |
| `estimate_sephora_shade_sephora_shade_matcher_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_sephora_shade_sephora_shade_matcher_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_sephora_shade_sephora_shade_matcher_dependencies` | Map dependency groups and show which ones are missing. |
| `test_sephora_shade_sephora_shade_matcher_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_sephora_shade_sephora_shade_matcher_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_sephora_shade_sephora_shade_matcher_fixes` | Rank fixes by impact divided by effort. |
| `validate_sephora_shade_sephora_shade_matcher_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_sephora_shade_sephora_shade_matcher_duplicates` | Group items with the same category and normalized name. |
| `measure_sephora_shade_sephora_shade_matcher_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_sephora_shade_sephora_shade_matcher_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_sephora_shade_sephora_shade_matcher_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_sephora_shade_sephora_shade_matcher_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_sephora_shade_sephora_shade_matcher_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_sephora_shade_sephora_shade_matcher_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_sephora_shade_sephora_shade_matcher_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_sephora_shade_sephora_shade_matcher_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_sephora_shade_sephora_shade_matcher_next_steps` | Recommend the next five actions with quick wins. |
| `open_sephora_shade_sephora_shade_matcher_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
