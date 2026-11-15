import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cats-multi-cat-cost-mcp",
  "title": "Multi-Cat Tension Budget Audit",
  "description": "Audit multi-cat tension budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "multi_cat_budget",
  "entity": "multi-cat resource budget line",
  "categories": [
    {
      "id": "food",
      "label": "Feeding",
      "baseline": 2
    },
    {
      "id": "litter",
      "label": "Litter",
      "baseline": 2
    },
    {
      "id": "perch",
      "label": "Perches",
      "baseline": 1
    },
    {
      "id": "play",
      "label": "Play",
      "baseline": 1
    },
    {
      "id": "separation",
      "label": "Separation",
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
    "budget": 300,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "feeding",
      "label": "Feeding stations",
      "categories": [
        "food"
      ]
    },
    {
      "id": "elimination",
      "label": "Litter stations",
      "categories": [
        "litter"
      ]
    },
    {
      "id": "vertical",
      "label": "Vertical space",
      "categories": [
        "perch"
      ]
    },
    {
      "id": "play",
      "label": "Shared play",
      "categories": [
        "play"
      ]
    },
    {
      "id": "retreat",
      "label": "Retreat space",
      "categories": [
        "separation"
      ]
    }
  ],
  "sample": [
    {
      "id": "multi_cat_budget-separate-feeding-station",
      "name": "Separate feeding station",
      "category": "food",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "fair"
    },
    {
      "id": "multi_cat_budget-litter-box-one",
      "name": "Litter box one",
      "category": "litter",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "multi_cat_budget-litter-box-two",
      "name": "Litter box two",
      "category": "litter",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "multi_cat_budget-shared-cat-tree",
      "name": "Shared cat tree",
      "category": "perch",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "fair"
    },
    {
      "id": "multi_cat_budget-group-wand-play",
      "name": "Group wand play",
      "category": "play",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "multi_cat_budget-separation-gate",
      "name": "Separation gate",
      "category": "separation",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    }
  ]
}
