import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "dogs-dog-enrichment-cost-mcp",
  "title": "Dog Enrichment Budget Audit",
  "description": "Audit dog enrichment budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "dog_enrichment_budget",
  "entity": "enrichment item budget line",
  "categories": [
    {
      "id": "toy",
      "label": "Toys",
      "baseline": 3
    },
    {
      "id": "puzzle",
      "label": "Puzzles",
      "baseline": 2
    },
    {
      "id": "chew",
      "label": "Chews",
      "baseline": 2
    },
    {
      "id": "walk",
      "label": "Walks",
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
    "budget": 50,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "toy",
      "label": "Toy rotation",
      "categories": [
        "toy"
      ]
    },
    {
      "id": "puzzle",
      "label": "Puzzle",
      "categories": [
        "puzzle"
      ]
    },
    {
      "id": "chew",
      "label": "Chew",
      "categories": [
        "chew"
      ]
    },
    {
      "id": "walk",
      "label": "Walk",
      "categories": [
        "walk"
      ]
    }
  ],
  "sample": [
    {
      "id": "dog_enrichment_budget-fetch-ball",
      "name": "Fetch ball",
      "category": "toy",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "dog_enrichment_budget-treat-puzzle",
      "name": "Treat puzzle",
      "category": "puzzle",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "dog_enrichment_budget-dental-chew",
      "name": "Dental chew",
      "category": "chew",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "new"
    },
    {
      "id": "dog_enrichment_budget-sniff-walk",
      "name": "Sniff walk",
      "category": "walk",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
