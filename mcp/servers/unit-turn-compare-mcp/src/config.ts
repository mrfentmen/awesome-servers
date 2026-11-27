import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "unit-turn-compare-mcp",
  "title": "unit turn compare Compare",
  "description": "Real local JSON analysis of unit turn compare in the Property & Insurance Ops lane. 25 MCP tools, no paywall.",
  "prefix": "prop_unit_turn_compare",
  "entity": "unit turn compare item",
  "categories": [
    {
      "id": "prop",
      "label": "prop",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "unit-turn",
      "label": "unit-turn",
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
        "prop"
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
      "id": "prop_unit_turn_compare-prop-1",
      "name": "prop primary",
      "category": "prop",
      "tags": [
        "property-insurance-ops",
        "unit",
        "turn"
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
      "id": "prop_unit_turn_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "property-insurance-ops",
        "unit",
        "turn"
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
      "id": "prop_unit_turn_compare-unit-turn-3",
      "name": "unit-turn primary",
      "category": "unit-turn",
      "tags": [
        "property-insurance-ops",
        "unit",
        "turn"
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
      "id": "prop_unit_turn_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "property-insurance-ops",
        "unit",
        "turn"
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
      "id": "prop_unit_turn_compare-prop-5",
      "name": "prop backup",
      "category": "prop",
      "tags": [
        "property-insurance-ops",
        "unit",
        "turn"
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
      "id": "prop_unit_turn_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "property-insurance-ops",
        "unit",
        "turn"
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
      "id": "prop_unit_turn_compare-unit-turn-7",
      "name": "unit-turn backup",
      "category": "unit-turn",
      "tags": [
        "property-insurance-ops",
        "unit",
        "turn"
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
      "id": "prop_unit_turn_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "property-insurance-ops",
        "unit",
        "turn"
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
