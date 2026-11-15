import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "smart-home-energy-schedule-cost-mcp",
  "title": "Energy Schedule Budget Audit",
  "description": "Audit energy schedule budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "energy_schedule_budget",
  "entity": "scheduled load budget line",
  "categories": [
    {
      "id": "heating",
      "label": "Heating",
      "baseline": 1
    },
    {
      "id": "cooling",
      "label": "Cooling",
      "baseline": 1
    },
    {
      "id": "lighting",
      "label": "Lighting",
      "baseline": 1
    },
    {
      "id": "appliance",
      "label": "Appliances",
      "baseline": 1
    },
    {
      "id": "ev",
      "label": "EV charging",
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
    "budget": 800,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "climate",
      "label": "Climate load",
      "categories": [
        "heating",
        "cooling"
      ]
    },
    {
      "id": "light",
      "label": "Lighting load",
      "categories": [
        "lighting"
      ]
    },
    {
      "id": "appliances",
      "label": "Appliance load",
      "categories": [
        "appliance"
      ]
    },
    {
      "id": "charging",
      "label": "Charging load",
      "categories": [
        "ev"
      ]
    }
  ],
  "sample": [
    {
      "id": "energy_schedule_budget-heat-pump-morning",
      "name": "Heat pump morning",
      "category": "heating",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "energy_schedule_budget-ac-evening",
      "name": "AC evening",
      "category": "cooling",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "energy_schedule_budget-porch-lighting",
      "name": "Porch lighting",
      "category": "lighting",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "good"
    },
    {
      "id": "energy_schedule_budget-dishwasher",
      "name": "Dishwasher",
      "category": "appliance",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "energy_schedule_budget-ev-charger",
      "name": "EV charger",
      "category": "ev",
      "tags": [
        "budget"
      ],
      "cost": 600,
      "quantity": 600,
      "condition": "worn"
    },
    {
      "id": "energy_schedule_budget-dryer",
      "name": "Dryer",
      "category": "appliance",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    }
  ]
}
