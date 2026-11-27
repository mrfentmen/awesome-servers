import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "spa-menu-compare-mcp",
  "title": "spa menu compare Compare",
  "description": "Real local JSON analysis of spa menu compare in the Beauty & Body lane. 25 MCP tools, no paywall.",
  "prefix": "beauty_spa_menu_compare",
  "entity": "spa menu compare item",
  "categories": [
    {
      "id": "beauty",
      "label": "beauty",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "spa-menu",
      "label": "spa-menu",
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
      "id": "beauty_spa_menu_compare-beauty-1",
      "name": "beauty primary",
      "category": "beauty",
      "tags": [
        "beauty-body",
        "spa",
        "menu"
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
      "id": "beauty_spa_menu_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "beauty-body",
        "spa",
        "menu"
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
      "id": "beauty_spa_menu_compare-spa-menu-3",
      "name": "spa-menu primary",
      "category": "spa-menu",
      "tags": [
        "beauty-body",
        "spa",
        "menu"
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
      "id": "beauty_spa_menu_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "beauty-body",
        "spa",
        "menu"
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
      "id": "beauty_spa_menu_compare-beauty-5",
      "name": "beauty backup",
      "category": "beauty",
      "tags": [
        "beauty-body",
        "spa",
        "menu"
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
      "id": "beauty_spa_menu_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "beauty-body",
        "spa",
        "menu"
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
      "id": "beauty_spa_menu_compare-spa-menu-7",
      "name": "spa-menu backup",
      "category": "spa-menu",
      "tags": [
        "beauty-body",
        "spa",
        "menu"
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
      "id": "beauty_spa_menu_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "beauty-body",
        "spa",
        "menu"
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
