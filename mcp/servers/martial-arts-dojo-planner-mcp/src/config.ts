import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "martial-arts-dojo-planner-mcp",
  "title": "martial arts dojo planner Planner",
  "description": "Real local JSON analysis of martial arts dojo planner in the Youth & Amateur Sports lane. 25 MCP tools, no paywall.",
  "prefix": "youthsports_martial_arts_dojo_planner",
  "entity": "martial arts dojo planner item",
  "categories": [
    {
      "id": "youthsports",
      "label": "youthsports",
      "baseline": 2
    },
    {
      "id": "planner",
      "label": "planner",
      "baseline": 2
    },
    {
      "id": "martial-arts-dojo",
      "label": "martial-arts-dojo",
      "baseline": 2
    },
    {
      "id": "mcp",
      "label": "mcp",
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
        "youthsports"
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
      "id": "youthsports_martial_arts_dojo_planner-youthsports-1",
      "name": "youthsports primary",
      "category": "youthsports",
      "tags": [
        "youth-amateur-sports",
        "martial",
        "arts"
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
      "id": "youthsports_martial_arts_dojo_planner-planner-2",
      "name": "planner primary",
      "category": "planner",
      "tags": [
        "youth-amateur-sports",
        "martial",
        "arts"
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
      "id": "youthsports_martial_arts_dojo_planner-martial-arts-dojo-3",
      "name": "martial-arts-dojo primary",
      "category": "martial-arts-dojo",
      "tags": [
        "youth-amateur-sports",
        "martial",
        "arts"
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
      "id": "youthsports_martial_arts_dojo_planner-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "youth-amateur-sports",
        "martial",
        "arts"
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
      "id": "youthsports_martial_arts_dojo_planner-youthsports-5",
      "name": "youthsports backup",
      "category": "youthsports",
      "tags": [
        "youth-amateur-sports",
        "martial",
        "arts"
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
      "id": "youthsports_martial_arts_dojo_planner-planner-6",
      "name": "planner backup",
      "category": "planner",
      "tags": [
        "youth-amateur-sports",
        "martial",
        "arts"
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
      "id": "youthsports_martial_arts_dojo_planner-martial-arts-dojo-7",
      "name": "martial-arts-dojo backup",
      "category": "martial-arts-dojo",
      "tags": [
        "youth-amateur-sports",
        "martial",
        "arts"
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
      "id": "youthsports_martial_arts_dojo_planner-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "youth-amateur-sports",
        "martial",
        "arts"
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
