# Emergency Contact Folder Audit

Audit emergency contact folder by family, doctors, pharmacy, neighbors coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/caregiving-emergency-contact-folder-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "caregiving-emergency-contact-folder-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/caregiving-emergency-contact-folder-check-mcp"]
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
      "id": "caregiving_emergency_contact_folder-family-1",
      "name": "Family primary",
      "category": "family",
      "tags": [
        "caregiving",
        "caregiver",
        "family-care"
      ],
      "cost": 20,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "caregiving_emergency_contact_folder-doctors-2",
      "name": "Doctors primary",
      "category": "doctors",
      "tags": [
        "caregiving",
        "caregiver",
        "family-care"
      ],
      "cost": 35,
      "quantity": 7,
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
| `inventory_caregiving_emergency_contact_folder` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_caregiving_emergency_contact_folder_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_caregiving_emergency_contact_folder_coverage` | Show category coverage ratios and unknown categories. |
| `flag_caregiving_emergency_contact_folder_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_caregiving_emergency_contact_folder_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_caregiving_emergency_contact_folder_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_caregiving_emergency_contact_folder_baseline` | Compare category counts with the configured baseline. |
| `estimate_caregiving_emergency_contact_folder_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_caregiving_emergency_contact_folder_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_caregiving_emergency_contact_folder_dependencies` | Map dependency groups and show which ones are missing. |
| `test_caregiving_emergency_contact_folder_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_caregiving_emergency_contact_folder_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_caregiving_emergency_contact_folder_fixes` | Rank fixes by impact divided by effort. |
| `validate_caregiving_emergency_contact_folder_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_caregiving_emergency_contact_folder_duplicates` | Group items with the same category and normalized name. |
| `measure_caregiving_emergency_contact_folder_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_caregiving_emergency_contact_folder_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_caregiving_emergency_contact_folder_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_caregiving_emergency_contact_folder_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_caregiving_emergency_contact_folder_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_caregiving_emergency_contact_folder_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_caregiving_emergency_contact_folder_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_caregiving_emergency_contact_folder_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_caregiving_emergency_contact_folder_next_steps` | Recommend the next five actions with quick wins. |
| `open_caregiving_emergency_contact_folder_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
