import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "color-formula-guide-mcp",
  "title": "color formula guide Guide",
  "description": "Real local JSON analysis of color formula guide in the Beauty & Body lane. 25 MCP tools, no paywall.",
  "prefix": "beauty_color_formula_guide",
  "entity": "color formula guide item",
  "categories": [
    {
      "id": "beauty",
      "label": "beauty",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "color-formula",
      "label": "color-formula",
      "baseline": 2
    },
    {
      "id": "mcp",
      "label": "mcp",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since review",
    "unit": "days",
    "target": 14,
    "direction": "lower"
  },
  "target": {
    "maxItems": 30,
    "budget": 700,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "beauty"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "mcp"
      ]
    }
  ],
  "sample": [
    {
      "id": "beauty_color_formula_guide-beauty-1",
      "name": "beauty primary",
      "category": "beauty",
      "tags": [
        "beauty-body",
        "color",
        "formula"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "beauty_color_formula_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "beauty-body",
        "color",
        "formula"
      ],
      "cost": 35,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-29",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "beauty_color_formula_guide-color-formula-3",
      "name": "color-formula primary",
      "category": "color-formula",
      "tags": [
        "beauty-body",
        "color",
        "formula"
      ],
      "cost": 50,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-12",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "beauty_color_formula_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "beauty-body",
        "color",
        "formula"
      ],
      "cost": 65,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-26",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "beauty_color_formula_guide-beauty-5",
      "name": "beauty backup",
      "category": "beauty",
      "tags": [
        "beauty-body",
        "color",
        "formula"
      ],
      "cost": 80,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-09",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "beauty_color_formula_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "beauty-body",
        "color",
        "formula"
      ],
      "cost": 95,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-23",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "beauty_color_formula_guide-color-formula-7",
      "name": "color-formula backup",
      "category": "color-formula",
      "tags": [
        "beauty-body",
        "color",
        "formula"
      ],
      "cost": 110,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-09",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "beauty_color_formula_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "beauty-body",
        "color",
        "formula"
      ],
      "cost": 125,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-23",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
