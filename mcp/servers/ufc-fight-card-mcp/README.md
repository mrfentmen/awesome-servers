# Ufc Fight Card Tracker

Real local JSON analysis of ufc fight card in the Ufc Fight lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/ufc-fight-card-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "ufc-fight-card-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/ufc-fight-card-mcp"]
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
      "id": "ufc_fight_ufc_fight_card-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "ufc-fight",
        "ufc",
        "fight"
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
      "id": "ufc_fight_ufc_fight_card-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "ufc-fight",
        "ufc",
        "fight"
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
| `inventory_ufc_fight_ufc_fight_card` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_ufc_fight_ufc_fight_card_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_ufc_fight_ufc_fight_card_coverage` | Show category coverage ratios and unknown categories. |
| `flag_ufc_fight_ufc_fight_card_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_ufc_fight_ufc_fight_card_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_ufc_fight_ufc_fight_card_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_ufc_fight_ufc_fight_card_baseline` | Compare category counts with the configured baseline. |
| `estimate_ufc_fight_ufc_fight_card_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_ufc_fight_ufc_fight_card_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_ufc_fight_ufc_fight_card_dependencies` | Map dependency groups and show which ones are missing. |
| `test_ufc_fight_ufc_fight_card_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_ufc_fight_ufc_fight_card_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_ufc_fight_ufc_fight_card_fixes` | Rank fixes by impact divided by effort. |
| `validate_ufc_fight_ufc_fight_card_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_ufc_fight_ufc_fight_card_duplicates` | Group items with the same category and normalized name. |
| `measure_ufc_fight_ufc_fight_card_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_ufc_fight_ufc_fight_card_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_ufc_fight_ufc_fight_card_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_ufc_fight_ufc_fight_card_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_ufc_fight_ufc_fight_card_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_ufc_fight_ufc_fight_card_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_ufc_fight_ufc_fight_card_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_ufc_fight_ufc_fight_card_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_ufc_fight_ufc_fight_card_next_steps` | Recommend the next five actions with quick wins. |
| `open_ufc_fight_ufc_fight_card_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
