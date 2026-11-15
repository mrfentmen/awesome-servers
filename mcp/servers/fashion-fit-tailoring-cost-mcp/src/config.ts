import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fashion-fit-tailoring-cost-mcp",
  "title": "Fit and Tailoring Budget Audit",
  "description": "Audit fit and tailoring budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "fit_tailoring_budget",
  "entity": "garment budget line",
  "categories": [
    {
      "id": "top",
      "label": "Tops",
      "baseline": 3
    },
    {
      "id": "bottom",
      "label": "Bottoms",
      "baseline": 3
    },
    {
      "id": "dress",
      "label": "Dresses",
      "baseline": 2
    },
    {
      "id": "outerwear",
      "label": "Outerwear",
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
    "budget": 400,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "top",
      "label": "Top fit",
      "categories": [
        "top"
      ]
    },
    {
      "id": "bottom",
      "label": "Bottom fit",
      "categories": [
        "bottom"
      ]
    },
    {
      "id": "dress",
      "label": "Dress fit",
      "categories": [
        "dress"
      ]
    },
    {
      "id": "outerwear",
      "label": "Outerwear fit",
      "categories": [
        "outerwear"
      ]
    }
  ],
  "sample": [
    {
      "id": "fit_tailoring_budget-linen-shirt",
      "name": "Linen shirt",
      "category": "top",
      "tags": [
        "budget"
      ],
      "cost": 45,
      "quantity": 45,
      "condition": "good"
    },
    {
      "id": "fit_tailoring_budget-wool-trousers",
      "name": "Wool trousers",
      "category": "bottom",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "good"
    },
    {
      "id": "fit_tailoring_budget-slip-dress",
      "name": "Slip dress",
      "category": "dress",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "fair"
    },
    {
      "id": "fit_tailoring_budget-winter-coat",
      "name": "Winter coat",
      "category": "outerwear",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "fair"
    }
  ]
}
