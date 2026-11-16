import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "music-setlist-pacing-cost-mcp",
  "title": "Setlist Pacing Budget Audit",
  "description": "Audit setlist pacing budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "setlist_pacing_budget",
  "entity": "setlist song budget line",
  "categories": [
    {
      "id": "opener",
      "label": "Openers",
      "baseline": 2
    },
    {
      "id": "peak",
      "label": "Peaks",
      "baseline": 3
    },
    {
      "id": "ballad",
      "label": "Ballads",
      "baseline": 2
    },
    {
      "id": "encore",
      "label": "Encores",
      "baseline": 2
    },
    {
      "id": "break",
      "label": "Breaks",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 100,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "start",
      "label": "Strong start",
      "categories": [
        "opener"
      ]
    },
    {
      "id": "peak",
      "label": "Energy peak",
      "categories": [
        "peak"
      ]
    },
    {
      "id": "breather",
      "label": "Mid-set breather",
      "categories": [
        "ballad",
        "break"
      ]
    },
    {
      "id": "close",
      "label": "Closer",
      "categories": [
        "encore"
      ]
    }
  ],
  "sample": [
    {
      "id": "setlist_pacing_budget-opening-anthem",
      "name": "Opening anthem",
      "category": "opener",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "setlist_pacing_budget-second-song",
      "name": "Second song",
      "category": "opener",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "setlist_pacing_budget-first-peak",
      "name": "First peak",
      "category": "peak",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "setlist_pacing_budget-second-peak",
      "name": "Second peak",
      "category": "peak",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "setlist_pacing_budget-mid-set-ballad",
      "name": "Mid-set ballad",
      "category": "ballad",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "setlist_pacing_budget-band-introduction",
      "name": "Band introduction",
      "category": "break",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "setlist_pacing_budget-encore",
      "name": "Encore",
      "category": "encore",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "setlist_pacing_budget-closing-song",
      "name": "Closing song",
      "category": "encore",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    }
  ]
}
