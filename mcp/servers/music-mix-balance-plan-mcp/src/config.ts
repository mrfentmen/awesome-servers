import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "music-mix-balance-plan-mcp",
  "title": "Mix Balance Planning Audit",
  "description": "Plan mix balance by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "mix_balance_plan",
  "entity": "mix element plan",
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
    "id": "balance_deviation_db",
    "label": "Balance deviation",
    "unit": "dB",
    "target": 2,
    "direction": "lower"
  },
  "target": {
    "maxItems": 24,
    "budget": 300,
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
      "id": "mix_balance_plan-kick",
      "name": "Kick",
      "category": "drums",
      "tags": [
        "center",
        "low"
      ],
      "cost": 0,
      "quantity": 0.8,
      "condition": "good"
    },
    {
      "id": "mix_balance_plan-snare",
      "name": "Snare",
      "category": "drums",
      "tags": [
        "center",
        "mid"
      ],
      "cost": 0,
      "quantity": 1.2,
      "condition": "good"
    },
    {
      "id": "mix_balance_plan-bass",
      "name": "Bass DI",
      "category": "bass",
      "tags": [
        "mono",
        "low"
      ],
      "cost": 0,
      "quantity": 1.6,
      "condition": "good"
    },
    {
      "id": "mix_balance_plan-lead-vocal",
      "name": "Lead vocal",
      "category": "vocals",
      "tags": [
        "compressed",
        "center"
      ],
      "cost": 0,
      "quantity": 0.4,
      "condition": "good"
    },
    {
      "id": "mix_balance_plan-harmony",
      "name": "Harmony vocal",
      "category": "vocals",
      "tags": [
        "wide",
        "quiet"
      ],
      "cost": 0,
      "quantity": 2.8,
      "condition": "fair"
    },
    {
      "id": "mix_balance_plan-guitar",
      "name": "Rhythm guitar",
      "category": "guitars",
      "tags": [
        "double",
        "wide"
      ],
      "cost": 0,
      "quantity": 1.9,
      "condition": "good"
    },
    {
      "id": "mix_balance_plan-keys",
      "name": "Electric piano",
      "category": "keys",
      "tags": [
        "stereo",
        "warm"
      ],
      "cost": 0,
      "quantity": 2.6,
      "condition": "fair"
    },
    {
      "id": "mix_balance_plan-reverb",
      "name": "Reverb return",
      "category": "fx",
      "tags": [
        "space",
        "parallel"
      ],
      "cost": 0,
      "quantity": 3.5,
      "condition": "worn"
    }
  ]
}
