import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "gardening-pest-watch-check-mcp",
  "title": "Pest Watch Audit",
  "description": "Audit pest watch by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "pest_watch",
  "entity": "pest check",
  "categories": [
    {
      "id": "aphid",
      "label": "Aphids",
      "baseline": 1
    },
    {
      "id": "slug",
      "label": "Slugs",
      "baseline": 1
    },
    {
      "id": "mite",
      "label": "Mites",
      "baseline": 1
    },
    {
      "id": "caterpillar",
      "label": "Caterpillars",
      "baseline": 1
    },
    {
      "id": "beneficial",
      "label": "Beneficials",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "untreated_spots",
    "label": "Untreated spots",
    "unit": "spots",
    "target": 0,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 120,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "foliage",
      "label": "Foliage pests",
      "categories": [
        "aphid",
        "mite"
      ]
    },
    {
      "id": "soil",
      "label": "Soil pests",
      "categories": [
        "slug"
      ]
    },
    {
      "id": "fruit",
      "label": "Fruit pests",
      "categories": [
        "caterpillar"
      ]
    },
    {
      "id": "habitat",
      "label": "Beneficial habitat",
      "categories": [
        "beneficial"
      ]
    }
  ],
  "sample": [
    {
      "id": "pest_watch-rose",
      "name": "Rose aphids",
      "category": "aphid",
      "tags": [
        "rose",
        "foliage"
      ],
      "cost": 18,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "pest_watch-hosta",
      "name": "Hosta slugs",
      "category": "slug",
      "tags": [
        "hosta",
        "shade"
      ],
      "cost": 12,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "pest_watch-tomato",
      "name": "Tomato mites",
      "category": "mite",
      "tags": [
        "tomato",
        "greenhouse"
      ],
      "cost": 15,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "pest_watch-cabbage",
      "name": "Cabbage caterpillars",
      "category": "caterpillar",
      "tags": [
        "cabbage",
        "leaf"
      ],
      "cost": 10,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "pest_watch-ladybird",
      "name": "Ladybird habitat",
      "category": "beneficial",
      "tags": [
        "predator",
        "flowers"
      ],
      "cost": 20,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "pest_watch-flowers",
      "name": "Companion flowers",
      "category": "beneficial",
      "tags": [
        "nectar",
        "border"
      ],
      "cost": 14,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
