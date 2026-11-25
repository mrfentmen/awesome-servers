# animal shelter planner Planner

Real local JSON analysis of animal shelter planner in the Nonprofits & Community lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/animal-shelter-planner-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "animal-shelter-planner-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/animal-shelter-planner-mcp"]
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
      "id": "nonprofit_animal_shelter_planner-nonprofit-1",
      "name": "nonprofit primary",
      "category": "nonprofit",
      "tags": [
        "nonprofits-community",
        "animal",
        "shelter"
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
      "id": "nonprofit_animal_shelter_planner-planner-2",
      "name": "planner primary",
      "category": "planner",
      "tags": [
        "nonprofits-community",
        "animal",
        "shelter"
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
| `inventory_nonprofit_animal_shelter_planner` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_nonprofit_animal_shelter_planner_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_nonprofit_animal_shelter_planner_coverage` | Show category coverage ratios and unknown categories. |
| `flag_nonprofit_animal_shelter_planner_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_nonprofit_animal_shelter_planner_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_nonprofit_animal_shelter_planner_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_nonprofit_animal_shelter_planner_baseline` | Compare category counts with the configured baseline. |
| `estimate_nonprofit_animal_shelter_planner_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_nonprofit_animal_shelter_planner_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_nonprofit_animal_shelter_planner_dependencies` | Map dependency groups and show which ones are missing. |
| `test_nonprofit_animal_shelter_planner_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_nonprofit_animal_shelter_planner_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_nonprofit_animal_shelter_planner_fixes` | Rank fixes by impact divided by effort. |
| `validate_nonprofit_animal_shelter_planner_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_nonprofit_animal_shelter_planner_duplicates` | Group items with the same category and normalized name. |
| `measure_nonprofit_animal_shelter_planner_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_nonprofit_animal_shelter_planner_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_nonprofit_animal_shelter_planner_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_nonprofit_animal_shelter_planner_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_nonprofit_animal_shelter_planner_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_nonprofit_animal_shelter_planner_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_nonprofit_animal_shelter_planner_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_nonprofit_animal_shelter_planner_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_nonprofit_animal_shelter_planner_next_steps` | Recommend the next five actions with quick wins. |
| `open_nonprofit_animal_shelter_planner_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
