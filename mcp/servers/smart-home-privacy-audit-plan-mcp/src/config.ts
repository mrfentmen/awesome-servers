import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "smart-home-privacy-audit-plan-mcp",
  "title": "Smart Home Privacy Planning Audit",
  "description": "Plan smart home privacy by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "privacy_audit_plan",
  "entity": "smart device plan",
  "categories": [
    {
      "id": "camera",
      "label": "Cameras",
      "baseline": 1
    },
    {
      "id": "speaker",
      "label": "Speakers",
      "baseline": 1
    },
    {
      "id": "sensor",
      "label": "Sensors",
      "baseline": 1
    },
    {
      "id": "hub",
      "label": "Hubs",
      "baseline": 1
    },
    {
      "id": "display",
      "label": "Displays",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "data_shared_services",
    "label": "Data-sharing services",
    "unit": "services",
    "target": 0,
    "direction": "lower"
  },
  "target": {
    "maxItems": 25,
    "budget": 800,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "video",
      "label": "Video capture",
      "categories": [
        "camera"
      ]
    },
    {
      "id": "voice",
      "label": "Voice capture",
      "categories": [
        "speaker"
      ]
    },
    {
      "id": "sensing",
      "label": "Sensing",
      "categories": [
        "sensor"
      ]
    },
    {
      "id": "local",
      "label": "Local control",
      "categories": [
        "hub"
      ]
    },
    {
      "id": "screen",
      "label": "Screen services",
      "categories": [
        "display"
      ]
    }
  ],
  "sample": [
    {
      "id": "privacy_audit_plan-camera",
      "name": "Indoor camera",
      "category": "camera",
      "tags": [
        "cloud",
        "video"
      ],
      "cost": 60,
      "quantity": 3,
      "condition": "fair"
    },
    {
      "id": "privacy_audit_plan-doorbell",
      "name": "Video doorbell",
      "category": "camera",
      "tags": [
        "cloud",
        "motion"
      ],
      "cost": 120,
      "quantity": 2,
      "condition": "fair"
    },
    {
      "id": "privacy_audit_plan-speaker",
      "name": "Voice assistant",
      "category": "speaker",
      "tags": [
        "voice",
        "cloud"
      ],
      "cost": 90,
      "quantity": 4,
      "condition": "worn"
    },
    {
      "id": "privacy_audit_plan-motion",
      "name": "Motion sensor",
      "category": "sensor",
      "tags": [
        "local",
        "zigbee"
      ],
      "cost": 25,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "privacy_audit_plan-hub",
      "name": "Local hub",
      "category": "hub",
      "tags": [
        "local",
        "matter"
      ],
      "cost": 80,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "privacy_audit_plan-tv",
      "name": "Smart TV",
      "category": "display",
      "tags": [
        "analytics",
        "ads"
      ],
      "cost": 500,
      "quantity": 6,
      "condition": "worn"
    }
  ]
}
