# Nytimes Article Saver Tracker

Real local JSON analysis of nytimes article saver in the Nytimes Article lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/nytimes-article-saver-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "nytimes-article-saver-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/nytimes-article-saver-mcp"]
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
      "id": "nytimes_article_nytimes_article_saver-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "nytimes-article",
        "nytimes",
        "article"
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
      "id": "nytimes_article_nytimes_article_saver-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "nytimes-article",
        "nytimes",
        "article"
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
| `inventory_nytimes_article_nytimes_article_saver` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_nytimes_article_nytimes_article_saver_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_nytimes_article_nytimes_article_saver_coverage` | Show category coverage ratios and unknown categories. |
| `flag_nytimes_article_nytimes_article_saver_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_nytimes_article_nytimes_article_saver_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_nytimes_article_nytimes_article_saver_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_nytimes_article_nytimes_article_saver_baseline` | Compare category counts with the configured baseline. |
| `estimate_nytimes_article_nytimes_article_saver_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_nytimes_article_nytimes_article_saver_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_nytimes_article_nytimes_article_saver_dependencies` | Map dependency groups and show which ones are missing. |
| `test_nytimes_article_nytimes_article_saver_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_nytimes_article_nytimes_article_saver_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_nytimes_article_nytimes_article_saver_fixes` | Rank fixes by impact divided by effort. |
| `validate_nytimes_article_nytimes_article_saver_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_nytimes_article_nytimes_article_saver_duplicates` | Group items with the same category and normalized name. |
| `measure_nytimes_article_nytimes_article_saver_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_nytimes_article_nytimes_article_saver_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_nytimes_article_nytimes_article_saver_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_nytimes_article_nytimes_article_saver_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_nytimes_article_nytimes_article_saver_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_nytimes_article_nytimes_article_saver_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_nytimes_article_nytimes_article_saver_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_nytimes_article_nytimes_article_saver_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_nytimes_article_nytimes_article_saver_next_steps` | Recommend the next five actions with quick wins. |
| `open_nytimes_article_nytimes_article_saver_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
