import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "solar-panel-guide-mcp",
  "title": "solar panel guide Guide",
  "description": "Real local JSON analysis of solar panel guide in the Energy & Planet lane. 25 MCP tools, no paywall.",
  "prefix": "planet_solar_panel_guide",
  "entity": "solar panel guide item",
  "categories": [
    {
      "id": "planet",
      "label": "planet",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "solar-panel",
      "label": "solar-panel",
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
        "planet"
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
      "id": "planet_solar_panel_guide-planet-1",
      "name": "planet primary",
      "category": "planet",
      "tags": [
        "energy-planet",
        "solar",
        "panel"
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
      "id": "planet_solar_panel_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "energy-planet",
        "solar",
        "panel"
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
      "id": "planet_solar_panel_guide-solar-panel-3",
      "name": "solar-panel primary",
      "category": "solar-panel",
      "tags": [
        "energy-planet",
        "solar",
        "panel"
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
      "id": "planet_solar_panel_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "energy-planet",
        "solar",
        "panel"
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
      "id": "planet_solar_panel_guide-planet-5",
      "name": "planet backup",
      "category": "planet",
      "tags": [
        "energy-planet",
        "solar",
        "panel"
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
      "id": "planet_solar_panel_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "energy-planet",
        "solar",
        "panel"
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
      "id": "planet_solar_panel_guide-solar-panel-7",
      "name": "solar-panel backup",
      "category": "solar-panel",
      "tags": [
        "energy-planet",
        "solar",
        "panel"
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
      "id": "planet_solar_panel_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "energy-planet",
        "solar",
        "panel"
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
