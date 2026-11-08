import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "batchfile",
  "displayName": "Batchfile",
  "version": "1.0.0",
  "extensions": [
    ".bat",
    ".cmd"
  ],
  "markers": [],
  "comment": "REM",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "label",
      "pattern": "^:([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*set\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "call",
      "pattern": "^\\s*call\\s+:([A-Za-z_][A-Za-z0-9_-]*)"
    }
  ],
  "imports": [
    {
      "kind": "call",
      "pattern": "^\\s*call\\s+([^\\s]+)"
    }
  ],
  "scaffold": [
    {
      "path": "hello.bat",
      "content": "@echo off\nset NAME=Bond\necho Hello, %NAME%\n"
    },
    {
      "path": "tests/run.bat",
      "content": "@echo off\nif 2==2 (echo ok) else (exit /b 1)\n"
    }
  ],
  "snippets": {
    "label": {
      "description": "label",
      "body": ":name\necho hello\ngoto :eof"
    },
    "variable": {
      "description": "variable",
      "body": "set NAME=value"
    },
    "loop": {
      "description": "loop",
      "body": "for %%f in (*.txt) do echo %%f"
    }
  },
  "reference": "Batchfile syntax reference\n- Label: :name\n- Variable: set NAME=value\n- Expand: %NAME%\n- Condition: if 2==2 (echo ok) else (exit /b 1)\n- Loop: for %%f in (*.txt) do echo %%f\n- Call: call :label\n- Comment: REM text\n- Run on Windows: cmd /c script.bat"
}
