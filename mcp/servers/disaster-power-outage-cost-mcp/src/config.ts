import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "disaster-power-outage-cost-mcp",
  "title": "Power Outage Budget Audit",
  "description": "Audit power outage budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "power_outage_budget",
  "entity": "outage item budget line",
  "categories": [
    {
      "id": "light",
      "label": "Lighting",
      "baseline": 2
    },
    {
      "id": "power",
      "label": "Power banks",
      "baseline": 3
    },
    {
      "id": "comms",
      "label": "Communication",
      "baseline": 2
    },
    {
      "id": "food",
      "label": "Food",
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
    "budget": 200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "light",
      "label": "Lighting",
      "categories": [
        "light"
      ]
    },
    {
      "id": "power",
      "label": "Power",
      "categories": [
        "power"
      ]
    },
    {
      "id": "comms",
      "label": "Communication",
      "categories": [
        "comms"
      ]
    }
  ],
  "sample": [
    {
      "id": "power_outage_budget-rechargeable-lamp",
      "name": "Rechargeable lamp",
      "category": "light",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "new"
    },
    {
      "id": "power_outage_budget-headlamp",
      "name": "Headlamp",
      "category": "light",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "power_outage_budget-power-bank",
      "name": "Power bank",
      "category": "power",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "fair"
    },
    {
      "id": "power_outage_budget-battery-radio",
      "name": "Battery radio",
      "category": "comms",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "fair"
    },
    {
      "id": "power_outage_budget-camp-stove",
      "name": "Camp stove",
      "category": "food",
      "tags": [
        "budget"
      ],
      "cost": 50,
      "quantity": 50,
      "condition": "good"
    }
  ]
}
