import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "pov-ray-sdl",
  "displayName": "POV-Ray SDL",
  "version": "1.0.0",
  "extensions": [
    ".pov",
    ".inc"
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
      "path": "src/demo.pov",
      "content": "#declare X = 1;\n"
    },
    {
      "path": "tests/run.pov",
      "content": "#declare X = 1;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "#declare X = 1;\n"
    }
  },
  "reference": "POV-Ray SDL syntax reference\n- Example: #declare X = 1;\n- Comment: //\n- No CLI runner configured"
}
