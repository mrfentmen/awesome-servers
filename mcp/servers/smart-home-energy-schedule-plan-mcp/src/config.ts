import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "smart-home-energy-schedule-plan-mcp",
  "title": "Energy Schedule Planning Audit",
  "description": "Plan energy schedule by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "energy_schedule_plan",
  "entity": "scheduled load plan",
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
    "id": "peak_kw",
    "label": "Peak demand",
    "unit": "kW",
    "target": 4,
    "direction": "lower"
  },
  "target": {
    "maxItems": 25,
    "budget": 1200,
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
      "id": "energy_schedule_plan-heat",
      "name": "Heat pump morning",
      "category": "heating",
      "tags": [
        "heat-pump",
        "morning"
      ],
      "cost": 0,
      "quantity": 3.2,
      "condition": "good"
    },
    {
      "id": "energy_schedule_plan-cool",
      "name": "AC evening",
      "category": "cooling",
      "tags": [
        "ac",
        "evening"
      ],
      "cost": 0,
      "quantity": 4.8,
      "condition": "fair"
    },
    {
      "id": "energy_schedule_plan-lights",
      "name": "Porch lighting",
      "category": "lighting",
      "tags": [
        "led",
        "sunset"
      ],
      "cost": 40,
      "quantity": 0.3,
      "condition": "good"
    },
    {
      "id": "energy_schedule_plan-dishwasher",
      "name": "Dishwasher",
      "category": "appliance",
      "tags": [
        "delay",
        "night"
      ],
      "cost": 0,
      "quantity": 1.8,
      "condition": "good"
    },
    {
      "id": "energy_schedule_plan-ev",
      "name": "EV charger",
      "category": "ev",
      "tags": [
        "overnight",
        "7kw"
      ],
      "cost": 600,
      "quantity": 7,
      "condition": "worn"
    },
    {
      "id": "energy_schedule_plan-dryer",
      "name": "Dryer",
      "category": "appliance",
      "tags": [
        "afternoon"
      ],
      "cost": 0,
      "quantity": 5.5,
      "condition": "fair"
    }
  ]
}
