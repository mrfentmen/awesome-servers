# Reading Level Match Audit

Match reading level by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/education-reading-level-match-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "education-reading-level-match-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/education-reading-level-match-mcp"]
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
      "id": "reading_level_match-short-vowel-decodable",
      "name": "Short vowel decodable",
      "category": "phonics",
      "tags": [
        "phonics",
        "k-1"
      ],
      "cost": 6,
      "quantity": 86,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "reading_level_match-blends-decodable",
      "name": "Blends decodable",
      "category": "phonics",
      "tags": [
        "phonics",
        "grade-1"
      ],
      "cost": 6,
      "quantity": 78,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_reading_level_match` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_reading_level_match_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_reading_level_match_coverage` | Show category coverage ratios and unknown categories. |
| `flag_reading_level_match_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_reading_level_match_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_reading_level_match_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_reading_level_match_baseline` | Compare category counts with the configured baseline. |
| `estimate_reading_level_match_comprehension_pct` | Calculate the primary metric for every item with mean and pass count. |
| `find_reading_level_match_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_reading_level_match_dependencies` | Map dependency groups and show which ones are missing. |
| `test_reading_level_match_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_reading_level_match_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_reading_level_match_fixes` | Rank fixes by impact divided by effort. |
| `validate_reading_level_match_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_reading_level_match_duplicates` | Group items with the same category and normalized name. |
| `measure_reading_level_match_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_reading_level_match_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_reading_level_match_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_reading_level_match_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_reading_level_match_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_reading_level_match_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_reading_level_match_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_reading_level_match_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_reading_level_match_next_steps` | Recommend the next five actions with quick wins. |
| `open_reading_level_match_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
