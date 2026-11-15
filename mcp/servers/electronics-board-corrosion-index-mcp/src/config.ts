import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "electronics-board-corrosion-index-mcp",
  "title": "Board Corrosion Archive",
  "description": "Archive board corrosion by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "board_corrosion_index",
  "entity": "board inspection archive",
  "categories": [
    {
      "id": "power",
      "label": "Power contacts",
      "baseline": 1
    },
    {
      "id": "connector",
      "label": "Connectors",
      "baseline": 1
    },
    {
      "id": "trace",
      "label": "Traces",
      "baseline": 1
    },
    {
      "id": "solder",
      "label": "Solder joints",
      "baseline": 1
    },
    {
      "id": "coating",
      "label": "Coatings",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "corrosion_score",
    "label": "Corrosion score",
    "unit": "score",
    "target": 20,
    "direction": "lower"
  },
  "target": {
    "maxItems": 15,
    "budget": 80,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "power",
      "label": "Power path",
      "categories": [
        "power"
      ]
    },
    {
      "id": "connector",
      "label": "Connector path",
      "categories": [
        "connector"
      ]
    },
    {
      "id": "conductor",
      "label": "Conductor path",
      "categories": [
        "trace",
        "solder"
      ]
    },
    {
      "id": "protection",
      "label": "Protection",
      "categories": [
        "coating"
      ]
    }
  ],
  "sample": [
    {
      "id": "board_corrosion_index-battery",
      "name": "Battery contacts",
      "category": "power",
      "tags": [
        "alkaline",
        "residue"
      ],
      "cost": 0,
      "quantity": 28,
      "condition": "fair"
    },
    {
      "id": "board_corrosion_index-usb",
      "name": "USB port",
      "category": "connector",
      "tags": [
        "salt-mist",
        "pins"
      ],
      "cost": 0,
      "quantity": 35,
      "condition": "fair"
    },
    {
      "id": "board_corrosion_index-clock",
      "name": "Clock trace",
      "category": "trace",
      "tags": [
        "humidity",
        "fine"
      ],
      "cost": 0,
      "quantity": 18,
      "condition": "good"
    },
    {
      "id": "board_corrosion_index-header",
      "name": "Header joint",
      "category": "solder",
      "tags": [
        "flux",
        "reflow"
      ],
      "cost": 0,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "board_corrosion_index-coating",
      "name": "Conformal coat",
      "category": "coating",
      "tags": [
        "acrylic",
        "protective"
      ],
      "cost": 18,
      "quantity": 8,
      "condition": "new"
    },
    {
      "id": "board_corrosion_index-edge",
      "name": "Board edge",
      "category": "trace",
      "tags": [
        "salt-mist",
        "exposed"
      ],
      "cost": 0,
      "quantity": 42,
      "condition": "worn"
    }
  ]
}
