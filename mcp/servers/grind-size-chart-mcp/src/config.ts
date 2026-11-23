import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "grind-size-chart-mcp",
  "title": "Grind Size Chart Guide",
  "description": "Real local JSON analysis of grind size chart in the Brew Bar lane. 25 MCP tools, no paywall.",
  "prefix": "brew_bar_grind_size_chart",
  "entity": "grind size chart item",
  "categories": [
    {
      "id": "steps",
      "label": "Steps",
      "baseline": 2
    },
    {
      "id": "tools",
      "label": "Tools",
      "baseline": 2
    },
    {
      "id": "parts",
      "label": "Parts",
      "baseline": 2
    },
    {
      "id": "safety",
      "label": "Safety",
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
        "steps"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "safety"
      ]
    }
  ],
  "sample": [
    {
      "id": "brew_bar_grind_size_chart-steps-1",
      "name": "Steps primary",
      "category": "steps",
      "tags": [
        "brew-bar",
        "grind",
        "size"
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
      "id": "brew_bar_grind_size_chart-tools-2",
      "name": "Tools primary",
      "category": "tools",
      "tags": [
        "brew-bar",
        "grind",
        "size"
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
      "id": "brew_bar_grind_size_chart-parts-3",
      "name": "Parts primary",
      "category": "parts",
      "tags": [
        "brew-bar",
        "grind",
        "size"
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
      "id": "brew_bar_grind_size_chart-safety-4",
      "name": "Safety primary",
      "category": "safety",
      "tags": [
        "brew-bar",
        "grind",
        "size"
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
      "id": "brew_bar_grind_size_chart-steps-5",
      "name": "Steps backup",
      "category": "steps",
      "tags": [
        "brew-bar",
        "grind",
        "size"
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
      "id": "brew_bar_grind_size_chart-tools-6",
      "name": "Tools backup",
      "category": "tools",
      "tags": [
        "brew-bar",
        "grind",
        "size"
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
      "id": "brew_bar_grind_size_chart-parts-7",
      "name": "Parts backup",
      "category": "parts",
      "tags": [
        "brew-bar",
        "grind",
        "size"
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
      "id": "brew_bar_grind_size_chart-safety-8",
      "name": "Safety backup",
      "category": "safety",
      "tags": [
        "brew-bar",
        "grind",
        "size"
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
