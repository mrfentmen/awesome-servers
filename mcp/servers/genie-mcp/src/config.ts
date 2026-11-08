import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "genie",
  "displayName": "Genie",
  "version": "1.0.0",
  "extensions": [
    ".gs"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "method",
      "pattern": "^\\s*(init)\\s*$"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.gs",
      "content": "init\n  print \"Hello\"\n"
    },
    {
      "path": "tests/run.gs",
      "content": "init\n  print \"Hello\"\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "init\n  print \"Hello\"\n"
    }
  },
  "reference": "Genie syntax reference\n- Example: init\n- Comment: //\n- Run: valac {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
