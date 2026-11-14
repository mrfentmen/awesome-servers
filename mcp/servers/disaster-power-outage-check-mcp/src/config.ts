import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "disaster-power-outage-check-mcp",
  "title": "Power Outage Audit",
  "description": "Audit lights, battery banks, communications and food for a power outage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "power_outage",
  "entity": "outage item",
  "categories": [
    {
      "id": "light",
      "label": "Lighting",
      "baseline": 2
    },
    {
      "id": "power",
      "label": "Power banks",
      "baseline": 3
    },
    {
      "id": "comms",
      "label": "Communication",
      "baseline": 2
    },
    {
      "id": "food",
      "label": "Food",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "battery_health",
    "label": "Battery health",
    "unit": "%",
    "target": 80,
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
      "id": "light",
      "label": "Lighting",
      "categories": [
        "light"
      ]
    },
    {
      "id": "power",
      "label": "Power",
      "categories": [
        "power"
      ]
    },
    {
      "id": "comms",
      "label": "Communication",
      "categories": [
        "comms"
      ]
    }
  ],
  "sample": [
    {
      "id": "outage-lamp",
      "name": "Rechargeable lamp",
      "category": "light",
      "tags": [
        "led"
      ],
      "cost": 25,
      "quantity": 100,
      "acquired": "2026-01-01",
      "condition": "new"
    },
    {
      "id": "outage-headlamp",
      "name": "Headlamp",
      "category": "light",
      "tags": [
        "led"
      ],
      "cost": 20,
      "quantity": 85,
      "acquired": "2026-02-01",
      "condition": "good"
    },
    {
      "id": "outage-bank",
      "name": "Power bank",
      "category": "power",
      "tags": [
        "usb-c"
      ],
      "cost": 40,
      "quantity": 60,
      "acquired": "2025-06-01",
      "condition": "fair"
    },
    {
      "id": "outage-radio",
      "name": "Battery radio",
      "category": "comms",
      "tags": [
        "am-fm"
      ],
      "cost": 30,
      "quantity": 40,
      "acquired": "2024-06-01",
      "condition": "fair"
    },
    {
      "id": "outage-camp-stove",
      "name": "Camp stove",
      "category": "food",
      "tags": [
        "gas"
      ],
      "cost": 50,
      "quantity": 90,
      "acquired": "2025-08-01",
      "condition": "good"
    }
  ]
}
