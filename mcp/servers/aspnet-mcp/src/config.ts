import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "aspnet",
  "displayName": "ASP.NET",
  "version": "1.0.0",
  "extensions": [
    ".asax",
    ".ascx",
    ".ashx",
    ".asmx",
    ".aspx",
    ".axd"
  ],
  "markers": [],
  "comment": "<%--",
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
      "path": "src/demo.asax",
      "content": "<% Response.Write(\"Hello\"); %>\n"
    },
    {
      "path": "tests/run.asax",
      "content": "<% Response.Write(\"Hello\"); %>\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "<% Response.Write(\"Hello\"); %>\n"
    }
  },
  "reference": "ASP.NET syntax reference\n- Example: <% Response.Write(\"Hello\"); %>\n- Comment: <%--\n- No CLI runner configured"
}
