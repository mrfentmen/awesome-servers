import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "smart-home-network-congestion-cost-mcp",
  "title": "Network Congestion Budget Audit",
  "description": "Audit network congestion budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "network_congestion_budget",
  "entity": "network device budget line",
  "categories": [
    {
      "id": "router",
      "label": "Routers",
      "baseline": 1
    },
    {
      "id": "camera",
      "label": "Cameras",
      "baseline": 1
    },
    {
      "id": "speaker",
      "label": "Speakers",
      "baseline": 2
    },
    {
      "id": "sensor",
      "label": "Sensors",
      "baseline": 2
    },
    {
      "id": "hub",
      "label": "Hubs",
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
    "budget": 700,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "router",
      "label": "Router",
      "categories": [
        "router"
      ]
    },
    {
      "id": "cameras",
      "label": "Video streams",
      "categories": [
        "camera"
      ]
    },
    {
      "id": "audio",
      "label": "Audio streams",
      "categories": [
        "speaker"
      ]
    },
    {
      "id": "sensors",
      "label": "Sensor traffic",
      "categories": [
        "sensor"
      ]
    }
  ],
  "sample": [
    {
      "id": "network_congestion_budget-wi-fi-6-router",
      "name": "Wi-Fi 6 router",
      "category": "router",
      "tags": [
        "budget"
      ],
      "cost": 180,
      "quantity": 180,
      "condition": "good"
    },
    {
      "id": "network_congestion_budget-doorbell-camera",
      "name": "Doorbell camera",
      "category": "camera",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "good"
    },
    {
      "id": "network_congestion_budget-living-room-speaker",
      "name": "Living room speaker",
      "category": "speaker",
      "tags": [
        "budget"
      ],
      "cost": 90,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "network_congestion_budget-motion-sensor",
      "name": "Motion sensor",
      "category": "sensor",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "network_congestion_budget-zigbee-hub",
      "name": "Zigbee hub",
      "category": "hub",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "good"
    },
    {
      "id": "network_congestion_budget-bedroom-speaker",
      "name": "Bedroom speaker",
      "category": "speaker",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "good"
    }
  ]
}
