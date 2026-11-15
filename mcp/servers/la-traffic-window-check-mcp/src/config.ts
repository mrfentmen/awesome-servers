import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "la-traffic-window-check-mcp",
  "title": "Traffic Window Audit",
  "description": "Audit departure windows, freeway segments, incidents and alternate routes for LA traffic. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "traffic_window",
  "entity": "traffic window",
  "categories": [
    {
      "id": "departure",
      "label": "Departure",
      "baseline": 2
    },
    {
      "id": "freeway",
      "label": "Freeway",
      "baseline": 1
    },
    {
      "id": "incidents",
      "label": "Incidents",
      "baseline": 1
    },
    {
      "id": "alternate",
      "label": "Alternate",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "travel_minutes",
    "label": "Travel minutes",
    "unit": "min",
    "target": 45,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "departure",
      "label": "Departure",
      "categories": [
        "departure"
      ]
    },
    {
      "id": "freeway",
      "label": "Freeway",
      "categories": [
        "freeway"
      ]
    },
    {
      "id": "incidents",
      "label": "Incidents",
      "categories": [
        "incidents"
      ]
    },
    {
      "id": "alternate",
      "label": "Alternate",
      "categories": [
        "alternate"
      ]
    }
  ],
  "sample": [
    {
      "id": "traffic_window-morning-departure",
      "name": "Morning departure",
      "category": "departure",
      "tags": [
        "departure"
      ],
      "cost": 0,
      "quantity": 35,
      "condition": "good"
    },
    {
      "id": "traffic_window-freeway-segment",
      "name": "Freeway segment",
      "category": "freeway",
      "tags": [
        "freeway"
      ],
      "cost": 0,
      "quantity": 50,
      "condition": "fair"
    },
    {
      "id": "traffic_window-incident-check",
      "name": "Incident check",
      "category": "incidents",
      "tags": [
        "incidents"
      ],
      "cost": 0,
      "quantity": 10,
      "condition": "good"
    },
    {
      "id": "traffic_window-alternate-route",
      "name": "Alternate route",
      "category": "alternate",
      "tags": [
        "alternate"
      ],
      "cost": 0,
      "quantity": 40,
      "condition": "good"
    }
  ]
}
