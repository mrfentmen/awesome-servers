import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wildfire-defensible-space-index-mcp",
  "title": "Defensible Space Archive",
  "description": "Archive defensible space by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "defensible_space_index",
  "entity": "defensible space item archive",
  "categories": [
    {
      "id": "zone-0",
      "label": "Zone 0",
      "baseline": 2
    },
    {
      "id": "zone-1",
      "label": "Zone 1",
      "baseline": 1
    },
    {
      "id": "zone-2",
      "label": "Zone 2",
      "baseline": 1
    },
    {
      "id": "access",
      "label": "Access",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "defensible_space",
    "label": "Defensible space",
    "unit": "ft",
    "target": 100,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 1300,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "zone-0",
      "label": "Zone 0",
      "categories": [
        "zone-0"
      ]
    },
    {
      "id": "zone-1",
      "label": "Zone 1",
      "categories": [
        "zone-1"
      ]
    },
    {
      "id": "zone-2",
      "label": "Zone 2",
      "categories": [
        "zone-2"
      ]
    },
    {
      "id": "access",
      "label": "Access",
      "categories": [
        "access"
      ]
    }
  ],
  "sample": [
    {
      "id": "defensible_space_index-ember-free-zone",
      "name": "Ember-free zone",
      "category": "zone-0",
      "tags": [
        "zone-0"
      ],
      "cost": 0,
      "quantity": 5,
      "condition": "fair"
    },
    {
      "id": "defensible_space_index-grass-cut",
      "name": "Grass cut",
      "category": "zone-1",
      "tags": [
        "zone-1"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "defensible_space_index-tree-spacing",
      "name": "Tree spacing",
      "category": "zone-2",
      "tags": [
        "zone-2"
      ],
      "cost": 0,
      "quantity": 10,
      "condition": "fair"
    },
    {
      "id": "defensible_space_index-driveway-clearance",
      "name": "Driveway clearance",
      "category": "access",
      "tags": [
        "access"
      ],
      "cost": 0,
      "quantity": 12,
      "condition": "good"
    }
  ]
}
