import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "fluent",
  "displayName": "Fluent",
  "version": "1.0.0",
  "extensions": [
    ".ftl"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "message",
      "pattern": "^([A-Za-z_]\\w*)\\s*="
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.ftl",
      "content": "hello = Hello, world!\n"
    },
    {
      "path": "tests/run.ftl",
      "content": "hello = Hello, world!\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "hello = Hello, world!\n"
    }
  },
  "reference": "Fluent syntax reference\n- Example: hello = Hello, world!\n- Comment: #\n- Run: fluent {file}"
}
