import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "sports-tennis-string-cost-mcp",
  "title": "Tennis String Budget Audit",
  "description": "Audit tennis string budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "tennis_string_budget",
  "entity": "tennis item budget line",
  "categories": [
    {
      "id": "racquet",
      "label": "Racquets",
      "baseline": 2
    },
    {
      "id": "string",
      "label": "Strings",
      "baseline": 2
    },
    {
      "id": "grip",
      "label": "Grips",
      "baseline": 2
    },
    {
      "id": "ball",
      "label": "Balls",
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
    "budget": 450,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "racquet",
      "label": "Racquet",
      "categories": [
        "racquet"
      ]
    },
    {
      "id": "string",
      "label": "String bed",
      "categories": [
        "string"
      ]
    },
    {
      "id": "grip",
      "label": "Grip",
      "categories": [
        "grip"
      ]
    },
    {
      "id": "ball",
      "label": "Match balls",
      "categories": [
        "ball"
      ]
    }
  ],
  "sample": [
    {
      "id": "tennis_string_budget-match-racquet",
      "name": "Match racquet",
      "category": "racquet",
      "tags": [
        "budget"
      ],
      "cost": 180,
      "quantity": 180,
      "condition": "good"
    },
    {
      "id": "tennis_string_budget-polyester-string",
      "name": "Polyester string",
      "category": "string",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "tennis_string_budget-overgrip-pack",
      "name": "Overgrip pack",
      "category": "grip",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "condition": "new"
    },
    {
      "id": "tennis_string_budget-match-balls",
      "name": "Match balls",
      "category": "ball",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "condition": "new"
    },
    {
      "id": "tennis_string_budget-backup-racquet",
      "name": "Backup racquet",
      "category": "racquet",
      "tags": [
        "budget"
      ],
      "cost": 150,
      "quantity": 150,
      "condition": "fair"
    }
  ]
}
