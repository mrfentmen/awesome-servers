import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "school-safety-drill-compare-mcp",
  "title": "school safety drill compare Compare",
  "description": "Real local JSON analysis of school safety drill compare in the K-12 Schools lane. 25 MCP tools, no paywall.",
  "prefix": "k12_school_safety_drill_compare",
  "entity": "school safety drill compare item",
  "categories": [
    {
      "id": "k12",
      "label": "k12",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "school-safety-drill",
      "label": "school-safety-drill",
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
        "k12"
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
      "id": "k12_school_safety_drill_compare-k12-1",
      "name": "k12 primary",
      "category": "k12",
      "tags": [
        "k-12-schools",
        "school",
        "safety"
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
      "id": "k12_school_safety_drill_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "k-12-schools",
        "school",
        "safety"
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
      "id": "k12_school_safety_drill_compare-school-safety-drill-3",
      "name": "school-safety-drill primary",
      "category": "school-safety-drill",
      "tags": [
        "k-12-schools",
        "school",
        "safety"
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
      "id": "k12_school_safety_drill_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "k-12-schools",
        "school",
        "safety"
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
      "id": "k12_school_safety_drill_compare-k12-5",
      "name": "k12 backup",
      "category": "k12",
      "tags": [
        "k-12-schools",
        "school",
        "safety"
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
      "id": "k12_school_safety_drill_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "k-12-schools",
        "school",
        "safety"
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
      "id": "k12_school_safety_drill_compare-school-safety-drill-7",
      "name": "school-safety-drill backup",
      "category": "school-safety-drill",
      "tags": [
        "k-12-schools",
        "school",
        "safety"
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
      "id": "k12_school_safety_drill_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "k-12-schools",
        "school",
        "safety"
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
