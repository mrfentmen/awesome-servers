# Cnn News Digest Tracker

Real local JSON analysis of cnn news digest in the Cnn News lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/cnn-news-digest-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "cnn-news-digest-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/cnn-news-digest-mcp"]
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
      "id": "cnn_news_cnn_news_digest-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "cnn-news",
        "cnn",
        "news"
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
      "id": "cnn_news_cnn_news_digest-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "cnn-news",
        "cnn",
        "news"
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
| `inventory_cnn_news_cnn_news_digest` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_cnn_news_cnn_news_digest_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_cnn_news_cnn_news_digest_coverage` | Show category coverage ratios and unknown categories. |
| `flag_cnn_news_cnn_news_digest_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_cnn_news_cnn_news_digest_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_cnn_news_cnn_news_digest_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_cnn_news_cnn_news_digest_baseline` | Compare category counts with the configured baseline. |
| `estimate_cnn_news_cnn_news_digest_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_cnn_news_cnn_news_digest_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_cnn_news_cnn_news_digest_dependencies` | Map dependency groups and show which ones are missing. |
| `test_cnn_news_cnn_news_digest_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_cnn_news_cnn_news_digest_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_cnn_news_cnn_news_digest_fixes` | Rank fixes by impact divided by effort. |
| `validate_cnn_news_cnn_news_digest_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_cnn_news_cnn_news_digest_duplicates` | Group items with the same category and normalized name. |
| `measure_cnn_news_cnn_news_digest_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_cnn_news_cnn_news_digest_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_cnn_news_cnn_news_digest_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_cnn_news_cnn_news_digest_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_cnn_news_cnn_news_digest_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_cnn_news_cnn_news_digest_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_cnn_news_cnn_news_digest_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_cnn_news_cnn_news_digest_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_cnn_news_cnn_news_digest_next_steps` | Recommend the next five actions with quick wins. |
| `open_cnn_news_cnn_news_digest_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
