import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "weather-balloon-audit-mcp",
  "title": "weather balloon audit Audit",
  "description": "Real local JSON analysis of weather balloon audit in the Science & Lab lane. 25 MCP tools, no paywall.",
  "prefix": "sci_weather_balloon_audit",
  "entity": "weather balloon audit item",
  "categories": [
    {
      "id": "sci",
      "label": "sci",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "weather-balloon",
      "label": "weather-balloon",
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
        "sci"
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
      "id": "sci_weather_balloon_audit-sci-1",
      "name": "sci primary",
      "category": "sci",
      "tags": [
        "science-lab",
        "weather",
        "balloon"
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
      "id": "sci_weather_balloon_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "science-lab",
        "weather",
        "balloon"
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
      "id": "sci_weather_balloon_audit-weather-balloon-3",
      "name": "weather-balloon primary",
      "category": "weather-balloon",
      "tags": [
        "science-lab",
        "weather",
        "balloon"
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
      "id": "sci_weather_balloon_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "science-lab",
        "weather",
        "balloon"
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
      "id": "sci_weather_balloon_audit-sci-5",
      "name": "sci backup",
      "category": "sci",
      "tags": [
        "science-lab",
        "weather",
        "balloon"
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
      "id": "sci_weather_balloon_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "science-lab",
        "weather",
        "balloon"
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
      "id": "sci_weather_balloon_audit-weather-balloon-7",
      "name": "weather-balloon backup",
      "category": "weather-balloon",
      "tags": [
        "science-lab",
        "weather",
        "balloon"
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
      "id": "sci_weather_balloon_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "science-lab",
        "weather",
        "balloon"
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
