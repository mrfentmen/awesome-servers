# Amphibian Pond Audit

Audit pond water, cover, breeding habitat and predator control for amphibians. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/animals-amphibian-pond-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "animals-amphibian-pond-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/animals-amphibian-pond-check-mcp"]
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
      "id": "amphibian_pond-pond-water",
      "name": "Pond water",
      "category": "water",
      "tags": [
        "water"
      ],
      "cost": 0,
      "quantity": 24,
      "condition": "good"
    },
    {
      "id": "amphibian_pond-plant-cover",
      "name": "Plant cover",
      "category": "cover",
      "tags": [
        "cover"
      ],
      "cost": 40,
      "quantity": 60,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_amphibian_pond` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_amphibian_pond_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_amphibian_pond_coverage` | Show category coverage ratios and unknown categories. |
| `flag_amphibian_pond_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_amphibian_pond_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_amphibian_pond_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_amphibian_pond_baseline` | Compare category counts with the configured baseline. |
| `estimate_amphibian_pond_pond_depth` | Calculate the primary metric for every item with mean and pass count. |
| `find_amphibian_pond_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_amphibian_pond_dependencies` | Map dependency groups and show which ones are missing. |
| `test_amphibian_pond_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_amphibian_pond_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_amphibian_pond_fixes` | Rank fixes by impact divided by effort. |
| `validate_amphibian_pond_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_amphibian_pond_duplicates` | Group items with the same category and normalized name. |
| `measure_amphibian_pond_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_amphibian_pond_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_amphibian_pond_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_amphibian_pond_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_amphibian_pond_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_amphibian_pond_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_amphibian_pond_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_amphibian_pond_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_amphibian_pond_next_steps` | Recommend the next five actions with quick wins. |
| `open_amphibian_pond_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
