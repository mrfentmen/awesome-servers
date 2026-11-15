import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wardrobe-laundry-cycle-cost-mcp",
  "title": "Laundry Cycle Budget Audit",
  "description": "Audit laundry cycle budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "laundry_cycle_budget",
  "entity": "laundry item budget line",
  "categories": [
    {
      "id": "top",
      "label": "Tops",
      "baseline": 4
    },
    {
      "id": "bottom",
      "label": "Bottoms",
      "baseline": 3
    },
    {
      "id": "underwear",
      "label": "Underwear",
      "baseline": 6
    },
    {
      "id": "activewear",
      "label": "Activewear",
      "baseline": 3
    },
    {
      "id": "towel",
      "label": "Towels",
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
    "budget": 350,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "lights",
      "label": "Light wash",
      "categories": [
        "top"
      ]
    },
    {
      "id": "darks",
      "label": "Dark wash",
      "categories": [
        "bottom"
      ]
    },
    {
      "id": "hygiene",
      "label": "Hygiene wash",
      "categories": [
        "underwear"
      ]
    },
    {
      "id": "towels",
      "label": "Towel load",
      "categories": [
        "towel"
      ]
    }
  ],
  "sample": [
    {
      "id": "laundry_cycle_budget-cotton-tee",
      "name": "Cotton tee",
      "category": "top",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "laundry_cycle_budget-work-shirt",
      "name": "Work shirt",
      "category": "top",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "good"
    },
    {
      "id": "laundry_cycle_budget-denim-jeans",
      "name": "Denim jeans",
      "category": "bottom",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "good"
    },
    {
      "id": "laundry_cycle_budget-training-leggings",
      "name": "Training leggings",
      "category": "activewear",
      "tags": [
        "budget"
      ],
      "cost": 45,
      "quantity": 45,
      "condition": "fair"
    },
    {
      "id": "laundry_cycle_budget-cotton-socks",
      "name": "Cotton socks",
      "category": "underwear",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "laundry_cycle_budget-bath-towel",
      "name": "Bath towel",
      "category": "towel",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "good"
    }
  ]
}
