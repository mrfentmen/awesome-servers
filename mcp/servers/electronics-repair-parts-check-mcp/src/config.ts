import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "electronics-repair-parts-check-mcp",
  "title": "Repair Parts Audit",
  "description": "Audit repair parts stock for screens, batteries, ports and boards. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "repair_parts",
  "entity": "repair part",
  "categories": [
    {
      "id": "screen",
      "label": "Screens",
      "baseline": 2
    },
    {
      "id": "battery",
      "label": "Batteries",
      "baseline": 2
    },
    {
      "id": "port",
      "label": "Ports",
      "baseline": 2
    },
    {
      "id": "board",
      "label": "Boards",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Parts on hand",
    "unit": "units",
    "target": 2,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "screen",
      "label": "Screen stock",
      "categories": [
        "screen"
      ]
    },
    {
      "id": "battery",
      "label": "Battery stock",
      "categories": [
        "battery"
      ]
    },
    {
      "id": "port",
      "label": "Port stock",
      "categories": [
        "port"
      ]
    },
    {
      "id": "board",
      "label": "Board stock",
      "categories": [
        "board"
      ]
    }
  ],
  "sample": [
    {
      "id": "part-screen",
      "name": "Phone screen",
      "category": "screen",
      "tags": [
        "oled"
      ],
      "cost": 60,
      "quantity": 3,
      "condition": "new"
    },
    {
      "id": "part-battery",
      "name": "Phone battery",
      "category": "battery",
      "tags": [
        "oem"
      ],
      "cost": 25,
      "quantity": 1,
      "condition": "new"
    },
    {
      "id": "part-port",
      "name": "USB-C port",
      "category": "port",
      "tags": [
        "solder"
      ],
      "cost": 10,
      "quantity": 2,
      "condition": "new"
    },
    {
      "id": "part-board",
      "name": "Charging board",
      "category": "board",
      "tags": [
        "module"
      ],
      "cost": 15,
      "quantity": 0,
      "condition": "fair"
    }
  ]
}
