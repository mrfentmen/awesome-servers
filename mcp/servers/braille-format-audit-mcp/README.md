# braille format audit Audit

Real local JSON analysis of braille format audit in the Accessibility & Disability lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/braille-format-audit-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "braille-format-audit-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/braille-format-audit-mcp"]
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
      "id": "access_braille_format_audit-access-1",
      "name": "access primary",
      "category": "access",
      "tags": [
        "accessibility-disability",
        "braille",
        "format"
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
      "id": "access_braille_format_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "accessibility-disability",
        "braille",
        "format"
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
| `inventory_access_braille_format_audit` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_access_braille_format_audit_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_access_braille_format_audit_coverage` | Show category coverage ratios and unknown categories. |
| `flag_access_braille_format_audit_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_access_braille_format_audit_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_access_braille_format_audit_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_access_braille_format_audit_baseline` | Compare category counts with the configured baseline. |
| `estimate_access_braille_format_audit_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_access_braille_format_audit_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_access_braille_format_audit_dependencies` | Map dependency groups and show which ones are missing. |
| `test_access_braille_format_audit_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_access_braille_format_audit_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_access_braille_format_audit_fixes` | Rank fixes by impact divided by effort. |
| `validate_access_braille_format_audit_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_access_braille_format_audit_duplicates` | Group items with the same category and normalized name. |
| `measure_access_braille_format_audit_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_access_braille_format_audit_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_access_braille_format_audit_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_access_braille_format_audit_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_access_braille_format_audit_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_access_braille_format_audit_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_access_braille_format_audit_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_access_braille_format_audit_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_access_braille_format_audit_next_steps` | Recommend the next five actions with quick wins. |
| `open_access_braille_format_audit_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
