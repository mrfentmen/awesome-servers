import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "dogs-dog-enrichment-check-mcp",
  "title": "Dog Enrichment Audit",
  "description": "Audit dog toys, puzzles, chews and walks for enrichment minutes and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "dog_enrichment",
  "entity": "enrichment item",
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
    "id": "service_gap",
    "label": "Enrichment minutes",
    "unit": "minutes",
    "target": 30,
    "direction": "higher"
  },
  "target": {
    "maxItems": 15,
    "budget": 100,
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
      "id": "dog-toy",
      "name": "Fetch ball",
      "category": "toy",
      "tags": [
        "outdoor"
      ],
      "cost": 8,
      "quantity": 45,
      "condition": "good"
    },
    {
      "id": "dog-puzzle",
      "name": "Treat puzzle",
      "category": "puzzle",
      "tags": [
        "indoor"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "dog-chew",
      "name": "Dental chew",
      "category": "chew",
      "tags": [
        "dental"
      ],
      "cost": 12,
      "quantity": 30,
      "condition": "new"
    },
    {
      "id": "dog-walk",
      "name": "Sniff walk",
      "category": "walk",
      "tags": [
        "outdoor"
      ],
      "cost": 0,
      "quantity": 60,
      "condition": "good"
    }
  ]
}
