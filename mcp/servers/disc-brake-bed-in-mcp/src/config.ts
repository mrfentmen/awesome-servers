import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "disc-brake-bed-in-mcp",
  "title": "Disc Brake Bed In Compare",
  "description": "Real local JSON analysis of disc brake bed in in the Bike Shop lane. 25 MCP tools, no paywall.",
  "prefix": "bike_shop_disc_brake_bed_in",
  "entity": "disc brake bed in item",
  "categories": [
    {
      "id": "rows",
      "label": "Rows",
      "baseline": 2
    },
    {
      "id": "flags",
      "label": "Flags",
      "baseline": 2
    },
    {
      "id": "totals",
      "label": "Totals",
      "baseline": 2
    },
    {
      "id": "notes",
      "label": "Notes",
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
        "rows"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "notes"
      ]
    }
  ],
  "sample": [
    {
      "id": "bike_shop_disc_brake_bed_in-rows-1",
      "name": "Rows primary",
      "category": "rows",
      "tags": [
        "bike-shop",
        "disc",
        "brake"
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
      "id": "bike_shop_disc_brake_bed_in-flags-2",
      "name": "Flags primary",
      "category": "flags",
      "tags": [
        "bike-shop",
        "disc",
        "brake"
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
      "id": "bike_shop_disc_brake_bed_in-totals-3",
      "name": "Totals primary",
      "category": "totals",
      "tags": [
        "bike-shop",
        "disc",
        "brake"
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
      "id": "bike_shop_disc_brake_bed_in-notes-4",
      "name": "Notes primary",
      "category": "notes",
      "tags": [
        "bike-shop",
        "disc",
        "brake"
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
      "id": "bike_shop_disc_brake_bed_in-rows-5",
      "name": "Rows backup",
      "category": "rows",
      "tags": [
        "bike-shop",
        "disc",
        "brake"
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
      "id": "bike_shop_disc_brake_bed_in-flags-6",
      "name": "Flags backup",
      "category": "flags",
      "tags": [
        "bike-shop",
        "disc",
        "brake"
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
      "id": "bike_shop_disc_brake_bed_in-totals-7",
      "name": "Totals backup",
      "category": "totals",
      "tags": [
        "bike-shop",
        "disc",
        "brake"
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
      "id": "bike_shop_disc_brake_bed_in-notes-8",
      "name": "Notes backup",
      "category": "notes",
      "tags": [
        "bike-shop",
        "disc",
        "brake"
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
