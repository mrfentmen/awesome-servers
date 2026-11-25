import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "climbing-gym-compare-mcp",
  "title": "climbing gym compare Compare",
  "description": "Real local JSON analysis of climbing gym compare in the Fishing Hunting Camping lane. 25 MCP tools, no paywall.",
  "prefix": "outdoors_climbing_gym_compare",
  "entity": "climbing gym compare item",
  "categories": [
    {
      "id": "outdoors",
      "label": "outdoors",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "climbing-gym",
      "label": "climbing-gym",
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
        "outdoors"
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
      "id": "outdoors_climbing_gym_compare-outdoors-1",
      "name": "outdoors primary",
      "category": "outdoors",
      "tags": [
        "fishing-hunting-camping",
        "climbing",
        "gym"
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
      "id": "outdoors_climbing_gym_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "fishing-hunting-camping",
        "climbing",
        "gym"
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
      "id": "outdoors_climbing_gym_compare-climbing-gym-3",
      "name": "climbing-gym primary",
      "category": "climbing-gym",
      "tags": [
        "fishing-hunting-camping",
        "climbing",
        "gym"
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
      "id": "outdoors_climbing_gym_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "fishing-hunting-camping",
        "climbing",
        "gym"
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
      "id": "outdoors_climbing_gym_compare-outdoors-5",
      "name": "outdoors backup",
      "category": "outdoors",
      "tags": [
        "fishing-hunting-camping",
        "climbing",
        "gym"
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
      "id": "outdoors_climbing_gym_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "fishing-hunting-camping",
        "climbing",
        "gym"
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
      "id": "outdoors_climbing_gym_compare-climbing-gym-7",
      "name": "climbing-gym backup",
      "category": "climbing-gym",
      "tags": [
        "fishing-hunting-camping",
        "climbing",
        "gym"
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
      "id": "outdoors_climbing_gym_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "fishing-hunting-camping",
        "climbing",
        "gym"
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
