# Dog Adoption Archive

Archive dog adoption by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/dogs-dog-adoption-index-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "dogs-dog-adoption-index-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/dogs-dog-adoption-index-mcp"]
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
      "id": "dog_adoption_index-home",
      "name": "Landlord approval",
      "category": "housing",
      "tags": [
        "rental",
        "written"
      ],
      "cost": 0,
      "quantity": 100,
      "condition": "good"
    },
    {
      "id": "dog_adoption_index-walk",
      "name": "Daily walk plan",
      "category": "schedule",
      "tags": [
        "morning",
        "evening"
      ],
      "cost": 0,
      "quantity": 85,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_dog_adoption_index` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_dog_adoption_index_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_dog_adoption_index_coverage` | Show category coverage ratios and unknown categories. |
| `flag_dog_adoption_index_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_dog_adoption_index_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_dog_adoption_index_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_dog_adoption_index_baseline` | Compare category counts with the configured baseline. |
| `estimate_dog_adoption_index_readiness_score` | Calculate the primary metric for every item with mean and pass count. |
| `find_dog_adoption_index_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_dog_adoption_index_dependencies` | Map dependency groups and show which ones are missing. |
| `test_dog_adoption_index_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_dog_adoption_index_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_dog_adoption_index_fixes` | Rank fixes by impact divided by effort. |
| `validate_dog_adoption_index_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_dog_adoption_index_duplicates` | Group items with the same category and normalized name. |
| `measure_dog_adoption_index_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_dog_adoption_index_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_dog_adoption_index_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_dog_adoption_index_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_dog_adoption_index_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_dog_adoption_index_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_dog_adoption_index_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_dog_adoption_index_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_dog_adoption_index_next_steps` | Recommend the next five actions with quick wins. |
| `open_dog_adoption_index_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
