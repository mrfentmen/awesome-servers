import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "autoit",
  "displayName": "AutoIt",
  "version": "1.0.0",
  "extensions": [
    ".au3"
  ],
  "markers": [],
  "comment": ";",
  "blockComment": {
    "start": "#cs",
    "end": "#ce"
  },
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*Func\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*(?:Global|Local|Dim)\\s+\\$([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "region",
      "pattern": "^\\s*#Region\\s+(.+)$"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*#include\\s+[\"<]([^\">]+)[\">]"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.au3",
      "content": "Func Add($a, $b)\n    Return $a + $b\nEndFunc\n\nConsoleWrite(Add(2, 2))\n"
    },
    {
      "path": "tests/run.au3",
      "content": "If 2 + 2 <> 4 Then\n    Exit 1\nEndIf\nExit 0\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Func Name($value)\n    Return $value + 1\nEndFunc"
    },
    "loop": {
      "description": "for loop",
      "body": "For $i = 1 To 10\n    ConsoleWrite($i)\nNext"
    },
    "include": {
      "description": "include",
      "body": "#include <Array.au3>"
    }
  },
  "reference": "AutoIt syntax reference\n- Function: Func Name($value) Return $value EndFunc\n- Variable: Global $name = 1\n- Conditional: If condition Then ... EndIf\n- Loop: For $i = 1 To 10 ... Next\n- Array: Local $values[3] = [1, 2, 3]\n- Include: #include <Array.au3>\n- Comment: ; line; #cs block #ce\n- Run: autoit3 file.au3"
}
