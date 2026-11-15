import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "landscaping-lawn-water-cost-mcp",
  "title": "Lawn Water Budget Audit",
  "description": "Audit lawn water budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "lawn_water_budget",
  "entity": "watering zone budget line",
  "categories": [
    {
      "id": "lawn",
      "label": "Lawn",
      "baseline": 2
    },
    {
      "id": "bed",
      "label": "Beds",
      "baseline": 1
    },
    {
      "id": "container",
      "label": "Containers",
      "baseline": 1
    },
    {
      "id": "tree",
      "label": "Trees",
      "baseline": 1
    },
    {
      "id": "irrigation",
      "label": "Irrigation",
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
    "budget": 250,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "lawn",
      "label": "Lawn coverage",
      "categories": [
        "lawn"
      ]
    },
    {
      "id": "beds",
      "label": "Bed coverage",
      "categories": [
        "bed"
      ]
    },
    {
      "id": "containers",
      "label": "Container coverage",
      "categories": [
        "container"
      ]
    },
    {
      "id": "trees",
      "label": "Tree coverage",
      "categories": [
        "tree"
      ]
    }
  ],
  "sample": [
    {
      "id": "lawn_water_budget-front-lawn",
      "name": "Front lawn",
      "category": "lawn",
      "tags": [
        "budget"
      ],
      "cost": 18,
      "quantity": 18,
      "condition": "good"
    },
    {
      "id": "lawn_water_budget-side-lawn",
      "name": "Side lawn",
      "category": "lawn",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "lawn_water_budget-flower-bed",
      "name": "Flower bed",
      "category": "bed",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "lawn_water_budget-patio-pots",
      "name": "Patio pots",
      "category": "container",
      "tags": [
        "budget"
      ],
      "cost": 5,
      "quantity": 5,
      "condition": "good"
    },
    {
      "id": "lawn_water_budget-maple-tree",
      "name": "Maple tree",
      "category": "tree",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "condition": "good"
    },
    {
      "id": "lawn_water_budget-drip-line",
      "name": "Drip line",
      "category": "irrigation",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "good"
    }
  ]
}
