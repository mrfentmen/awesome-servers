import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "education-reading-level-check-mcp",
  "title": "Reading Level Audit",
  "description": "Audit phonics, vocabulary, fluency and comprehension resources for level fit and coverage gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "reading_level",
  "entity": "reading resource",
  "categories": [
    {
      "id": "phonics",
      "label": "Phonics",
      "baseline": 2
    },
    {
      "id": "vocabulary",
      "label": "Vocabulary",
      "baseline": 2
    },
    {
      "id": "fluency",
      "label": "Fluency",
      "baseline": 2
    },
    {
      "id": "comprehension",
      "label": "Comprehension",
      "baseline": 3
    }
  ],
  "metric": {
    "id": "comprehension_pct",
    "label": "Comprehension",
    "unit": "%",
    "target": 80,
    "direction": "higher"
  },
  "target": {
    "maxItems": 30,
    "budget": 100,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "phonics",
      "label": "Phonics",
      "categories": [
        "phonics"
      ]
    },
    {
      "id": "vocabulary",
      "label": "Vocabulary",
      "categories": [
        "vocabulary"
      ]
    },
    {
      "id": "fluency",
      "label": "Fluency",
      "categories": [
        "fluency"
      ]
    },
    {
      "id": "comprehension",
      "label": "Comprehension",
      "categories": [
        "comprehension"
      ]
    }
  ],
  "sample": [
    {
      "id": "reading_level-short-vowel-decodable",
      "name": "Short vowel decodable",
      "category": "phonics",
      "tags": [
        "phonics",
        "k-1"
      ],
      "cost": 6,
      "quantity": 86,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "reading_level-blends-decodable",
      "name": "Blends decodable",
      "category": "phonics",
      "tags": [
        "phonics",
        "grade-1"
      ],
      "cost": 6,
      "quantity": 78,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "reading_level-tier-2-word-cards",
      "name": "Tier 2 word cards",
      "category": "vocabulary",
      "tags": [
        "vocabulary",
        "tier-2"
      ],
      "cost": 12,
      "quantity": 82,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "reading_level-context-clue-set",
      "name": "Context clue set",
      "category": "vocabulary",
      "tags": [
        "vocabulary",
        "context"
      ],
      "cost": 8,
      "quantity": 72,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "reading_level-repeated-reading-passage",
      "name": "Repeated reading passage",
      "category": "fluency",
      "tags": [
        "fluency",
        "timed"
      ],
      "cost": 4,
      "quantity": 90,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "reading_level-partner-reading-script",
      "name": "Partner reading script",
      "category": "fluency",
      "tags": [
        "fluency",
        "peer"
      ],
      "cost": 0,
      "quantity": 76,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "reading_level-story-retell-cards",
      "name": "Story retell cards",
      "category": "comprehension",
      "tags": [
        "comprehension",
        "retell"
      ],
      "cost": 10,
      "quantity": 88,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "reading_level-inference-practice",
      "name": "Inference practice",
      "category": "comprehension",
      "tags": [
        "comprehension",
        "inference"
      ],
      "cost": 7,
      "quantity": 68,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "reading_level-main-idea-passage",
      "name": "Main idea passage",
      "category": "comprehension",
      "tags": [
        "comprehension",
        "main-idea"
      ],
      "cost": 5,
      "quantity": 74,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    }
  ]
}
