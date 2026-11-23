# Resume Bullet Writer Planner

Real local JSON analysis of resume bullet writer in the Career Ladder lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/resume-bullet-writer-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "resume-bullet-writer-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/resume-bullet-writer-mcp"]
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
      "id": "career_ladder_resume_bullet_writer-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "career-ladder",
        "resume",
        "bullet"
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
      "id": "career_ladder_resume_bullet_writer-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "career-ladder",
        "resume",
        "bullet"
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
| `inventory_career_ladder_resume_bullet_writer` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_career_ladder_resume_bullet_writer_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_career_ladder_resume_bullet_writer_coverage` | Show category coverage ratios and unknown categories. |
| `flag_career_ladder_resume_bullet_writer_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_career_ladder_resume_bullet_writer_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_career_ladder_resume_bullet_writer_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_career_ladder_resume_bullet_writer_baseline` | Compare category counts with the configured baseline. |
| `estimate_career_ladder_resume_bullet_writer_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_career_ladder_resume_bullet_writer_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_career_ladder_resume_bullet_writer_dependencies` | Map dependency groups and show which ones are missing. |
| `test_career_ladder_resume_bullet_writer_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_career_ladder_resume_bullet_writer_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_career_ladder_resume_bullet_writer_fixes` | Rank fixes by impact divided by effort. |
| `validate_career_ladder_resume_bullet_writer_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_career_ladder_resume_bullet_writer_duplicates` | Group items with the same category and normalized name. |
| `measure_career_ladder_resume_bullet_writer_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_career_ladder_resume_bullet_writer_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_career_ladder_resume_bullet_writer_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_career_ladder_resume_bullet_writer_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_career_ladder_resume_bullet_writer_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_career_ladder_resume_bullet_writer_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_career_ladder_resume_bullet_writer_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_career_ladder_resume_bullet_writer_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_career_ladder_resume_bullet_writer_next_steps` | Recommend the next five actions with quick wins. |
| `open_career_ladder_resume_bullet_writer_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
