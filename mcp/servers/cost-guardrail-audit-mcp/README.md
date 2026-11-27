# cost guardrail audit Audit

Real local JSON analysis of cost guardrail audit in the Data & AI Ops lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/cost-guardrail-audit-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "cost-guardrail-audit-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/cost-guardrail-audit-mcp"]
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
      "id": "data_cost_guardrail_audit-data-1",
      "name": "data primary",
      "category": "data",
      "tags": [
        "data-ai-ops",
        "cost",
        "guardrail"
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
      "id": "data_cost_guardrail_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "data-ai-ops",
        "cost",
        "guardrail"
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
| `inventory_data_cost_guardrail_audit` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_data_cost_guardrail_audit_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_data_cost_guardrail_audit_coverage` | Show category coverage ratios and unknown categories. |
| `flag_data_cost_guardrail_audit_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_data_cost_guardrail_audit_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_data_cost_guardrail_audit_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_data_cost_guardrail_audit_baseline` | Compare category counts with the configured baseline. |
| `estimate_data_cost_guardrail_audit_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_data_cost_guardrail_audit_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_data_cost_guardrail_audit_dependencies` | Map dependency groups and show which ones are missing. |
| `test_data_cost_guardrail_audit_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_data_cost_guardrail_audit_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_data_cost_guardrail_audit_fixes` | Rank fixes by impact divided by effort. |
| `validate_data_cost_guardrail_audit_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_data_cost_guardrail_audit_duplicates` | Group items with the same category and normalized name. |
| `measure_data_cost_guardrail_audit_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_data_cost_guardrail_audit_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_data_cost_guardrail_audit_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_data_cost_guardrail_audit_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_data_cost_guardrail_audit_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_data_cost_guardrail_audit_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_data_cost_guardrail_audit_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_data_cost_guardrail_audit_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_data_cost_guardrail_audit_next_steps` | Recommend the next five actions with quick wins. |
| `open_data_cost_guardrail_audit_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
