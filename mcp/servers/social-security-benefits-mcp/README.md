# Social Security Benefits Matcher

Real local JSON analysis of social security benefits in the Social Security lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/social-security-benefits-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "social-security-benefits-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/social-security-benefits-mcp"]
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
      "id": "social_security_social_security_benefits-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "social-security",
        "social",
        "security"
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
      "id": "social_security_social_security_benefits-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "social-security",
        "social",
        "security"
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
| `inventory_social_security_social_security_benefits` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_social_security_social_security_benefits_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_social_security_social_security_benefits_coverage` | Show category coverage ratios and unknown categories. |
| `flag_social_security_social_security_benefits_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_social_security_social_security_benefits_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_social_security_social_security_benefits_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_social_security_social_security_benefits_baseline` | Compare category counts with the configured baseline. |
| `estimate_social_security_social_security_benefits_clearance_risk` | Calculate the primary metric for every item with mean and pass count. |
| `find_social_security_social_security_benefits_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_social_security_social_security_benefits_dependencies` | Map dependency groups and show which ones are missing. |
| `test_social_security_social_security_benefits_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_social_security_social_security_benefits_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_social_security_social_security_benefits_fixes` | Rank fixes by impact divided by effort. |
| `validate_social_security_social_security_benefits_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_social_security_social_security_benefits_duplicates` | Group items with the same category and normalized name. |
| `measure_social_security_social_security_benefits_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_social_security_social_security_benefits_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_social_security_social_security_benefits_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_social_security_social_security_benefits_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_social_security_social_security_benefits_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_social_security_social_security_benefits_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_social_security_social_security_benefits_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_social_security_social_security_benefits_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_social_security_social_security_benefits_next_steps` | Recommend the next five actions with quick wins. |
| `open_social_security_social_security_benefits_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
