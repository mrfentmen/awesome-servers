# Bean Subscription Matcher

Real local JSON analysis of bean subscription in the Coffee lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/coffee-bean-subscription-match-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "coffee-bean-subscription-match-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/coffee-bean-subscription-match-mcp"]
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
      "id": "coffee_coffee_bean_subscription_match-criteria-1",
      "name": "Criteria primary",
      "category": "criteria",
      "tags": [
        "coffee",
        "coffee",
        "bean"
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
      "id": "coffee_coffee_bean_subscription_match-candidates-2",
      "name": "Candidates primary",
      "category": "candidates",
      "tags": [
        "coffee",
        "coffee",
        "bean"
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
| `inventory_coffee_coffee_bean_subscription_match` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_coffee_coffee_bean_subscription_match_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_coffee_coffee_bean_subscription_match_coverage` | Show category coverage ratios and unknown categories. |
| `flag_coffee_coffee_bean_subscription_match_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_coffee_coffee_bean_subscription_match_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_coffee_coffee_bean_subscription_match_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_coffee_coffee_bean_subscription_match_baseline` | Compare category counts with the configured baseline. |
| `estimate_coffee_coffee_bean_subscription_match_clearance_risk` | Calculate the primary metric for every item with mean and pass count. |
| `find_coffee_coffee_bean_subscription_match_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_coffee_coffee_bean_subscription_match_dependencies` | Map dependency groups and show which ones are missing. |
| `test_coffee_coffee_bean_subscription_match_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_coffee_coffee_bean_subscription_match_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_coffee_coffee_bean_subscription_match_fixes` | Rank fixes by impact divided by effort. |
| `validate_coffee_coffee_bean_subscription_match_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_coffee_coffee_bean_subscription_match_duplicates` | Group items with the same category and normalized name. |
| `measure_coffee_coffee_bean_subscription_match_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_coffee_coffee_bean_subscription_match_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_coffee_coffee_bean_subscription_match_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_coffee_coffee_bean_subscription_match_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_coffee_coffee_bean_subscription_match_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_coffee_coffee_bean_subscription_match_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_coffee_coffee_bean_subscription_match_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_coffee_coffee_bean_subscription_match_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_coffee_coffee_bean_subscription_match_next_steps` | Recommend the next five actions with quick wins. |
| `open_coffee_coffee_bean_subscription_match_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
