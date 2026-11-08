import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "coldfusion",
  "displayName": "ColdFusion",
  "version": "1.0.0",
  "extensions": [
    ".cfm",
    ".cfml"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.cfm",
      "content": "<cfscript>\nfunction add(a, b) {\n  return a + b;\n}\n</cfscript>\n"
    },
    {
      "path": "tests/run.cfm",
      "content": "<cfscript>\nfunction add(a, b) {\n  return a + b;\n}\n</cfscript>\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "<cfscript>\nfunction add(a, b) {\n  return a + b;\n}\n</cfscript>\n"
    }
  },
  "reference": "ColdFusion syntax reference\n- Example: <cfscript>\n- Comment: //\n- No CLI runner configured",
  "blockComment": {
    "start": "<!---",
    "end": "--->"
  }
}
