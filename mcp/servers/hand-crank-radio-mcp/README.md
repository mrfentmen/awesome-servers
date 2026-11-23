# Hand Crank Radio Audit

Real local JSON analysis of hand crank radio in the Hand Crank lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/hand-crank-radio-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "hand-crank-radio-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/hand-crank-radio-mcp"]
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
      "id": "hand_crank_hand_crank_radio-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "hand-crank",
        "hand",
        "crank"
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
      "id": "hand_crank_hand_crank_radio-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "hand-crank",
        "hand",
        "crank"
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
| `inventory_hand_crank_hand_crank_radio` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_hand_crank_hand_crank_radio_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_hand_crank_hand_crank_radio_coverage` | Show category coverage ratios and unknown categories. |
| `flag_hand_crank_hand_crank_radio_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_hand_crank_hand_crank_radio_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_hand_crank_hand_crank_radio_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_hand_crank_hand_crank_radio_baseline` | Compare category counts with the configured baseline. |
| `estimate_hand_crank_hand_crank_radio_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_hand_crank_hand_crank_radio_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_hand_crank_hand_crank_radio_dependencies` | Map dependency groups and show which ones are missing. |
| `test_hand_crank_hand_crank_radio_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_hand_crank_hand_crank_radio_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_hand_crank_hand_crank_radio_fixes` | Rank fixes by impact divided by effort. |
| `validate_hand_crank_hand_crank_radio_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_hand_crank_hand_crank_radio_duplicates` | Group items with the same category and normalized name. |
| `measure_hand_crank_hand_crank_radio_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_hand_crank_hand_crank_radio_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_hand_crank_hand_crank_radio_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_hand_crank_hand_crank_radio_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_hand_crank_hand_crank_radio_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_hand_crank_hand_crank_radio_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_hand_crank_hand_crank_radio_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_hand_crank_hand_crank_radio_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_hand_crank_hand_crank_radio_next_steps` | Recommend the next five actions with quick wins. |
| `open_hand_crank_hand_crank_radio_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
