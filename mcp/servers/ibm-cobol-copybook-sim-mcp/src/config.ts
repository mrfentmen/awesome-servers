import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "ibm-cobol-copybook-sim-mcp",
  "title": "COBOL Copybook Simulator",
  "description": "Simulate cobol copybook by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "cobol_copybook_sim",
  "entity": "copybook field simulation",
  "categories": [
    {
      "id": "fields",
      "label": "Fields",
      "baseline": 2
    },
    {
      "id": "pic",
      "label": "PIC",
      "baseline": 1
    },
    {
      "id": "redefines",
      "label": "Redefines",
      "baseline": 1
    },
    {
      "id": "length",
      "label": "Length",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "field_count",
    "label": "Field count",
    "unit": "fields",
    "target": 40,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 50,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "fields",
      "label": "Fields",
      "categories": [
        "fields"
      ]
    },
    {
      "id": "pic",
      "label": "PIC",
      "categories": [
        "pic"
      ]
    },
    {
      "id": "redefines",
      "label": "Redefines",
      "categories": [
        "redefines"
      ]
    },
    {
      "id": "length",
      "label": "Length",
      "categories": [
        "length"
      ]
    }
  ],
  "sample": [
    {
      "id": "cobol_copybook_sim-customer-record",
      "name": "Customer record",
      "category": "fields",
      "tags": [
        "fields"
      ],
      "cost": 0,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "cobol_copybook_sim-pic-clause",
      "name": "PIC clause",
      "category": "pic",
      "tags": [
        "pic"
      ],
      "cost": 0,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "cobol_copybook_sim-redefine-block",
      "name": "Redefine block",
      "category": "redefines",
      "tags": [
        "redefines"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "cobol_copybook_sim-record-length",
      "name": "Record length",
      "category": "length",
      "tags": [
        "length"
      ],
      "cost": 0,
      "quantity": 320,
      "condition": "good"
    }
  ]
}
