import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "disaster-disaster-supplies-check-mcp",
  "title": "Disaster Supplies Audit",
  "description": "Audit emergency supplies for expiry, water, food, medical, power and tool coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "disaster_supplies",
  "entity": "emergency supply",
  "categories": [
    {
      "id": "water",
      "label": "Water",
      "baseline": 2
    },
    {
      "id": "food",
      "label": "Food",
      "baseline": 3
    },
    {
      "id": "medical",
      "label": "Medical",
      "baseline": 2
    },
    {
      "id": "power",
      "label": "Power",
      "baseline": 2
    },
    {
      "id": "tools",
      "label": "Tools",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to expiry",
    "unit": "days",
    "target": 180,
    "direction": "higher"
  },
  "target": {
    "maxItems": 30,
    "budget": 300,
    "coverage": 0.8,
    "expiryDays": 180
  },
  "dependencies": [
    {
      "id": "water",
      "label": "Drinking water",
      "categories": [
        "water"
      ]
    },
    {
      "id": "food",
      "label": "Food supply",
      "categories": [
        "food"
      ]
    },
    {
      "id": "medical",
      "label": "Medical supply",
      "categories": [
        "medical"
      ]
    },
    {
      "id": "power",
      "label": "Power supply",
      "categories": [
        "power"
      ]
    }
  ],
  "sample": [
    {
      "id": "supply-water",
      "name": "Case of water",
      "category": "water",
      "tags": [
        "sealed"
      ],
      "cost": 8,
      "quantity": 1,
      "acquired": "2026-06-01",
      "expires": "2027-06-01",
      "condition": "new"
    },
    {
      "id": "supply-food",
      "name": "Canned soup",
      "category": "food",
      "tags": [
        "canned"
      ],
      "cost": 3,
      "quantity": 6,
      "acquired": "2026-05-01",
      "expires": "2028-05-01",
      "condition": "new"
    },
    {
      "id": "supply-medical",
      "name": "Trauma kit",
      "category": "medical",
      "tags": [
        "sealed"
      ],
      "cost": 40,
      "quantity": 1,
      "acquired": "2026-04-01",
      "expires": "2028-04-01",
      "condition": "new"
    },
    {
      "id": "supply-power",
      "name": "Battery bank",
      "category": "power",
      "tags": [
        "lithium"
      ],
      "cost": 50,
      "quantity": 1,
      "acquired": "2026-03-01",
      "expires": "2029-03-01",
      "condition": "good"
    },
    {
      "id": "supply-radio",
      "name": "Hand crank radio",
      "category": "tools",
      "tags": [
        "radio"
      ],
      "cost": 35,
      "quantity": 1,
      "acquired": "2026-02-01",
      "condition": "new"
    }
  ]
}
