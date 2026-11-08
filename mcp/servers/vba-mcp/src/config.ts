import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "vba",
  "displayName": "VBA",
  "version": "1.0.0",
  "extensions": [
    ".bas",
    ".cls",
    ".frm",
    ".vba"
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
      "kind": "property",
      "pattern": "^\\s*(?:Public\\s+|Private\\s+)?Property\\s+(?:Get|Let|Set)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*(?:Public\\s+|Private\\s+)?Type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/Demo.bas",
      "content": "Attribute VB_Name = \"Demo\"\n\nPublic Function Add(a As Integer, b As Integer) As Integer\n    Add = a + b\nEnd Function\n"
    },
    {
      "path": "tests/DemoTests.bas",
      "content": "Public Sub TestAdd()\n    If 2 + 2 <> 4 Then Err.Raise 5, , \"math failed\"\nEnd Sub\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Public Function Name(value As Integer) As Integer\n    Name = value + 1\nEnd Function"
    },
    "subroutine": {
      "description": "subroutine",
      "body": "Public Sub Name()\nEnd Sub"
    },
    "loop": {
      "description": "for loop",
      "body": "Dim i As Integer\nFor i = 1 To 10\nNext i"
    }
  },
  "reference": "VBA syntax reference\n- Function: Public Function Name(value As Integer) As Integer ... End Function\n- Subroutine: Public Sub Name() ... End Sub\n- Property: Public Property Get Name() As Integer ... End Property\n- Type: Public Type Name ... End Type\n- Variable: Dim name As Integer\n- Conditional: If condition Then ... Else ... End If\n- Loop: For i = 1 To 10 ... Next i\n- Comment: ' line\n- Run: cscript file.vbs (VBScript) or Excel macro"
}
