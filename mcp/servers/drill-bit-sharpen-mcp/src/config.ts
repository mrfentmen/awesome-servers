import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "drill-bit-sharpen-mcp",
  "title": "Drill Bit Sharpen Planner",
  "description": "Real local JSON analysis of drill bit sharpen in the Drill Bit lane. 25 MCP tools, no paywall.",
  "prefix": "drill_bit_drill_bit_sharpen",
  "entity": "drill bit sharpen item",
  "categories": [
    {
      "id": "coverage",
      "label": "Coverage",
      "baseline": 2
    },
    {
      "id": "gaps",
      "label": "Gaps",
      "baseline": 2
    },
    {
      "id": "costs",
      "label": "Costs",
      "baseline": 2
    },
    {
      "id": "deadlines",
      "label": "Deadlines",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to deadline",
    "unit": "days",
    "target": 30,
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
        "coverage"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "deadlines"
      ]
    }
  ],
  "sample": [
    {
      "id": "drill_bit_drill_bit_sharpen-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "drill-bit",
        "drill",
        "bit"
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
      "id": "drill_bit_drill_bit_sharpen-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "drill-bit",
        "drill",
        "bit"
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
      "id": "drill_bit_drill_bit_sharpen-costs-3",
      "name": "Costs primary",
      "category": "costs",
      "tags": [
        "drill-bit",
        "drill",
        "bit"
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
      "id": "drill_bit_drill_bit_sharpen-deadlines-4",
      "name": "Deadlines primary",
      "category": "deadlines",
      "tags": [
        "drill-bit",
        "drill",
        "bit"
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
      "id": "drill_bit_drill_bit_sharpen-coverage-5",
      "name": "Coverage backup",
      "category": "coverage",
      "tags": [
        "drill-bit",
        "drill",
        "bit"
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
      "id": "drill_bit_drill_bit_sharpen-gaps-6",
      "name": "Gaps backup",
      "category": "gaps",
      "tags": [
        "drill-bit",
        "drill",
        "bit"
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
      "id": "drill_bit_drill_bit_sharpen-costs-7",
      "name": "Costs backup",
      "category": "costs",
      "tags": [
        "drill-bit",
        "drill",
        "bit"
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
      "id": "drill_bit_drill_bit_sharpen-deadlines-8",
      "name": "Deadlines backup",
      "category": "deadlines",
      "tags": [
        "drill-bit",
        "drill",
        "bit"
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
