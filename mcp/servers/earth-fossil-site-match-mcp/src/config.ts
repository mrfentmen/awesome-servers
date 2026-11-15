import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earth-fossil-site-match-mcp",
  "title": "Fossil Site Match Audit",
  "description": "Match fossil site by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "fossil_site_match",
  "entity": "fossil site item match",
  "categories": [
    {
      "id": "access",
      "label": "Access",
      "baseline": 2
    },
    {
      "id": "layers",
      "label": "Layers",
      "baseline": 1
    },
    {
      "id": "tools",
      "label": "Tools",
      "baseline": 1
    },
    {
      "id": "records",
      "label": "Records",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "site_points",
    "label": "Site points",
    "unit": "points",
    "target": 1,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 100,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "access",
      "label": "Access",
      "categories": [
        "access"
      ]
    },
    {
      "id": "layers",
      "label": "Layers",
      "categories": [
        "layers"
      ]
    },
    {
      "id": "tools",
      "label": "Tools",
      "categories": [
        "tools"
      ]
    },
    {
      "id": "records",
      "label": "Records",
      "categories": [
        "records"
      ]
    }
  ],
  "sample": [
    {
      "id": "fossil_site_match-site-access",
      "name": "Site access",
      "category": "access",
      "tags": [
        "access"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "fossil_site_match-exposed-layers",
      "name": "Exposed layers",
      "category": "layers",
      "tags": [
        "layers"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "fossil_site_match-field-tools",
      "name": "Field tools",
      "category": "tools",
      "tags": [
        "tools"
      ],
      "cost": 40,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "fossil_site_match-site-records",
      "name": "Site records",
      "category": "records",
      "tags": [
        "records"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "fair"
    }
  ]
}
