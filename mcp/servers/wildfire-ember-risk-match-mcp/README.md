# Ember Risk Match Audit

Match ember risk by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/wildfire-ember-risk-match-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "wildfire-ember-risk-match-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/wildfire-ember-risk-match-mcp"]
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
      "id": "ember_risk_match-roof-class",
      "name": "Roof class",
      "category": "roof",
      "tags": [
        "roof"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "ember_risk_match-vent-screens",
      "name": "Vent screens",
      "category": "vents",
      "tags": [
        "vents"
      ],
      "cost": 50,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_ember_risk_match` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_ember_risk_match_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_ember_risk_match_coverage` | Show category coverage ratios and unknown categories. |
| `flag_ember_risk_match_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_ember_risk_match_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_ember_risk_match_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_ember_risk_match_baseline` | Compare category counts with the configured baseline. |
| `estimate_ember_risk_match_ember_vulnerabilities` | Calculate the primary metric for every item with mean and pass count. |
| `find_ember_risk_match_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_ember_risk_match_dependencies` | Map dependency groups and show which ones are missing. |
| `test_ember_risk_match_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_ember_risk_match_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_ember_risk_match_fixes` | Rank fixes by impact divided by effort. |
| `validate_ember_risk_match_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_ember_risk_match_duplicates` | Group items with the same category and normalized name. |
| `measure_ember_risk_match_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_ember_risk_match_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_ember_risk_match_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_ember_risk_match_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_ember_risk_match_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_ember_risk_match_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_ember_risk_match_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_ember_risk_match_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_ember_risk_match_next_steps` | Recommend the next five actions with quick wins. |
| `open_ember_risk_match_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
