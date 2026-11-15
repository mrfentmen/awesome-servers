import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "snow-ski-wax-check-mcp",
  "title": "Ski Wax Audit",
  "description": "Audit ski wax stock, tuning tools, base care and temperature coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "ski_wax",
  "entity": "wax item",
  "categories": [
    {
      "id": "wax",
      "label": "Wax",
      "baseline": 2
    },
    {
      "id": "tool",
      "label": "Tool",
      "baseline": 1
    },
    {
      "id": "base",
      "label": "Base",
      "baseline": 1
    },
    {
      "id": "temperature",
      "label": "Temperature",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "wax_stock",
    "label": "Wax stock",
    "unit": "units",
    "target": 1,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "wax",
      "label": "Wax",
      "categories": [
        "wax"
      ]
    },
    {
      "id": "tool",
      "label": "Tool",
      "categories": [
        "tool"
      ]
    },
    {
      "id": "base",
      "label": "Base",
      "categories": [
        "base"
      ]
    },
    {
      "id": "temperature",
      "label": "Temperature",
      "categories": [
        "temperature"
      ]
    }
  ],
  "sample": [
    {
      "id": "ski_wax-all-temp-wax",
      "name": "All-temp wax",
      "category": "wax",
      "tags": [
        "wax"
      ],
      "cost": 20,
      "quantity": 2,
      "condition": "new"
    },
    {
      "id": "ski_wax-wax-iron",
      "name": "Wax iron",
      "category": "tool",
      "tags": [
        "tool"
      ],
      "cost": 60,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "ski_wax-base-cleaner",
      "name": "Base cleaner",
      "category": "base",
      "tags": [
        "base"
      ],
      "cost": 15,
      "quantity": 1,
      "condition": "new"
    },
    {
      "id": "ski_wax-cold-wax",
      "name": "Cold wax",
      "category": "temperature",
      "tags": [
        "temperature"
      ],
      "cost": 25,
      "quantity": 1,
      "condition": "new"
    }
  ]
}
