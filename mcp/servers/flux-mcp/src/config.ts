import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "flux",
  "displayName": "FLUX",
  "version": "1.0.0",
  "extensions": [
    ".fx",
    ".flux"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "\\b(?:function|def|fn|fun|func|proc|procedure|sub|method|class|struct|enum|module|namespace|type|interface|trait|record|object)\\s+([A-Za-z_]\\w*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:[A-Za-z_][\\w<>\\[\\]]*\\s+)+([A-Za-z_]\\w*)\\s*\\("
    },
    {
      "kind": "value",
      "pattern": "^([A-Za-z_]\\w*)\\s*(?::=|=|:)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.fx",
      "content": "from(bucket: \"demo\") \n"
    },
    {
      "path": "tests/run.fx",
      "content": "from(bucket: \"demo\") \n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "from(bucket: \"demo\") \n"
    }
  },
  "reference": "FLUX syntax reference\n- Example: from(bucket: \"demo\")\n- Comment: //\n- Run: > range(start: -1h)"
}
