import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "gardening-container-water-cost-mcp",
  "title": "Container Water Budget Audit",
  "description": "Audit container water budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "container_water_budget",
  "entity": "container planting budget line",
  "categories": [
    {
      "id": "pot",
      "label": "Pots",
      "baseline": 2
    },
    {
      "id": "basket",
      "label": "Baskets",
      "baseline": 1
    },
    {
      "id": "trough",
      "label": "Troughs",
      "baseline": 1
    },
    {
      "id": "herb",
      "label": "Herbs",
      "baseline": 1
    },
    {
      "id": "tropical",
      "label": "Tropicals",
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
    "budget": 150,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "pots",
      "label": "Pot watering",
      "categories": [
        "pot"
      ]
    },
    {
      "id": "baskets",
      "label": "Basket watering",
      "categories": [
        "basket"
      ]
    },
    {
      "id": "troughs",
      "label": "Trough watering",
      "categories": [
        "trough"
      ]
    },
    {
      "id": "herbs",
      "label": "Herb watering",
      "categories": [
        "herb"
      ]
    }
  ],
  "sample": [
    {
      "id": "container_water_budget-terracotta-pot",
      "name": "Terracotta pot",
      "category": "pot",
      "tags": [
        "budget"
      ],
      "cost": 18,
      "quantity": 18,
      "condition": "good"
    },
    {
      "id": "container_water_budget-succulent-pot",
      "name": "Succulent pot",
      "category": "pot",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "container_water_budget-hanging-basket",
      "name": "Hanging basket",
      "category": "basket",
      "tags": [
        "budget"
      ],
      "cost": 22,
      "quantity": 22,
      "condition": "fair"
    },
    {
      "id": "container_water_budget-window-trough",
      "name": "Window trough",
      "category": "trough",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "container_water_budget-basil-pot",
      "name": "Basil pot",
      "category": "herb",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "container_water_budget-fern",
      "name": "Fern",
      "category": "tropical",
      "tags": [
        "budget"
      ],
      "cost": 16,
      "quantity": 16,
      "condition": "good"
    }
  ]
}
