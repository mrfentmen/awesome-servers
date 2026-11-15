import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earth-fossil-site-check-mcp",
  "title": "Fossil Site Audit",
  "description": "Audit site access, rock layers, tools and fossil records. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "fossil_site",
  "entity": "fossil site item",
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
      "id": "fossil_site-site-access",
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
      "id": "fossil_site-exposed-layers",
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
      "id": "fossil_site-field-tools",
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
      "id": "fossil_site-site-records",
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
