# Deposit Recovery Audit

Audit deposit recovery by amount, photos, notice, deductions coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/tenant-deposit-recovery-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "tenant-deposit-recovery-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/tenant-deposit-recovery-check-mcp"]
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
      "id": "tenant_deposit_recovery-amount-1",
      "name": "Amount primary",
      "category": "amount",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_deposit_recovery-photos-2",
      "name": "Photos primary",
      "category": "photos",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
| `inventory_tenant_deposit_recovery` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_tenant_deposit_recovery_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_tenant_deposit_recovery_coverage` | Show category coverage ratios and unknown categories. |
| `flag_tenant_deposit_recovery_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_tenant_deposit_recovery_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_tenant_deposit_recovery_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_tenant_deposit_recovery_baseline` | Compare category counts with the configured baseline. |
| `estimate_tenant_deposit_recovery_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_tenant_deposit_recovery_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_tenant_deposit_recovery_dependencies` | Map dependency groups and show which ones are missing. |
| `test_tenant_deposit_recovery_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_tenant_deposit_recovery_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_tenant_deposit_recovery_fixes` | Rank fixes by impact divided by effort. |
| `validate_tenant_deposit_recovery_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_tenant_deposit_recovery_duplicates` | Group items with the same category and normalized name. |
| `measure_tenant_deposit_recovery_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_tenant_deposit_recovery_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_tenant_deposit_recovery_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_tenant_deposit_recovery_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_tenant_deposit_recovery_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_tenant_deposit_recovery_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_tenant_deposit_recovery_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_tenant_deposit_recovery_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_tenant_deposit_recovery_next_steps` | Recommend the next five actions with quick wins. |
| `open_tenant_deposit_recovery_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
