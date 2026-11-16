import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "accessibility-caption-quality-check-mcp",
  "title": "Caption Quality Audit",
  "description": "Audit caption quality by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "caption_quality",
  "entity": "caption track",
  "categories": [
    {
      "id": "accuracy",
      "label": "Accuracy",
      "baseline": 3
    },
    {
      "id": "timing",
      "label": "Timing",
      "baseline": 2
    },
    {
      "id": "speaker",
      "label": "Speaker labels",
      "baseline": 1
    },
    {
      "id": "sound",
      "label": "Sound effects",
      "baseline": 1
    },
    {
      "id": "readability",
      "label": "Readability",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "error_rate_pct",
    "label": "Caption error rate",
    "unit": "%",
    "target": 2,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 500,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "accuracy",
      "label": "Accurate words",
      "categories": [
        "accuracy"
      ]
    },
    {
      "id": "timing",
      "label": "Synced timing",
      "categories": [
        "timing"
      ]
    },
    {
      "id": "speakers",
      "label": "Speaker labels",
      "categories": [
        "speaker"
      ]
    },
    {
      "id": "sounds",
      "label": "Sound description",
      "categories": [
        "sound"
      ]
    },
    {
      "id": "readability",
      "label": "Readable lines",
      "categories": [
        "readability"
      ]
    }
  ],
  "sample": [
    {
      "id": "caption_quality-lecture",
      "name": "Lecture captions",
      "category": "accuracy",
      "tags": [
        "human",
        "technical"
      ],
      "cost": 4,
      "quantity": 0.5,
      "condition": "good"
    },
    {
      "id": "caption_quality-interview",
      "name": "Interview captions",
      "category": "accuracy",
      "tags": [
        "human",
        "names"
      ],
      "cost": 4,
      "quantity": 1.2,
      "condition": "good"
    },
    {
      "id": "caption_quality-panel",
      "name": "Panel captions",
      "category": "accuracy",
      "tags": [
        "auto",
        "overlap"
      ],
      "cost": 6,
      "quantity": 3.5,
      "condition": "fair"
    },
    {
      "id": "caption_quality-live",
      "name": "Live captions",
      "category": "timing",
      "tags": [
        "auto",
        "delay"
      ],
      "cost": 5,
      "quantity": 2.8,
      "condition": "fair"
    },
    {
      "id": "caption_quality-tutorial",
      "name": "Tutorial captions",
      "category": "timing",
      "tags": [
        "human",
        "step"
      ],
      "cost": 4,
      "quantity": 1.8,
      "condition": "good"
    },
    {
      "id": "caption_quality-webinar",
      "name": "Webinar captions",
      "category": "speaker",
      "tags": [
        "auto",
        "multi-speaker"
      ],
      "cost": 7,
      "quantity": 4.2,
      "condition": "worn"
    },
    {
      "id": "caption_quality-film",
      "name": "Short film captions",
      "category": "sound",
      "tags": [
        "human",
        "effects"
      ],
      "cost": 3,
      "quantity": 0.9,
      "condition": "good"
    },
    {
      "id": "caption_quality-course",
      "name": "Course captions",
      "category": "readability",
      "tags": [
        "human",
        "two-line"
      ],
      "cost": 4,
      "quantity": 2.1,
      "condition": "good"
    }
  ]
}
