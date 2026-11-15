import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earthquake-aftershock-plan-index-mcp",
  "title": "Aftershock Plan Archive",
  "description": "Archive aftershock plan by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "aftershock_plan_index",
  "entity": "aftershock item archive",
  "categories": [
    {
      "id": "route",
      "label": "Route",
      "baseline": 2
    },
    {
      "id": "comms",
      "label": "Comms",
      "baseline": 1
    },
    {
      "id": "supplies",
      "label": "Supplies",
      "baseline": 1
    },
    {
      "id": "meeting",
      "label": "Meeting",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "plan_points",
    "label": "Plan points",
    "unit": "points",
    "target": 4,
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
      "id": "route",
      "label": "Route",
      "categories": [
        "route"
      ]
    },
    {
      "id": "comms",
      "label": "Comms",
      "categories": [
        "comms"
      ]
    },
    {
      "id": "supplies",
      "label": "Supplies",
      "categories": [
        "supplies"
      ]
    },
    {
      "id": "meeting",
      "label": "Meeting",
      "categories": [
        "meeting"
      ]
    }
  ],
  "sample": [
    {
      "id": "aftershock_plan_index-aftershock-route",
      "name": "Aftershock route",
      "category": "route",
      "tags": [
        "route"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "aftershock_plan_index-hand-radio",
      "name": "Hand radio",
      "category": "comms",
      "tags": [
        "comms"
      ],
      "cost": 60,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "aftershock_plan_index-go-bag",
      "name": "Go bag",
      "category": "supplies",
      "tags": [
        "supplies"
      ],
      "cost": 80,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "aftershock_plan_index-meeting-point",
      "name": "Meeting point",
      "category": "meeting",
      "tags": [
        "meeting"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
