import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "transit-accessible-station-plan-mcp",
  "title": "Accessible Station Planning Audit",
  "description": "Plan accessible station by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "accessible_station_plan",
  "entity": "station feature plan",
  "categories": [
    {
      "id": "elevator",
      "label": "Elevator",
      "baseline": 2
    },
    {
      "id": "ramp",
      "label": "Ramp",
      "baseline": 2
    },
    {
      "id": "tactile",
      "label": "Tactile",
      "baseline": 2
    },
    {
      "id": "announcement",
      "label": "Announcement",
      "baseline": 1
    },
    {
      "id": "restroom",
      "label": "Restroom",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "barrier_count",
    "label": "Barrier count",
    "unit": "barriers",
    "target": 0,
    "direction": "lower"
  },
  "target": {
    "maxItems": 16,
    "budget": 15000,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "vertical",
      "label": "Vertical access",
      "categories": [
        "elevator",
        "ramp"
      ]
    },
    {
      "id": "path",
      "label": "Tactile path",
      "categories": [
        "tactile"
      ]
    },
    {
      "id": "info",
      "label": "Accessible information",
      "categories": [
        "announcement"
      ]
    },
    {
      "id": "facilities",
      "label": "Accessible facilities",
      "categories": [
        "restroom"
      ]
    }
  ],
  "sample": [
    {
      "id": "accessible_station_plan-elevator",
      "name": "Platform elevator",
      "category": "elevator",
      "tags": [
        "street-to-platform",
        "working"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "accessible_station_plan-backup",
      "name": "Backup elevator",
      "category": "elevator",
      "tags": [
        "maintenance",
        "slow"
      ],
      "cost": 6000,
      "quantity": 2,
      "condition": "fair"
    },
    {
      "id": "accessible_station_plan-ramp",
      "name": "Street ramp",
      "category": "ramp",
      "tags": [
        "gentle",
        "lit"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "accessible_station_plan-platform-ramp",
      "name": "Platform ramp",
      "category": "ramp",
      "tags": [
        "steep",
        "narrow"
      ],
      "cost": 2500,
      "quantity": 3,
      "condition": "worn"
    },
    {
      "id": "accessible_station_plan-tactile",
      "name": "Tactile strip",
      "category": "tactile",
      "tags": [
        "continuous",
        "platform"
      ],
      "cost": 800,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "accessible_station_plan-signage",
      "name": "Tactile signage",
      "category": "tactile",
      "tags": [
        "braille",
        "entrance"
      ],
      "cost": 1200,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "accessible_station_plan-audio",
      "name": "Audio announcements",
      "category": "announcement",
      "tags": [
        "clear",
        "both-platforms"
      ],
      "cost": 3500,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "accessible_station_plan-restroom",
      "name": "Accessible restroom",
      "category": "restroom",
      "tags": [
        "open",
        "clean"
      ],
      "cost": 9000,
      "quantity": 3,
      "condition": "good"
    }
  ]
}
