import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "gyp",
  "displayName": "GYP",
  "version": "1.0.0",
  "extensions": [
    ".gyp"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "target",
      "pattern": "\"target_name\"\\s*:\\s*\"([^\"]+)\""
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.gyp",
      "content": "{\n  \"targets\": [{\"target_name\": \"demo\", \"sources\": [\"demo.cc\"]}]\n}\n"
    },
    {
      "path": "tests/run.gyp",
      "content": "{\n  \"targets\": [{\"target_name\": \"demo\", \"sources\": [\"demo.cc\"]}]\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "{\n  \"targets\": [{\"target_name\": \"demo\", \"sources\": [\"demo.cc\"]}]\n}\n"
    }
  },
  "reference": "GYP syntax reference\n- Example: {"
}
