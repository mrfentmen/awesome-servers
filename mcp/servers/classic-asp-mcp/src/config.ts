import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "classic-asp",
  "displayName": "Classic ASP",
  "version": "1.0.0",
  "extensions": [
    ".asp"
  ],
  "markers": [],
  "comment": "'",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "sub",
      "pattern": "^\\s*Sub\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*Function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*Class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*Dim\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "<!--#include\\s+file=\"([^\"]+)\""
    }
  ],
  "scaffold": [
    {
      "path": "hello.asp",
      "content": "<%\nDim name\nname = \"Bond\"\nResponse.Write \"Hello, \" & name\n%>\n"
    },
    {
      "path": "tests/run.asp",
      "content": "<%\nIf 2 + 2 = 4 Then\n  Response.Write \"ok\"\nEnd If\n%>\n"
    }
  ],
  "snippets": {
    "sub": {
      "description": "subroutine",
      "body": "Sub Name(value)\n  Response.Write value\nEnd Sub"
    },
    "function": {
      "description": "function",
      "body": "Function Name(value)\n  Name = value\nEnd Function"
    },
    "variable": {
      "description": "variable",
      "body": "Dim value\nvalue = \"text\""
    }
  },
  "reference": "Classic ASP syntax reference\n- Block: <% ... %>\n- Sub: Sub Name(value) ... End Sub\n- Function: Function Name(value) ... End Function\n- Variable: Dim value\n- Output: Response.Write value\n- Condition: If value = 1 Then ... End If\n- Include: <!--#include file=\"file.asp\" -->\n- Comment: ' line"
}
