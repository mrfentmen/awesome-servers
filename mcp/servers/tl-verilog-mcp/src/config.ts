import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "tl-verilog",
  "displayName": "TL-Verilog",
  "version": "1.0.0",
  "extensions": [
    ".tlv"
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
      "path": "src/demo.tlv",
      "content": "module demo(input clk);\n"
    },
    {
      "path": "tests/run.tlv",
      "content": "module demo(input clk);\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "module demo(input clk);\n"
    }
  },
  "reference": "TL-Verilog syntax reference\n- Example: module demo(input clk);\n- Comment: //\n- No CLI runner configured"
}
