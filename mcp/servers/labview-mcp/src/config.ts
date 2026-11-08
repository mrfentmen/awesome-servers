import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "labview",
  "displayName": "LabVIEW",
  "version": "1.0.0",
  "extensions": [
    ".lvproj",
    ".lvclass",
    ".lvlib"
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
      "path": "src/demo.lvproj",
      "content": "<?xml version=\"1.0\"?><Project/>\n"
    },
    {
      "path": "tests/run.lvproj",
      "content": "<?xml version=\"1.0\"?><Project/>\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "<?xml version=\"1.0\"?><Project/>\n"
    }
  },
  "reference": "LabVIEW syntax reference\n- Example: <?xml version=\"1.0\"?><Project/>\n- Comment: //\n- No CLI runner configured"
}
