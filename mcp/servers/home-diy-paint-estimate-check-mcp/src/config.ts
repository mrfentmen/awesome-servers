import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "home-diy-paint-estimate-check-mcp",
  "title": "Paint Estimate Audit",
  "description": "Audit a paint stock by room surface, litres, spend, coverage and job readiness. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "paint_estimate",
  "entity": "paint item",
  "categories": [
    {
      "id": "wall",
      "label": "Wall paint",
      "baseline": 3
    },
    {
      "id": "trim",
      "label": "Trim paint",
      "baseline": 2
    },
    {
      "id": "ceiling",
      "label": "Ceiling paint",
      "baseline": 1
    },
    {
      "id": "primer",
      "label": "Primer",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "paint_liters",
    "label": "Paint litres",
    "unit": "L",
    "target": 12,
    "direction": "higher"
  },
  "target": {
    "maxItems": 15,
    "budget": 300,
    "coverage": 0.75,
    "expiryDays": 365
  },
  "dependencies": [
    {
      "id": "wall",
      "label": "Wall coating",
      "categories": [
        "wall"
      ]
    },
    {
      "id": "trim",
      "label": "Trim coating",
      "categories": [
        "trim"
      ]
    },
    {
      "id": "ceiling",
      "label": "Ceiling coating",
      "categories": [
        "ceiling"
      ]
    },
    {
      "id": "primer",
      "label": "Primer",
      "categories": [
        "primer"
      ]
    }
  ],
  "sample": [
    {
      "id": "paint-wall",
      "name": "Living room wall paint",
      "category": "wall",
      "tags": [
        "interior",
        "eggshell"
      ],
      "cost": 55,
      "quantity": 10,
      "acquired": "2026-04-01",
      "expires": "2028-04-01",
      "condition": "new"
    },
    {
      "id": "paint-trim",
      "name": "White trim paint",
      "category": "trim",
      "tags": [
        "interior",
        "satin"
      ],
      "cost": 30,
      "quantity": 5,
      "acquired": "2026-03-01",
      "expires": "2028-03-01",
      "condition": "new"
    },
    {
      "id": "paint-ceiling",
      "name": "Ceiling white",
      "category": "ceiling",
      "tags": [
        "interior",
        "matte"
      ],
      "cost": 35,
      "quantity": 7,
      "acquired": "2026-02-01",
      "expires": "2028-02-01",
      "condition": "new"
    },
    {
      "id": "paint-primer",
      "name": "Multi-surface primer",
      "category": "primer",
      "tags": [
        "primer"
      ],
      "cost": 25,
      "quantity": 4,
      "acquired": "2026-01-01",
      "expires": "2027-06-01",
      "condition": "good"
    },
    {
      "id": "paint-exterior",
      "name": "Exterior wall paint",
      "category": "wall",
      "tags": [
        "exterior",
        "weather"
      ],
      "cost": 65,
      "quantity": 12,
      "acquired": "2025-08-01",
      "expires": "2027-08-01",
      "condition": "good"
    }
  ]
}
