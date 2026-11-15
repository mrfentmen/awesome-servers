import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "gardening-pest-watch-cost-mcp",
  "title": "Pest Watch Budget Audit",
  "description": "Audit pest watch budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "pest_watch_budget",
  "entity": "pest check budget line",
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
      "id": "pest_watch_budget-rose-aphids",
      "name": "Rose aphids",
      "category": "aphid",
      "tags": [
        "budget"
      ],
      "cost": 18,
      "quantity": 18,
      "condition": "good"
    },
    {
      "id": "pest_watch_budget-hosta-slugs",
      "name": "Hosta slugs",
      "category": "slug",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "pest_watch_budget-tomato-mites",
      "name": "Tomato mites",
      "category": "mite",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "good"
    },
    {
      "id": "pest_watch_budget-cabbage-caterpillars",
      "name": "Cabbage caterpillars",
      "category": "caterpillar",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "condition": "good"
    },
    {
      "id": "pest_watch_budget-ladybird-habitat",
      "name": "Ladybird habitat",
      "category": "beneficial",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "pest_watch_budget-companion-flowers",
      "name": "Companion flowers",
      "category": "beneficial",
      "tags": [
        "budget"
      ],
      "cost": 14,
      "quantity": 14,
      "condition": "good"
    }
  ]
}
