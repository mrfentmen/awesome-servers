import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "estate-asset-inventory-check-mcp",
  "title": "Asset Inventory Audit",
  "description": "Audit asset inventory by accounts, property, vehicles, personal items coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "estate_asset_inventory",
  "entity": "asset inventory item",
  "categories": [
    {
      "id": "accounts",
      "label": "Accounts",
      "baseline": 2
    },
    {
      "id": "property",
      "label": "Property",
      "baseline": 2
    },
    {
      "id": "vehicles",
      "label": "Vehicles",
      "baseline": 2
    },
    {
      "id": "personal-items",
      "label": "Personal items",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to deadline",
    "unit": "days",
    "target": 90,
    "direction": "higher"
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
        "accounts"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "personal-items"
      ]
    }
  ],
  "sample": [
    {
      "id": "estate_asset_inventory-accounts-1",
      "name": "Accounts primary",
      "category": "accounts",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_asset_inventory-property-2",
      "name": "Property primary",
      "category": "property",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_asset_inventory-vehicles-3",
      "name": "Vehicles primary",
      "category": "vehicles",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_asset_inventory-personal-items-4",
      "name": "Personal items primary",
      "category": "personal-items",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_asset_inventory-accounts-5",
      "name": "Accounts backup",
      "category": "accounts",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_asset_inventory-property-6",
      "name": "Property backup",
      "category": "property",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_asset_inventory-vehicles-7",
      "name": "Vehicles backup",
      "category": "vehicles",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_asset_inventory-personal-items-8",
      "name": "Personal items backup",
      "category": "personal-items",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
