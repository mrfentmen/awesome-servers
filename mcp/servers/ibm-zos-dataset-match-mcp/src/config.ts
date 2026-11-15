import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "ibm-zos-dataset-match-mcp",
  "title": "z/OS Dataset Match Audit",
  "description": "Match z/os dataset by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "zos_dataset_match",
  "entity": "z/OS dataset match",
  "categories": [
    {
      "id": "names",
      "label": "Names",
      "baseline": 2
    },
    {
      "id": "space",
      "label": "Space",
      "baseline": 1
    },
    {
      "id": "retention",
      "label": "Retention",
      "baseline": 1
    },
    {
      "id": "backup",
      "label": "Backup",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "used_tracks",
    "label": "Used tracks",
    "unit": "tracks",
    "target": 1000,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 100,
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
      "id": "space",
      "label": "Space",
      "categories": [
        "space"
      ]
    },
    {
      "id": "retention",
      "label": "Retention",
      "categories": [
        "retention"
      ]
    },
    {
      "id": "backup",
      "label": "Backup",
      "categories": [
        "backup"
      ]
    }
  ],
  "sample": [
    {
      "id": "zos_dataset_match-master-dataset",
      "name": "Master dataset",
      "category": "names",
      "tags": [
        "names"
      ],
      "cost": 0,
      "quantity": 600,
      "condition": "good"
    },
    {
      "id": "zos_dataset_match-temp-dataset",
      "name": "Temp dataset",
      "category": "space",
      "tags": [
        "space"
      ],
      "cost": 0,
      "quantity": 200,
      "condition": "good"
    },
    {
      "id": "zos_dataset_match-retention-rule",
      "name": "Retention rule",
      "category": "retention",
      "tags": [
        "retention"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "zos_dataset_match-backup-copy",
      "name": "Backup copy",
      "category": "backup",
      "tags": [
        "backup"
      ],
      "cost": 30,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
