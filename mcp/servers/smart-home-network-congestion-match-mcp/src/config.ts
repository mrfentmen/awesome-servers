import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "smart-home-network-congestion-match-mcp",
  "title": "Network Congestion Match Audit",
  "description": "Match network congestion by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "network_congestion_match",
  "entity": "network device match",
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
    "id": "channel_utilization",
    "label": "Channel utilization",
    "unit": "%",
    "target": 60,
    "direction": "lower"
  },
  "target": {
    "maxItems": 30,
    "budget": 600,
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
      "id": "network_congestion_match-router",
      "name": "Wi-Fi 6 router",
      "category": "router",
      "tags": [
        "wifi6",
        "dual-band"
      ],
      "cost": 180,
      "quantity": 55,
      "condition": "good"
    },
    {
      "id": "network_congestion_match-doorbell",
      "name": "Doorbell camera",
      "category": "camera",
      "tags": [
        "video",
        "outdoor"
      ],
      "cost": 120,
      "quantity": 70,
      "condition": "good"
    },
    {
      "id": "network_congestion_match-living",
      "name": "Living room speaker",
      "category": "speaker",
      "tags": [
        "audio",
        "streaming"
      ],
      "cost": 90,
      "quantity": 35,
      "condition": "good"
    },
    {
      "id": "network_congestion_match-motion",
      "name": "Motion sensor",
      "category": "sensor",
      "tags": [
        "zigbee",
        "low-power"
      ],
      "cost": 25,
      "quantity": 5,
      "condition": "good"
    },
    {
      "id": "network_congestion_match-hub",
      "name": "Zigbee hub",
      "category": "hub",
      "tags": [
        "zigbee",
        "bridge"
      ],
      "cost": 60,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "network_congestion_match-bedroom",
      "name": "Bedroom speaker",
      "category": "speaker",
      "tags": [
        "audio",
        "multiroom"
      ],
      "cost": 80,
      "quantity": 25,
      "condition": "good"
    }
  ]
}
