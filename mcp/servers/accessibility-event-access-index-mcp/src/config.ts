import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "accessibility-event-access-index-mcp",
  "title": "Event Access Archive",
  "description": "Archive event access by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "event_access_index",
  "entity": "event access item archive",
  "categories": [
    {
      "id": "seating",
      "label": "Seating",
      "baseline": 2
    },
    {
      "id": "entry",
      "label": "Entry",
      "baseline": 2
    },
    {
      "id": "restroom",
      "label": "Restroom",
      "baseline": 1
    },
    {
      "id": "parking",
      "label": "Parking",
      "baseline": 1
    },
    {
      "id": "captioning",
      "label": "Captioning",
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
    "budget": 5000,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "entry",
      "label": "Step-free entry",
      "categories": [
        "entry"
      ]
    },
    {
      "id": "seating",
      "label": "Accessible seating",
      "categories": [
        "seating"
      ]
    },
    {
      "id": "facilities",
      "label": "Accessible facilities",
      "categories": [
        "restroom"
      ]
    },
    {
      "id": "parking",
      "label": "Accessible parking",
      "categories": [
        "parking"
      ]
    },
    {
      "id": "info",
      "label": "Accessible information",
      "categories": [
        "captioning"
      ]
    }
  ],
  "sample": [
    {
      "id": "event_access_index-seating",
      "name": "Accessible seating",
      "category": "seating",
      "tags": [
        "companion",
        "sightline"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "event_access_index-seating-extra",
      "name": "Extra seating row",
      "category": "seating",
      "tags": [
        "limited",
        "side"
      ],
      "cost": 500,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "event_access_index-entry",
      "name": "Step-free entry",
      "category": "entry",
      "tags": [
        "ramp",
        "staffed"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "event_access_index-side-entry",
      "name": "Side entrance",
      "category": "entry",
      "tags": [
        "temporary",
        "steep"
      ],
      "cost": 1000,
      "quantity": 2,
      "condition": "fair"
    },
    {
      "id": "event_access_index-restroom",
      "name": "Accessible restroom",
      "category": "restroom",
      "tags": [
        "permanent",
        "clean"
      ],
      "cost": 300,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "event_access_index-portable",
      "name": "Portable restroom",
      "category": "restroom",
      "tags": [
        "temporary",
        "narrow"
      ],
      "cost": 1500,
      "quantity": 3,
      "condition": "worn"
    },
    {
      "id": "event_access_index-parking",
      "name": "Accessible parking",
      "category": "parking",
      "tags": [
        "near-entry",
        "marked"
      ],
      "cost": 200,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "event_access_index-captioning",
      "name": "Live captioning",
      "category": "captioning",
      "tags": [
        "screen",
        "operator"
      ],
      "cost": 800,
      "quantity": 2,
      "condition": "fair"
    }
  ]
}
