import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "freemarker",
  "displayName": "FreeMarker",
  "version": "1.0.0",
  "extensions": [
    ".ftl",
    ".ftlh"
  ],
  "markers": [],
  "comment": "<#--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "<#function\\s+([A-Za-z_]\\w*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.ftl",
      "content": "<#function add a b>\n  <#return a + b>\n</#function>\n"
    },
    {
      "path": "tests/run.ftl",
      "content": "<#function add a b>\n  <#return a + b>\n</#function>\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "<#function add a b>\n  <#return a + b>\n</#function>\n"
    }
  },
  "reference": "FreeMarker syntax reference\n- Example: <#function add a b>\n- Comment: <#--\n- No CLI runner configured",
  "blockComment": {
    "start": "<#--",
    "end": "-->"
  }
}
