import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "logos",
  "displayName": "Logos",
  "version": "1.0.0",
  "extensions": [
    ".xm",
    ".x",
    ".xi"
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
      "path": "src/demo.xm",
      "content": "%hook Demo\n- (void)run { %orig; }\n%end\n"
    },
    {
      "path": "tests/run.xm",
      "content": "%hook Demo\n- (void)run { %orig; }\n%end\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "%hook Demo\n- (void)run { %orig; }\n%end\n"
    }
  },
  "reference": "Logos syntax reference\n- Example: %hook Demo\n- Comment: //\n- No CLI runner configured"
}
