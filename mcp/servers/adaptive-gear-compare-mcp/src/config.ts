import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "adaptive-gear-compare-mcp",
  "title": "adaptive gear compare Compare",
  "description": "Real local JSON analysis of adaptive gear compare in the Accessibility & Disability lane. 25 MCP tools, no paywall.",
  "prefix": "access_adaptive_gear_compare",
  "entity": "adaptive gear compare item",
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
      "id": "adaptive-gear",
      "label": "adaptive-gear",
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
      "id": "access_adaptive_gear_compare-access-1",
      "name": "access primary",
      "category": "access",
      "tags": [
        "accessibility-disability",
        "adaptive",
        "gear"
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
      "id": "access_adaptive_gear_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "accessibility-disability",
        "adaptive",
        "gear"
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
      "id": "access_adaptive_gear_compare-adaptive-gear-3",
      "name": "adaptive-gear primary",
      "category": "adaptive-gear",
      "tags": [
        "accessibility-disability",
        "adaptive",
        "gear"
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
      "id": "access_adaptive_gear_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "accessibility-disability",
        "adaptive",
        "gear"
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
      "id": "access_adaptive_gear_compare-access-5",
      "name": "access backup",
      "category": "access",
      "tags": [
        "accessibility-disability",
        "adaptive",
        "gear"
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
      "id": "access_adaptive_gear_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "accessibility-disability",
        "adaptive",
        "gear"
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
      "id": "access_adaptive_gear_compare-adaptive-gear-7",
      "name": "adaptive-gear backup",
      "category": "adaptive-gear",
      "tags": [
        "accessibility-disability",
        "adaptive",
        "gear"
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
      "id": "access_adaptive_gear_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "accessibility-disability",
        "adaptive",
        "gear"
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
