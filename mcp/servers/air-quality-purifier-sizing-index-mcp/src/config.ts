import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "air-quality-purifier-sizing-index-mcp",
  "title": "Purifier Sizing Archive",
  "description": "Archive purifier sizing by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "purifier_sizing_index",
  "entity": "purifier setup archive",
  "categories": [
    {
      "id": "room",
      "label": "Room",
      "baseline": 2
    },
    {
      "id": "filter",
      "label": "Filter",
      "baseline": 1
    },
    {
      "id": "airflow",
      "label": "Airflow",
      "baseline": 1
    },
    {
      "id": "power",
      "label": "Power",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "clean_air_rate",
    "label": "Clean air rate",
    "unit": "CFM",
    "target": 200,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 600,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "room",
      "label": "Room",
      "categories": [
        "room"
      ]
    },
    {
      "id": "filter",
      "label": "Filter",
      "categories": [
        "filter"
      ]
    },
    {
      "id": "airflow",
      "label": "Airflow",
      "categories": [
        "airflow"
      ]
    },
    {
      "id": "power",
      "label": "Power",
      "categories": [
        "power"
      ]
    }
  ],
  "sample": [
    {
      "id": "purifier_sizing_index-living-room-purifier",
      "name": "Living room purifier",
      "category": "room",
      "tags": [
        "room"
      ],
      "cost": 300,
      "quantity": 250,
      "condition": "good"
    },
    {
      "id": "purifier_sizing_index-hepa-filter",
      "name": "HEPA filter",
      "category": "filter",
      "tags": [
        "filter"
      ],
      "cost": 80,
      "quantity": 1,
      "condition": "new"
    },
    {
      "id": "purifier_sizing_index-airflow-meter",
      "name": "Airflow meter",
      "category": "airflow",
      "tags": [
        "airflow"
      ],
      "cost": 50,
      "quantity": 300,
      "condition": "good"
    },
    {
      "id": "purifier_sizing_index-smart-plug",
      "name": "Smart plug",
      "category": "power",
      "tags": [
        "power"
      ],
      "cost": 30,
      "quantity": 45,
      "condition": "new"
    }
  ]
}
