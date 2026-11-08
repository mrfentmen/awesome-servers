import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "cwl",
  "displayName": "Common Workflow Language",
  "version": "1.0.0",
  "extensions": [
    ".cwl"
  ],
  "markers": [],
  "comment": "#",
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
      "path": "src/demo.cwl",
      "content": "cwlVersion: v1.2\nclass: CommandLineTool\nbaseCommand: echo\n"
    },
    {
      "path": "tests/run.cwl",
      "content": "cwlVersion: v1.2\nclass: CommandLineTool\nbaseCommand: echo\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "cwlVersion: v1.2\nclass: CommandLineTool\nbaseCommand: echo\n"
    }
  },
  "reference": "Common Workflow Language syntax reference\n- Example: cwlVersion: v1.2\n- Comment: #\n- No CLI runner configured"
}
