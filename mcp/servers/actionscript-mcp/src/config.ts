import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "actionscript",
  "displayName": "ActionScript",
  "version": "1.0.0",
  "extensions": [
    ".as"
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
      "path": "src/demo.as",
      "content": "package { public class Main {} }\n"
    },
    {
      "path": "tests/run.as",
      "content": "package { public class Main {} }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "package { public class Main {} }\n"
    }
  },
  "reference": "ActionScript syntax reference\n- Example: package { public class Main {} }\n- Comment: //\n- No CLI runner configured"
}
