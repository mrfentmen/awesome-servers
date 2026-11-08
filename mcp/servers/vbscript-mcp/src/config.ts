import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "vbscript",
  "displayName": "VBScript",
  "version": "1.0.0",
  "extensions": [
    ".vbs"
  ],
  "markers": [],
  "comment": "'",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "subroutine",
      "pattern": "^\\s*(?:Public\\s+|Private\\s+)?Sub\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:Public\\s+|Private\\s+)?Function\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.vbs",
      "content": "Function Add(a, b)\n    Add = a + b\nEnd Function\n\nWScript.Echo Add(2, 2)\n"
    },
    {
      "path": "tests/run.vbs",
      "content": "If 2 + 2 <> 4 Then\n    WScript.Quit 1\nEnd If\nWScript.Quit 0\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Function Name(value)\n    Name = value + 1\nEnd Function"
    },
    "subroutine": {
      "description": "subroutine",
      "body": "Sub Name()\nEnd Sub"
    },
    "loop": {
      "description": "for loop",
      "body": "For i = 1 To 10\nNext"
    }
  },
  "reference": "VBScript syntax reference\n- Function: Function Name(value) Name = value + 1 End Function\n- Subroutine: Sub Name() ... End Sub\n- Class: Class Name ... End Class\n- Variable: Dim name\n- Conditional: If condition Then ... Else ... End If\n- Loop: For i = 1 To 10 ... Next\n- Output: WScript.Echo value\n- Comment: ' line\n- Run: cscript file.vbs"
}
