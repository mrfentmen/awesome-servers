import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "holyc",
  "displayName": "HolyC",
  "version": "1.0.0",
  "extensions": [
    ".hc"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*U0\\s+([A-Za-z_]\\w*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.hc",
      "content": "U0 Main()\n{\n  \"Hello\\n\";\n}\n"
    },
    {
      "path": "tests/run.hc",
      "content": "U0 Main()\n{\n  \"Hello\\n\";\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "U0 Main()\n{\n  \"Hello\\n\";\n}\n"
    }
  },
  "reference": "HolyC syntax reference\n- Example: U0 Main()\n- Comment: //\n- Run: holyc {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
