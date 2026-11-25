import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "military-discount-finder-audit-mcp",
  "title": "Military Discount Finder Audit Audit",
  "description": "Real local JSON analysis of military discount finder audit in the Military lane. 25 MCP tools, no paywall.",
  "prefix": "military_military_discount_finder_audit",
  "entity": "military discount finder audit item",
  "categories": [
    {
      "id": "review",
      "label": "Review",
      "baseline": 2
    },
    {
      "id": "gaps",
      "label": "Gaps",
      "baseline": 2
    },
    {
      "id": "scores",
      "label": "Scores",
      "baseline": 2
    },
    {
      "id": "fixes",
      "label": "Fixes",
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
        "review"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "fixes"
      ]
    }
  ],
  "sample": [
    {
      "id": "military_military_discount_finder_audit-review-1",
      "name": "Review primary",
      "category": "review",
      "tags": [
        "military",
        "military",
        "discount"
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
      "id": "military_military_discount_finder_audit-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "military",
        "military",
        "discount"
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
      "id": "military_military_discount_finder_audit-scores-3",
      "name": "Scores primary",
      "category": "scores",
      "tags": [
        "military",
        "military",
        "discount"
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
      "id": "military_military_discount_finder_audit-fixes-4",
      "name": "Fixes primary",
      "category": "fixes",
      "tags": [
        "military",
        "military",
        "discount"
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
      "id": "military_military_discount_finder_audit-review-5",
      "name": "Review backup",
      "category": "review",
      "tags": [
        "military",
        "military",
        "discount"
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
      "id": "military_military_discount_finder_audit-gaps-6",
      "name": "Gaps backup",
      "category": "gaps",
      "tags": [
        "military",
        "military",
        "discount"
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
      "id": "military_military_discount_finder_audit-scores-7",
      "name": "Scores backup",
      "category": "scores",
      "tags": [
        "military",
        "military",
        "discount"
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
      "id": "military_military_discount_finder_audit-fixes-8",
      "name": "Fixes backup",
      "category": "fixes",
      "tags": [
        "military",
        "military",
        "discount"
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
