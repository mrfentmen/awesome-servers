import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "cweb",
  "displayName": "CWeb",
  "version": "1.0.0",
  "extensions": [
    ".w"
  ],
  "markers": [],
  "comment": "@",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*(?:int|void)\\s+([A-Za-z_]\\w*)\\s*\\("
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.w",
      "content": "@* Demo.\n@c\nint main(void) { return 0; }\n"
    },
    {
      "path": "tests/run.w",
      "content": "@* Demo.\n@c\nint main(void) { return 0; }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "@* Demo.\n@c\nint main(void) { return 0; }\n"
    }
  },
  "reference": "CWeb syntax reference\n- Example: @* Demo.\n- Comment: @\n- Run: ctangle {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
