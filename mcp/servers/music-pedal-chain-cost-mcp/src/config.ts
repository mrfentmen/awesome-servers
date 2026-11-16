import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "music-pedal-chain-cost-mcp",
  "title": "Pedal Chain Budget Audit",
  "description": "Audit pedal chain budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "pedal_chain_budget",
  "entity": "pedal budget line",
  "categories": [
    {
      "id": "drive",
      "label": "Drive",
      "baseline": 2
    },
    {
      "id": "modulation",
      "label": "Modulation",
      "baseline": 2
    },
    {
      "id": "delay",
      "label": "Delay",
      "baseline": 1
    },
    {
      "id": "reverb",
      "label": "Reverb",
      "baseline": 1
    },
    {
      "id": "utility",
      "label": "Utility",
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
    "budget": 1500,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "gain",
      "label": "Gain stage",
      "categories": [
        "drive"
      ]
    },
    {
      "id": "modulation",
      "label": "Modulation stage",
      "categories": [
        "modulation"
      ]
    },
    {
      "id": "time",
      "label": "Time effects",
      "categories": [
        "delay",
        "reverb"
      ]
    },
    {
      "id": "utility",
      "label": "Utility stage",
      "categories": [
        "utility"
      ]
    }
  ],
  "sample": [
    {
      "id": "pedal_chain_budget-overdrive",
      "name": "Overdrive",
      "category": "drive",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "good"
    },
    {
      "id": "pedal_chain_budget-fuzz",
      "name": "Fuzz",
      "category": "drive",
      "tags": [
        "budget"
      ],
      "cost": 150,
      "quantity": 150,
      "condition": "fair"
    },
    {
      "id": "pedal_chain_budget-chorus",
      "name": "Chorus",
      "category": "modulation",
      "tags": [
        "budget"
      ],
      "cost": 180,
      "quantity": 180,
      "condition": "good"
    },
    {
      "id": "pedal_chain_budget-phaser",
      "name": "Phaser",
      "category": "modulation",
      "tags": [
        "budget"
      ],
      "cost": 140,
      "quantity": 140,
      "condition": "good"
    },
    {
      "id": "pedal_chain_budget-analog-delay",
      "name": "Analog delay",
      "category": "delay",
      "tags": [
        "budget"
      ],
      "cost": 170,
      "quantity": 170,
      "condition": "good"
    },
    {
      "id": "pedal_chain_budget-plate-reverb",
      "name": "Plate reverb",
      "category": "reverb",
      "tags": [
        "budget"
      ],
      "cost": 220,
      "quantity": 220,
      "condition": "fair"
    },
    {
      "id": "pedal_chain_budget-tuner",
      "name": "Tuner",
      "category": "utility",
      "tags": [
        "budget"
      ],
      "cost": 100,
      "quantity": 100,
      "condition": "good"
    },
    {
      "id": "pedal_chain_budget-power-supply",
      "name": "Power supply",
      "category": "utility",
      "tags": [
        "budget"
      ],
      "cost": 160,
      "quantity": 160,
      "condition": "worn"
    }
  ]
}
