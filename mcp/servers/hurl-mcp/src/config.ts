import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "hurl",
  "displayName": "Hurl",
  "version": "1.0.0",
  "extensions": [
    ".hurl"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "request",
      "pattern": "^(GET|POST|PUT|DELETE|PATCH)\\s"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.hurl",
      "content": "GET https://example.com\nHTTP 200\n"
    },
    {
      "path": "tests/run.hurl",
      "content": "GET https://example.com\nHTTP 200\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "GET https://example.com\nHTTP 200\n"
    }
  },
  "reference": "Hurl syntax reference\n- Example: GET https://example.com\n- Comment: #\n- Run: hurl {file}"
}
