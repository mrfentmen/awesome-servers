import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "sports-tennis-string-check-mcp",
  "title": "Tennis String Audit",
  "description": "Audit racquets, strings, grips and balls for tension, condition and match readiness. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "tennis_string",
  "entity": "tennis item",
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
    "id": "service_gap",
    "label": "String tension",
    "unit": "lb",
    "target": 50,
    "direction": "higher"
  },
  "target": {
    "maxItems": 15,
    "budget": 300,
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
      "id": "tennis-racquet",
      "name": "Match racquet",
      "category": "racquet",
      "tags": [
        "100sq"
      ],
      "cost": 180,
      "quantity": 52,
      "acquired": "2025-01-01",
      "condition": "good"
    },
    {
      "id": "tennis-string",
      "name": "Polyester string",
      "category": "string",
      "tags": [
        "poly"
      ],
      "cost": 20,
      "quantity": 48,
      "acquired": "2026-02-01",
      "condition": "good"
    },
    {
      "id": "tennis-grip",
      "name": "Overgrip pack",
      "category": "grip",
      "tags": [
        "tacky"
      ],
      "cost": 8,
      "quantity": 55,
      "acquired": "2026-03-01",
      "condition": "new"
    },
    {
      "id": "tennis-ball",
      "name": "Match balls",
      "category": "ball",
      "tags": [
        "pressurised"
      ],
      "cost": 10,
      "quantity": 50,
      "acquired": "2026-09-01",
      "condition": "new"
    },
    {
      "id": "tennis-backup",
      "name": "Backup racquet",
      "category": "racquet",
      "tags": [
        "98sq"
      ],
      "cost": 150,
      "quantity": 45,
      "acquired": "2024-05-01",
      "condition": "fair"
    }
  ]
}
