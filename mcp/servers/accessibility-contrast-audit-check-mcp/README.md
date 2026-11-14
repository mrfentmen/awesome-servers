# Contrast Audit

Audit UI contrast ratios for text, icons, buttons and form controls against a 4.5:1 target. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/accessibility-contrast-audit-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "accessibility-contrast-audit-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/accessibility-contrast-audit-check-mcp"]
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
      "id": "contrast-body",
      "name": "Body text",
      "category": "text",
      "tags": [
        "paragraph"
      ],
      "quantity": 7.2,
      "condition": "good"
    },
    {
      "id": "contrast-muted",
      "name": "Muted text",
      "category": "text",
      "tags": [
        "secondary"
      ],
      "quantity": 4.6,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_contrast_audit` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_contrast_audit_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_contrast_audit_coverage` | Show category coverage ratios and unknown categories. |
| `flag_contrast_audit_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_contrast_audit_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_contrast_audit_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_contrast_audit_baseline` | Compare category counts with the configured baseline. |
| `estimate_contrast_audit_contrast_ratio` | Calculate the primary metric for every item with mean and pass count. |
| `find_contrast_audit_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_contrast_audit_dependencies` | Map dependency groups and show which ones are missing. |
| `test_contrast_audit_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_contrast_audit_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_contrast_audit_fixes` | Rank fixes by impact divided by effort. |
| `validate_contrast_audit_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_contrast_audit_duplicates` | Group items with the same category and normalized name. |
| `measure_contrast_audit_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_contrast_audit_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_contrast_audit_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_contrast_audit_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_contrast_audit_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_contrast_audit_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_contrast_audit_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_contrast_audit_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_contrast_audit_next_steps` | Recommend the next five actions with quick wins. |
| `open_contrast_audit_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
