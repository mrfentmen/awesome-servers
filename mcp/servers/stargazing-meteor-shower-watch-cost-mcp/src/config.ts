import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "stargazing-meteor-shower-watch-cost-mcp",
  "title": "Meteor Shower Watch Budget",
  "description": "Real local JSON analysis of meteor shower watch in the Stargazing lane. 25 MCP tools, no paywall.",
  "prefix": "stargazing_stargazing_meteor_shower_watch_cost",
  "entity": "meteor shower watch item",
  "categories": [
    {
      "id": "line-items",
      "label": "Line items",
      "baseline": 2
    },
    {
      "id": "actuals",
      "label": "Actuals",
      "baseline": 2
    },
    {
      "id": "forecast",
      "label": "Forecast",
      "baseline": 2
    },
    {
      "id": "savings",
      "label": "Savings",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since review",
    "unit": "days",
    "target": 30,
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
        "line-items"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "savings"
      ]
    }
  ],
  "sample": [
    {
      "id": "stargazing_stargazing_meteor_shower_watch_cost-line-items-1",
      "name": "Line items primary",
      "category": "line-items",
      "tags": [
        "stargazing",
        "stargazing",
        "meteor"
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
      "id": "stargazing_stargazing_meteor_shower_watch_cost-actuals-2",
      "name": "Actuals primary",
      "category": "actuals",
      "tags": [
        "stargazing",
        "stargazing",
        "meteor"
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
      "id": "stargazing_stargazing_meteor_shower_watch_cost-forecast-3",
      "name": "Forecast primary",
      "category": "forecast",
      "tags": [
        "stargazing",
        "stargazing",
        "meteor"
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
      "id": "stargazing_stargazing_meteor_shower_watch_cost-savings-4",
      "name": "Savings primary",
      "category": "savings",
      "tags": [
        "stargazing",
        "stargazing",
        "meteor"
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
      "id": "stargazing_stargazing_meteor_shower_watch_cost-line-items-5",
      "name": "Line items backup",
      "category": "line-items",
      "tags": [
        "stargazing",
        "stargazing",
        "meteor"
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
      "id": "stargazing_stargazing_meteor_shower_watch_cost-actuals-6",
      "name": "Actuals backup",
      "category": "actuals",
      "tags": [
        "stargazing",
        "stargazing",
        "meteor"
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
      "id": "stargazing_stargazing_meteor_shower_watch_cost-forecast-7",
      "name": "Forecast backup",
      "category": "forecast",
      "tags": [
        "stargazing",
        "stargazing",
        "meteor"
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
      "id": "stargazing_stargazing_meteor_shower_watch_cost-savings-8",
      "name": "Savings backup",
      "category": "savings",
      "tags": [
        "stargazing",
        "stargazing",
        "meteor"
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
