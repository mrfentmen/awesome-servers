import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "transit-accessible-station-cost-mcp",
  "title": "Accessible Station Budget Audit",
  "description": "Audit accessible station budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "accessible_station_budget",
  "entity": "station feature budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 27600,
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
      "id": "accessible_station_budget-platform-elevator",
      "name": "Platform elevator",
      "category": "elevator",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "accessible_station_budget-backup-elevator",
      "name": "Backup elevator",
      "category": "elevator",
      "tags": [
        "budget"
      ],
      "cost": 6000,
      "quantity": 6000,
      "condition": "fair"
    },
    {
      "id": "accessible_station_budget-street-ramp",
      "name": "Street ramp",
      "category": "ramp",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "accessible_station_budget-platform-ramp",
      "name": "Platform ramp",
      "category": "ramp",
      "tags": [
        "budget"
      ],
      "cost": 2500,
      "quantity": 2500,
      "condition": "worn"
    },
    {
      "id": "accessible_station_budget-tactile-strip",
      "name": "Tactile strip",
      "category": "tactile",
      "tags": [
        "budget"
      ],
      "cost": 800,
      "quantity": 800,
      "condition": "good"
    },
    {
      "id": "accessible_station_budget-tactile-signage",
      "name": "Tactile signage",
      "category": "tactile",
      "tags": [
        "budget"
      ],
      "cost": 1200,
      "quantity": 1200,
      "condition": "good"
    },
    {
      "id": "accessible_station_budget-audio-announcements",
      "name": "Audio announcements",
      "category": "announcement",
      "tags": [
        "budget"
      ],
      "cost": 3500,
      "quantity": 3500,
      "condition": "good"
    },
    {
      "id": "accessible_station_budget-accessible-restroom",
      "name": "Accessible restroom",
      "category": "restroom",
      "tags": [
        "budget"
      ],
      "cost": 9000,
      "quantity": 9000,
      "condition": "good"
    }
  ]
}
