import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "xslt",
  "displayName": "XSLT",
  "version": "1.0.0",
  "extensions": [
    ".xslt",
    ".xsl"
  ],
  "markers": [],
  "comment": "<!--",
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
      "path": "src/demo.xslt",
      "content": "<xsl:stylesheet version=\"3.0\" xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\"></xsl:stylesheet>\n"
    },
    {
      "path": "tests/run.xslt",
      "content": "<xsl:stylesheet version=\"3.0\" xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\"></xsl:stylesheet>\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "<xsl:stylesheet version=\"3.0\" xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\"></xsl:stylesheet>\n"
    }
  },
  "reference": "XSLT syntax reference\n- Example: <xsl:stylesheet version=\"3.0\" xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\"></xsl:stylesheet>\n- Comment: <!--\n- No CLI runner configured"
}
