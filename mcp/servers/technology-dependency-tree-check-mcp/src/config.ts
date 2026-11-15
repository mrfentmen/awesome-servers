import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "technology-dependency-tree-check-mcp",
  "title": "Dependency Tree Audit",
  "description": "Audit runtime, development, peer and transitive dependencies for age, licence and upgrade gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "dependency_tree",
  "entity": "dependency",
  "categories": [
    {
      "id": "runtime",
      "label": "Runtime",
      "baseline": 4
    },
    {
      "id": "development",
      "label": "Development",
      "baseline": 3
    },
    {
      "id": "peer",
      "label": "Peer",
      "baseline": 2
    },
    {
      "id": "transitive",
      "label": "Transitive",
      "baseline": 3
    }
  ],
  "metric": {
    "id": "outdated_days",
    "label": "Outdated days",
    "unit": "days",
    "target": 90,
    "direction": "lower"
  },
  "target": {
    "maxItems": 30,
    "budget": 550,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "runtime",
      "label": "Runtime",
      "categories": [
        "runtime"
      ]
    },
    {
      "id": "development",
      "label": "Development",
      "categories": [
        "development"
      ]
    },
    {
      "id": "peer",
      "label": "Peer",
      "categories": [
        "peer"
      ]
    },
    {
      "id": "transitive",
      "label": "Transitive",
      "categories": [
        "transitive"
      ]
    }
  ],
  "sample": [
    {
      "id": "dependency_tree-react",
      "name": "react",
      "category": "runtime",
      "tags": [
        "runtime",
        "ui"
      ],
      "cost": 0,
      "quantity": 31,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "dependency_tree-zod",
      "name": "zod",
      "category": "runtime",
      "tags": [
        "runtime",
        "schema"
      ],
      "cost": 0,
      "quantity": 12,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "dependency_tree-vite",
      "name": "vite",
      "category": "development",
      "tags": [
        "build"
      ],
      "cost": 0,
      "quantity": 48,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "dependency_tree-typescript",
      "name": "typescript",
      "category": "development",
      "tags": [
        "build"
      ],
      "cost": 0,
      "quantity": 17,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "dependency_tree-eslint-plugin-react",
      "name": "eslint-plugin-react",
      "category": "development",
      "tags": [
        "lint"
      ],
      "cost": 0,
      "quantity": 140,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "dependency_tree-react-dom",
      "name": "react-dom",
      "category": "peer",
      "tags": [
        "peer",
        "ui"
      ],
      "cost": 0,
      "quantity": 31,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "dependency_tree-types-node",
      "name": "@types/node",
      "category": "peer",
      "tags": [
        "peer",
        "types"
      ],
      "cost": 0,
      "quantity": 95,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "dependency_tree-minimist",
      "name": "minimist",
      "category": "transitive",
      "tags": [
        "transitive",
        "cli"
      ],
      "cost": 12,
      "quantity": 420,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "worn"
    },
    {
      "id": "dependency_tree-postcss",
      "name": "postcss",
      "category": "transitive",
      "tags": [
        "transitive",
        "css"
      ],
      "cost": 0,
      "quantity": 75,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "dependency_tree-braces",
      "name": "braces",
      "category": "transitive",
      "tags": [
        "transitive",
        "glob"
      ],
      "cost": 0,
      "quantity": 260,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    }
  ]
}
