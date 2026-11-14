# Fashion Capsule Wardrobe Check MCP

Audit a capsule wardrobe from a JSON list. Find missing categories, season holes, dress-code gaps, high cost per wear, duplicates, worn pieces, benchmark fit and next actions.

No network calls. No paid API. No licence key. Everything runs locally.

## Install

```bash
npx -y @mrfentmen/fashion-capsule-wardrobe-check-mcp
```

Or in an MCP client:

```json
{
  "mcpServers": {
    "fashion-capsule-wardrobe-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/fashion-capsule-wardrobe-check-mcp"]
    }
  }
}
```

## Input

Pass one of `items`, `content` or `path`.

```json
{
  "items": [
    {
      "id": "tee-white",
      "name": "White tee",
      "category": "top",
      "color": "white",
      "season": ["all"],
      "formality": "casual",
      "cost": 20,
      "wearCount": 20,
      "lastWorn": "2026-11-01",
      "condition": "good"
    }
  ],
  "target": {
    "seasons": ["all"],
    "dressCodes": ["casual", "smart-casual", "business", "formal"],
    "maxItems": 30,
    "budget": 1500,
    "targetCpw": 10,
    "laundryDays": 7
  }
}
```

Categories: `top`, `bottom`, `dress`, `outerwear`, `shoes`, `accessory`, `underwear`, `activewear`, `other`.

Seasons: `spring`, `summer`, `fall`, `winter`, `all`.

## Tools

| Tool | What it does |
|---|---|
| `inventory_capsule_wardrobe` | Count by category, season, dress code and color. |
| `score_capsule_wardrobe_readiness` | Score readiness from 0 to 100. |
| `audit_capsule_wardrobe_coverage` | Show coverage ratios and raw counts. |
| `flag_capsule_wardrobe_gaps` | List missing categories, seasons and dress codes. |
| `rank_capsule_wardrobe_risks` | Rank missing essentials, high CPW, worn items and data gaps. |
| `check_capsule_wardrobe_constraints` | Check item cap, budget, seasons, dress codes and laundry buffer. |
| `compare_capsule_wardrobe_baseline` | Compare counts with the 30-item baseline. |
| `estimate_capsule_wardrobe_cost_per_wear` | Calculate cost per wear for every item. |
| `find_capsule_wardrobe_quick_wins` | Find low-effort, high-impact fixes. |
| `map_capsule_wardrobe_dependencies` | Map outfit prerequisites and outfit capacity. |
| `test_capsule_wardrobe_edge_cases` | Test empty, single-item, duplicate, zero-cost and future-date cases. |
| `summarize_capsule_wardrobe_findings` | Summarize headline findings. |
| `prioritize_capsule_wardrobe_fixes` | Rank fixes by impact and effort. |
| `validate_capsule_wardrobe_inputs` | Validate JSON and report schema issues. |
| `detect_capsule_wardrobe_duplicates` | Group duplicate items by name, category and color. |
| `measure_capsule_wardrobe_variance` | Measure CPW spread, category variance and color diversity. |
| `benchmark_capsule_wardrobe_options` | Compare lean, balanced and full capsule sizes. |
| `explain_capsule_wardrobe_tradeoffs` | Explain size, cost, palette, season and laundry tradeoffs. |
| `draft_capsule_wardrobe_checklist` | Draft a practical checklist from gaps and risks. |
| `export_capsule_wardrobe_audit` | Export the full audit as JSON. |
| `track_capsule_wardrobe_changes` | Compare two wardrobe snapshots. |
| `review_capsule_wardrobe_history` | Review dated snapshots and show trends. |
| `score_capsule_wardrobe_confidence` | Score how much the audit can be trusted. |
| `recommend_capsule_wardrobe_next_steps` | Return the next five actions. |
| `open_capsule_wardrobe_questions` | List questions that block a better audit. |

## Run locally

```bash
npm install
npm run build
npm test
node dist/index.js
```

## Safety

The server reads local JSON only. Treat file paths and wardrobe data as trusted input. Invalid items are reported, never silently repaired. Missing cost or wear data lowers the confidence score.
