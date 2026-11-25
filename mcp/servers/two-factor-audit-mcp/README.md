# two factor audit Audit

Real local JSON analysis of two factor audit in the Security & Privacy lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/two-factor-audit-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "two-factor-audit-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/two-factor-audit-mcp"]
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
      "id": "sec_two_factor_audit-sec-1",
      "name": "sec primary",
      "category": "sec",
      "tags": [
        "security-privacy",
        "two",
        "factor"
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
      "id": "sec_two_factor_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "security-privacy",
        "two",
        "factor"
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
| `inventory_sec_two_factor_audit` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_sec_two_factor_audit_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_sec_two_factor_audit_coverage` | Show category coverage ratios and unknown categories. |
| `flag_sec_two_factor_audit_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_sec_two_factor_audit_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_sec_two_factor_audit_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_sec_two_factor_audit_baseline` | Compare category counts with the configured baseline. |
| `estimate_sec_two_factor_audit_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_sec_two_factor_audit_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_sec_two_factor_audit_dependencies` | Map dependency groups and show which ones are missing. |
| `test_sec_two_factor_audit_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_sec_two_factor_audit_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_sec_two_factor_audit_fixes` | Rank fixes by impact divided by effort. |
| `validate_sec_two_factor_audit_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_sec_two_factor_audit_duplicates` | Group items with the same category and normalized name. |
| `measure_sec_two_factor_audit_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_sec_two_factor_audit_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_sec_two_factor_audit_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_sec_two_factor_audit_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_sec_two_factor_audit_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_sec_two_factor_audit_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_sec_two_factor_audit_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_sec_two_factor_audit_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_sec_two_factor_audit_next_steps` | Recommend the next five actions with quick wins. |
| `open_sec_two_factor_audit_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
