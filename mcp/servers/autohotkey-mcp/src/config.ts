import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "autohotkey",
  "displayName": "AutoHotkey",
  "version": "1.0.0",
  "extensions": [
    ".ahk",
    ".ah1",
    ".ah2",
    ".ahkl"
  ],
  "markers": [],
  "comment": ";",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\([^)]*\\)\\s*\\{"
    },
    {
      "kind": "hotkey",
      "pattern": "^\\s*([\\^!+#~$]*[A-Za-z0-9]+)::"
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*:="
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*#Include\\s+(.+)$"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.ahk",
      "content": "Add(a, b) {\n    return a + b\n}\n\nMsgBox Add(2, 2)\n"
    },
    {
      "path": "tests/run.ahk",
      "content": "if (2 + 2 != 4)\n    ExitApp 1\nExitApp 0\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Name(value) {\n    return value + 1\n}"
    },
    "hotkey": {
      "description": "hotkey",
      "body": "^!n::MsgBox \"Hello\""
    },
    "class": {
      "description": "class",
      "body": "class Name {\n    Value := 1\n}"
    }
  },
  "reference": "AutoHotkey syntax reference\n- Function: Name(value) { return value + 1 }\n- Variable: name := 1\n- Hotkey: ^!n::MsgBox \"Hello\"\n- Class: class Name { Value := 1 }\n- Conditional: if (condition) { ... }\n- Loop: Loop 10 { ... }\n- Include: #Include file.ahk\n- Comment: ; line; /* block */\n- Run: autohotkey file.ahk"
}
