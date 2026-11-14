import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "home-diy-renovation-budget-check-mcp",
  "title": "Renovation Budget Audit",
  "description": "Audit demolition, materials, labour and permit line items against a renovation budget. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "renovation_budget",
  "entity": "budget line",
  "categories": [
    {
      "id": "demo",
      "label": "Demolition",
      "baseline": 1
    },
    {
      "id": "materials",
      "label": "Materials",
      "baseline": 3
    },
    {
      "id": "labor",
      "label": "Labour",
      "baseline": 3
    },
    {
      "id": "permits",
      "label": "Permits",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Line item cost",
    "unit": "USD",
    "target": 2000,
    "direction": "lower"
  },
  "target": {
    "maxItems": 15,
    "budget": 10000,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "demo",
      "label": "Demolition",
      "categories": [
        "demo"
      ]
    },
    {
      "id": "materials",
      "label": "Materials",
      "categories": [
        "materials"
      ]
    },
    {
      "id": "labor",
      "label": "Labour",
      "categories": [
        "labor"
      ]
    },
    {
      "id": "permits",
      "label": "Permits",
      "categories": [
        "permits"
      ]
    }
  ],
  "sample": [
    {
      "id": "reno-demo",
      "name": "Kitchen demolition",
      "category": "demo",
      "tags": [
        "labor"
      ],
      "cost": 800,
      "quantity": 800,
      "condition": "good"
    },
    {
      "id": "reno-cabinets",
      "name": "Cabinet package",
      "category": "materials",
      "tags": [
        "kitchen"
      ],
      "cost": 2500,
      "quantity": 2500,
      "condition": "new"
    },
    {
      "id": "reno-labor",
      "name": "Installer labour",
      "category": "labor",
      "tags": [
        "install"
      ],
      "cost": 3000,
      "quantity": 3000,
      "condition": "good"
    },
    {
      "id": "reno-permit",
      "name": "Building permit",
      "category": "permits",
      "tags": [
        "city"
      ],
      "cost": 500,
      "quantity": 500,
      "condition": "new"
    }
  ]
}
