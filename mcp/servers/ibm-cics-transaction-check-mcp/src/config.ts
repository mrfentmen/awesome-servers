import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "ibm-cics-transaction-check-mcp",
  "title": "CICS Transaction Audit",
  "description": "Audit CICS transaction names, programs, files and response targets. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "cics_transaction",
  "entity": "CICS transaction",
  "categories": [
    {
      "id": "names",
      "label": "Names",
      "baseline": 2
    },
    {
      "id": "programs",
      "label": "Programs",
      "baseline": 1
    },
    {
      "id": "files",
      "label": "Files",
      "baseline": 1
    },
    {
      "id": "response",
      "label": "Response",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "response_ms",
    "label": "Response time",
    "unit": "ms",
    "target": 500,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "names",
      "label": "Names",
      "categories": [
        "names"
      ]
    },
    {
      "id": "programs",
      "label": "Programs",
      "categories": [
        "programs"
      ]
    },
    {
      "id": "files",
      "label": "Files",
      "categories": [
        "files"
      ]
    },
    {
      "id": "response",
      "label": "Response",
      "categories": [
        "response"
      ]
    }
  ],
  "sample": [
    {
      "id": "cics_transaction-inquiry-transaction",
      "name": "Inquiry transaction",
      "category": "names",
      "tags": [
        "names"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "cics_transaction-program-map",
      "name": "Program map",
      "category": "programs",
      "tags": [
        "programs"
      ],
      "cost": 0,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "cics_transaction-file-control",
      "name": "File control",
      "category": "files",
      "tags": [
        "files"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "cics_transaction-response-target",
      "name": "Response target",
      "category": "response",
      "tags": [
        "response"
      ],
      "cost": 0,
      "quantity": 250,
      "condition": "good"
    }
  ]
}
