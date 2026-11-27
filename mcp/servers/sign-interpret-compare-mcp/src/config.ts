import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "sign-interpret-compare-mcp",
  "title": "sign interpret compare Compare",
  "description": "Real local JSON analysis of sign interpret compare in the Accessibility & Disability lane. 25 MCP tools, no paywall.",
  "prefix": "access_sign_interpret_compare",
  "entity": "sign interpret compare item",
  "categories": [
    {
      "id": "access",
      "label": "access",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "sign-interpret",
      "label": "sign-interpret",
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
        "access"
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
      "id": "access_sign_interpret_compare-access-1",
      "name": "access primary",
      "category": "access",
      "tags": [
        "accessibility-disability",
        "sign",
        "interpret"
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
      "id": "access_sign_interpret_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "accessibility-disability",
        "sign",
        "interpret"
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
      "id": "access_sign_interpret_compare-sign-interpret-3",
      "name": "sign-interpret primary",
      "category": "sign-interpret",
      "tags": [
        "accessibility-disability",
        "sign",
        "interpret"
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
      "id": "access_sign_interpret_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "accessibility-disability",
        "sign",
        "interpret"
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
      "id": "access_sign_interpret_compare-access-5",
      "name": "access backup",
      "category": "access",
      "tags": [
        "accessibility-disability",
        "sign",
        "interpret"
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
      "id": "access_sign_interpret_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "accessibility-disability",
        "sign",
        "interpret"
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
      "id": "access_sign_interpret_compare-sign-interpret-7",
      "name": "sign-interpret backup",
      "category": "sign-interpret",
      "tags": [
        "accessibility-disability",
        "sign",
        "interpret"
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
      "id": "access_sign_interpret_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "accessibility-disability",
        "sign",
        "interpret"
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
