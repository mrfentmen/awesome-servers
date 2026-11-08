import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "gams",
  "displayName": "GAMS",
  "version": "1.0.0",
  "extensions": [
    ".gms"
  ],
  "markers": [],
  "comment": "*",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "set",
      "pattern": "^Set\\s+([A-Za-z_]\\w*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.gms",
      "content": "Set i /1*3/;\nParameter p(i);\np(i) = 1;\n"
    },
    {
      "path": "tests/run.gms",
      "content": "Set i /1*3/;\nParameter p(i);\np(i) = 1;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Set i /1*3/;\nParameter p(i);\np(i) = 1;\n"
    }
  },
  "reference": "GAMS syntax reference\n- Example: Set i /1*3/;\n- Comment: *\n- Run: gams {file}"
}
