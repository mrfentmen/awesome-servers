import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "4d",
  "displayName": "4D",
  "version": "1.0.0",
  "extensions": [
    ".4dm"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "variable",
      "pattern": "^\\s*(?:C_TEXT|C_LONGINT|C_OBJECT|C_BOOLEAN)\\(\\$?([A-Za-z_][A-Za-z0-9_]*)\\)"
    },
    {
      "kind": "method",
      "pattern": "^\\s*\\/\\/%Method\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*Function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*USE\\s+([A-Za-z0-9_.]+)"
    }
  ],
  "scaffold": [
    {
      "path": "Project/Sources/Methods/hello.4dm",
      "content": "C_TEXT($name)\n$name:=\"Bond\"\nALERT(\"Hello, \"+$name)\n"
    },
    {
      "path": "Project/Sources/Methods/test.4dm",
      "content": "C_LONGINT($value)\n$value:=2+2\nASSERT($value=4)\n"
    }
  ],
  "snippets": {
    "variable": {
      "description": "variable",
      "body": "C_TEXT($name)\n$name:=\"value\""
    },
    "conditional": {
      "description": "if block",
      "body": "If ($value=1)\n  ALERT(\"one\")\nEnd if"
    },
    "loop": {
      "description": "loop",
      "body": "For ($i;1;10)\n  ALERT(String($i))\nEnd for"
    }
  },
  "reference": "4D syntax reference\n- Variable: C_TEXT($name)\n- Assign: $name:=\"value\"\n- If: If ($value=1) ... End if\n- Loop: For ($i;1;10) ... End for\n- Alert: ALERT(\"text\")\n- Method: //%Method name\n- Function: Function name($value)\n- Comment: // line"
}
