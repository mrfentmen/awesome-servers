import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "dm",
  "displayName": "DM",
  "version": "1.0.0",
  "extensions": [
    ".dm"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "procedure",
      "pattern": "^\\s*proc/([A-Za-z_]\\w*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.dm",
      "content": "/datum/demo\n  proc/add(a, b)\n    return a + b\n"
    },
    {
      "path": "tests/run.dm",
      "content": "/datum/demo\n  proc/add(a, b)\n    return a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "/datum/demo\n  proc/add(a, b)\n    return a + b\n"
    }
  },
  "reference": "DM syntax reference\n- Example: /datum/demo\n- Comment: //\n- Run: dm {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
