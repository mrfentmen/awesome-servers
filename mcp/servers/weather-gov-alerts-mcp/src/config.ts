import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "weather-gov-alerts-mcp",
  "title": "Weather Gov Alerts Simulator",
  "description": "Real local JSON analysis of weather gov alerts in the Weather Gov lane. 25 MCP tools, no paywall.",
  "prefix": "weather_gov_weather_gov_alerts",
  "entity": "weather gov alerts item",
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
      "id": "weather_gov_weather_gov_alerts-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "weather-gov",
        "weather",
        "gov"
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
      "id": "weather_gov_weather_gov_alerts-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "weather-gov",
        "weather",
        "gov"
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
      "id": "weather_gov_weather_gov_alerts-costs-3",
      "name": "Costs primary",
      "category": "costs",
      "tags": [
        "weather-gov",
        "weather",
        "gov"
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
      "id": "weather_gov_weather_gov_alerts-deadlines-4",
      "name": "Deadlines primary",
      "category": "deadlines",
      "tags": [
        "weather-gov",
        "weather",
        "gov"
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
      "id": "weather_gov_weather_gov_alerts-coverage-5",
      "name": "Coverage backup",
      "category": "coverage",
      "tags": [
        "weather-gov",
        "weather",
        "gov"
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
      "id": "weather_gov_weather_gov_alerts-gaps-6",
      "name": "Gaps backup",
      "category": "gaps",
      "tags": [
        "weather-gov",
        "weather",
        "gov"
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
      "id": "weather_gov_weather_gov_alerts-costs-7",
      "name": "Costs backup",
      "category": "costs",
      "tags": [
        "weather-gov",
        "weather",
        "gov"
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
      "id": "weather_gov_weather_gov_alerts-deadlines-8",
      "name": "Deadlines backup",
      "category": "deadlines",
      "tags": [
        "weather-gov",
        "weather",
        "gov"
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
