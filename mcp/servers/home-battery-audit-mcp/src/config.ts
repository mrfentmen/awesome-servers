import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "home-battery-audit-mcp",
  "title": "home battery audit Audit",
  "description": "Real local JSON analysis of home battery audit in the Energy & Planet lane. 25 MCP tools, no paywall.",
  "prefix": "planet_home_battery_audit",
  "entity": "home battery audit item",
  "categories": [
    {
      "id": "planet",
      "label": "planet",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "home-battery",
      "label": "home-battery",
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
    "target": 7,
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
      "id": "planet_home_battery_audit-planet-1",
      "name": "planet primary",
      "category": "planet",
      "tags": [
        "energy-planet",
        "home",
        "battery"
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
      "id": "planet_home_battery_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "energy-planet",
        "home",
        "battery"
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
      "id": "planet_home_battery_audit-home-battery-3",
      "name": "home-battery primary",
      "category": "home-battery",
      "tags": [
        "energy-planet",
        "home",
        "battery"
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
      "id": "planet_home_battery_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "energy-planet",
        "home",
        "battery"
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
      "id": "planet_home_battery_audit-planet-5",
      "name": "planet backup",
      "category": "planet",
      "tags": [
        "energy-planet",
        "home",
        "battery"
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
      "id": "planet_home_battery_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "energy-planet",
        "home",
        "battery"
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
      "id": "planet_home_battery_audit-home-battery-7",
      "name": "home-battery backup",
      "category": "home-battery",
      "tags": [
        "energy-planet",
        "home",
        "battery"
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
      "id": "planet_home_battery_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "energy-planet",
        "home",
        "battery"
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
