import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "skincare-barrier-repair-cost-mcp",
  "title": "Barrier Repair Budget Audit",
  "description": "Audit barrier repair budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "barrier_repair_budget",
  "entity": "barrier product budget line",
  "categories": [
    {
      "id": "cleanser",
      "label": "Cleansers",
      "baseline": 1
    },
    {
      "id": "ceramide",
      "label": "Ceramides",
      "baseline": 1
    },
    {
      "id": "humectant",
      "label": "Humectants",
      "baseline": 1
    },
    {
      "id": "occlusive",
      "label": "Occlusives",
      "baseline": 2
    },
    {
      "id": "spf",
      "label": "SPF",
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
      "id": "cleanse",
      "label": "Gentle cleansing",
      "categories": [
        "cleanser"
      ]
    },
    {
      "id": "lipid",
      "label": "Lipid repair",
      "categories": [
        "ceramide"
      ]
    },
    {
      "id": "hydrate",
      "label": "Hydration",
      "categories": [
        "humectant"
      ]
    },
    {
      "id": "protect",
      "label": "Sun protection",
      "categories": [
        "spf"
      ]
    }
  ],
  "sample": [
    {
      "id": "barrier_repair_budget-cream-cleanser",
      "name": "Cream cleanser",
      "category": "cleanser",
      "tags": [
        "budget"
      ],
      "cost": 24,
      "quantity": 24,
      "condition": "good"
    },
    {
      "id": "barrier_repair_budget-ceramide-cream",
      "name": "Ceramide cream",
      "category": "ceramide",
      "tags": [
        "budget"
      ],
      "cost": 32,
      "quantity": 32,
      "condition": "good"
    },
    {
      "id": "barrier_repair_budget-hyaluronic-serum",
      "name": "Hyaluronic serum",
      "category": "humectant",
      "tags": [
        "budget"
      ],
      "cost": 28,
      "quantity": 28,
      "condition": "good"
    },
    {
      "id": "barrier_repair_budget-squalane-oil",
      "name": "Squalane oil",
      "category": "occlusive",
      "tags": [
        "budget"
      ],
      "cost": 26,
      "quantity": 26,
      "condition": "good"
    },
    {
      "id": "barrier_repair_budget-spf-40",
      "name": "SPF 40",
      "category": "spf",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "barrier_repair_budget-night-balm",
      "name": "Night balm",
      "category": "occlusive",
      "tags": [
        "budget"
      ],
      "cost": 34,
      "quantity": 34,
      "condition": "good"
    }
  ]
}
