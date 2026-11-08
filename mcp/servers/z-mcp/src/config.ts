import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "z",
  "displayName": "Z",
  "version": "1.0.0",
  "extensions": [
    ".z"
  ],
  "markers": [],
  "comment": "--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "schema",
      "pattern": "^\\s*([A-Z][A-Za-z0-9_]*)\\s*=="
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.z",
      "content": "Demo == [ value : N | true ]\n"
    },
    {
      "path": "tests/run.z",
      "content": "Demo == [ value : N | true ]\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Demo == [ value : N | true ]\n"
    }
  },
  "reference": "Z syntax reference\n- Example: Demo == [ value : N | true ]"
}
