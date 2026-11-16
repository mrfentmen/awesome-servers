import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "music-mix-balance-cost-mcp",
  "title": "Mix Balance Budget Audit",
  "description": "Audit mix balance budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "mix_balance_budget",
  "entity": "mix element budget line",
  "categories": [
    {
      "id": "drums",
      "label": "Drums",
      "baseline": 3
    },
    {
      "id": "bass",
      "label": "Bass",
      "baseline": 1
    },
    {
      "id": "vocals",
      "label": "Vocals",
      "baseline": 2
    },
    {
      "id": "guitars",
      "label": "Guitars",
      "baseline": 2
    },
    {
      "id": "keys",
      "label": "Keys",
      "baseline": 2
    },
    {
      "id": "fx",
      "label": "FX returns",
      "baseline": 2
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
      "id": "rhythm",
      "label": "Rhythm section",
      "categories": [
        "drums",
        "bass"
      ]
    },
    {
      "id": "lead",
      "label": "Lead vocal",
      "categories": [
        "vocals"
      ]
    },
    {
      "id": "harmony",
      "label": "Harmony instruments",
      "categories": [
        "guitars",
        "keys"
      ]
    },
    {
      "id": "space",
      "label": "Effects space",
      "categories": [
        "fx"
      ]
    }
  ],
  "sample": [
    {
      "id": "mix_balance_budget-kick",
      "name": "Kick",
      "category": "drums",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "mix_balance_budget-snare",
      "name": "Snare",
      "category": "drums",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "mix_balance_budget-bass-di",
      "name": "Bass DI",
      "category": "bass",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "mix_balance_budget-lead-vocal",
      "name": "Lead vocal",
      "category": "vocals",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "mix_balance_budget-harmony-vocal",
      "name": "Harmony vocal",
      "category": "vocals",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "mix_balance_budget-rhythm-guitar",
      "name": "Rhythm guitar",
      "category": "guitars",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "mix_balance_budget-electric-piano",
      "name": "Electric piano",
      "category": "keys",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "mix_balance_budget-reverb-return",
      "name": "Reverb return",
      "category": "fx",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "worn"
    }
  ]
}
