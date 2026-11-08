import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "objective-j",
  "displayName": "Objective-J",
  "version": "1.0.0",
  "extensions": [
    ".j",
    ".sj"
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
      "path": "src/demo.j",
      "content": "@implementation Demo : CPObject\n@end\n"
    },
    {
      "path": "tests/run.j",
      "content": "@implementation Demo : CPObject\n@end\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "@implementation Demo : CPObject\n@end\n"
    }
  },
  "reference": "Objective-J syntax reference\n- Example: @implementation Demo : CPObject\n- Comment: //\n- No CLI runner configured"
}
