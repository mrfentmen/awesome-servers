import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "music-setlist-pacing-plan-mcp",
  "title": "Setlist Pacing Planning Audit",
  "description": "Plan setlist pacing by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "setlist_pacing_plan",
  "entity": "setlist song plan",
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
    "id": "energy_score",
    "label": "Energy score",
    "unit": "points",
    "target": 7,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 120,
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
      "id": "setlist_pacing_plan-open",
      "name": "Opening anthem",
      "category": "opener",
      "tags": [
        "fast",
        "familiar"
      ],
      "cost": 0,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "setlist_pacing_plan-second",
      "name": "Second song",
      "category": "opener",
      "tags": [
        "mid-tempo",
        "single"
      ],
      "cost": 0,
      "quantity": 7,
      "condition": "good"
    },
    {
      "id": "setlist_pacing_plan-peak-one",
      "name": "First peak",
      "category": "peak",
      "tags": [
        "fast",
        "singalong"
      ],
      "cost": 0,
      "quantity": 9,
      "condition": "good"
    },
    {
      "id": "setlist_pacing_plan-peak-two",
      "name": "Second peak",
      "category": "peak",
      "tags": [
        "fast",
        "dance"
      ],
      "cost": 0,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "setlist_pacing_plan-slow",
      "name": "Mid-set ballad",
      "category": "ballad",
      "tags": [
        "slow",
        "quiet"
      ],
      "cost": 0,
      "quantity": 4,
      "condition": "fair"
    },
    {
      "id": "setlist_pacing_plan-break",
      "name": "Band introduction",
      "category": "break",
      "tags": [
        "spoken",
        "short"
      ],
      "cost": 0,
      "quantity": 3,
      "condition": "good"
    },
    {
      "id": "setlist_pacing_plan-encore",
      "name": "Encore",
      "category": "encore",
      "tags": [
        "fast",
        "favorite"
      ],
      "cost": 0,
      "quantity": 9,
      "condition": "good"
    },
    {
      "id": "setlist_pacing_plan-close",
      "name": "Closing song",
      "category": "encore",
      "tags": [
        "slow",
        "big"
      ],
      "cost": 0,
      "quantity": 6,
      "condition": "fair"
    }
  ]
}
