import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "inno-setup",
  "displayName": "Inno Setup",
  "version": "1.0.0",
  "extensions": [
    ".iss",
    ".isl"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "section",
      "pattern": "^\\[([A-Za-z]+)\\]"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.iss",
      "content": "[Setup]\nAppName=Demo\nAppVersion=1.0\n"
    },
    {
      "path": "tests/run.iss",
      "content": "[Setup]\nAppName=Demo\nAppVersion=1.0\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "[Setup]\nAppName=Demo\nAppVersion=1.0\n"
    }
  },
  "reference": "Inno Setup syntax reference\n- Example: [Setup]\n- Comment: ;\n- Run: iscc {file}"
}
