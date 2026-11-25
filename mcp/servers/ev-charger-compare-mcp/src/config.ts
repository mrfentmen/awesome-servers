import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "ev-charger-compare-mcp",
  "title": "ev charger compare Compare",
  "description": "Real local JSON analysis of ev charger compare in the Energy & Planet lane. 25 MCP tools, no paywall.",
  "prefix": "planet_ev_charger_compare",
  "entity": "ev charger compare item",
  "categories": [
    {
      "id": "planet",
      "label": "planet",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "ev-charger",
      "label": "ev-charger",
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
      "id": "planet_ev_charger_compare-planet-1",
      "name": "planet primary",
      "category": "planet",
      "tags": [
        "energy-planet",
        "ev",
        "charger"
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
      "id": "planet_ev_charger_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "energy-planet",
        "ev",
        "charger"
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
      "id": "planet_ev_charger_compare-ev-charger-3",
      "name": "ev-charger primary",
      "category": "ev-charger",
      "tags": [
        "energy-planet",
        "ev",
        "charger"
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
      "id": "planet_ev_charger_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "energy-planet",
        "ev",
        "charger"
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
      "id": "planet_ev_charger_compare-planet-5",
      "name": "planet backup",
      "category": "planet",
      "tags": [
        "energy-planet",
        "ev",
        "charger"
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
      "id": "planet_ev_charger_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "energy-planet",
        "ev",
        "charger"
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
      "id": "planet_ev_charger_compare-ev-charger-7",
      "name": "ev-charger backup",
      "category": "ev-charger",
      "tags": [
        "energy-planet",
        "ev",
        "charger"
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
      "id": "planet_ev_charger_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "energy-planet",
        "ev",
        "charger"
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
