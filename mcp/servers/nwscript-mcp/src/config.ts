import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "nwscript",
  "displayName": "NWScript",
  "version": "1.0.0",
  "extensions": [
    ".nss"
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
      "path": "src/demo.nss",
      "content": "void main() { }\n"
    },
    {
      "path": "tests/run.nss",
      "content": "void main() { }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "void main() { }\n"
    }
  },
  "reference": "NWScript syntax reference\n- Example: void main() { }\n- Comment: //\n- No CLI runner configured"
}
