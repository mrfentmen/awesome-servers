import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fashion-fit-tailoring-check-mcp",
  "title": "Fit and Tailoring Audit",
  "description": "Audit garments waiting on tailoring, alteration days, spend and fit coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "fit_tailoring",
  "entity": "garment",
  "categories": [
    {
      "id": "top",
      "label": "Tops",
      "baseline": 3
    },
    {
      "id": "bottom",
      "label": "Bottoms",
      "baseline": 3
    },
    {
      "id": "dress",
      "label": "Dresses",
      "baseline": 2
    },
    {
      "id": "outerwear",
      "label": "Outerwear",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days at tailor",
    "unit": "days",
    "target": 7,
    "direction": "lower"
  },
  "target": {
    "maxItems": 15,
    "budget": 400,
    "coverage": 0.75,
    "expiryDays": 30
  },
  "dependencies": [
    {
      "id": "top",
      "label": "Top fit",
      "categories": [
        "top"
      ]
    },
    {
      "id": "bottom",
      "label": "Bottom fit",
      "categories": [
        "bottom"
      ]
    },
    {
      "id": "dress",
      "label": "Dress fit",
      "categories": [
        "dress"
      ]
    },
    {
      "id": "outerwear",
      "label": "Outerwear fit",
      "categories": [
        "outerwear"
      ]
    }
  ],
  "sample": [
    {
      "id": "fit-shirt",
      "name": "Linen shirt",
      "category": "top",
      "tags": [
        "sleeves"
      ],
      "cost": 45,
      "quantity": 3,
      "acquired": "2026-10-01",
      "condition": "good"
    },
    {
      "id": "fit-trouser",
      "name": "Wool trousers",
      "category": "bottom",
      "tags": [
        "hem"
      ],
      "cost": 80,
      "quantity": 10,
      "acquired": "2026-09-01",
      "condition": "good"
    },
    {
      "id": "fit-dress",
      "name": "Slip dress",
      "category": "dress",
      "tags": [
        "waist"
      ],
      "cost": 60,
      "quantity": 5,
      "acquired": "2026-10-15",
      "condition": "fair"
    },
    {
      "id": "fit-coat",
      "name": "Winter coat",
      "category": "outerwear",
      "tags": [
        "lining"
      ],
      "cost": 120,
      "quantity": 14,
      "acquired": "2026-08-01",
      "condition": "fair"
    }
  ]
}
