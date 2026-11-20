import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "estate-digital-legacy-check-mcp",
  "title": "Digital Legacy Audit",
  "description": "Audit digital legacy by passwords, accounts, photos, devices coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "estate_digital_legacy",
  "entity": "digital legacy item",
  "categories": [
    {
      "id": "passwords",
      "label": "Passwords",
      "baseline": 2
    },
    {
      "id": "accounts",
      "label": "Accounts",
      "baseline": 2
    },
    {
      "id": "photos",
      "label": "Photos",
      "baseline": 2
    },
    {
      "id": "devices",
      "label": "Devices",
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
        "passwords"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "devices"
      ]
    }
  ],
  "sample": [
    {
      "id": "estate_digital_legacy-passwords-1",
      "name": "Passwords primary",
      "category": "passwords",
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
      "id": "estate_digital_legacy-accounts-2",
      "name": "Accounts primary",
      "category": "accounts",
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
      "id": "estate_digital_legacy-photos-3",
      "name": "Photos primary",
      "category": "photos",
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
      "id": "estate_digital_legacy-devices-4",
      "name": "Devices primary",
      "category": "devices",
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
      "id": "estate_digital_legacy-passwords-5",
      "name": "Passwords backup",
      "category": "passwords",
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
      "id": "estate_digital_legacy-accounts-6",
      "name": "Accounts backup",
      "category": "accounts",
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
      "id": "estate_digital_legacy-photos-7",
      "name": "Photos backup",
      "category": "photos",
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
      "id": "estate_digital_legacy-devices-8",
      "name": "Devices backup",
      "category": "devices",
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
