import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "powershell",
  "displayName": "PowerShell",
  "version": "1.0.0",
  "extensions": [
    ".ps1",
    ".psm1",
    ".psd1"
  ],
  "markers": [],
  "comment": "#",
  "blockComment": {
    "start": "<#",
    "end": "#>"
  },
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "filter",
      "pattern": "^\\s*filter\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "enum",
      "pattern": "^\\s*enum\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "module",
      "pattern": "^\\s*using\\s+module\\s+([A-Za-z0-9_.\\\\/-]+)"
    },
    {
      "kind": "import",
      "pattern": "^\\s*Import-Module\\s+([A-Za-z0-9_.\\\\/-]+)"
    }
  ],
  "runner": [
    {
      "command": "pwsh",
      "args": [
        "-NoProfile",
        "-File",
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "pwsh",
      "args": [
        "-NoProfile",
        "-File",
        "tests/run.ps1"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "hello.ps1",
      "content": "param([string]$Name = 'Bond')\nWrite-Output \"Hello, $Name\"\n"
    },
    {
      "path": "tests/run.ps1",
      "content": "if ((2 + 2) -eq 4) { Write-Output \"ok\" } else { throw \"bad math\" }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function Name {\n    param([string]$Value = 'x')\n    Write-Output $Value\n}"
    },
    "class": {
      "description": "class",
      "body": "class Name {\n    [string]$Value\n\n    Name([string]$value) {\n        $this.Value = $value\n    }\n}"
    },
    "param": {
      "description": "param block",
      "body": "param(\n    [Parameter(Mandatory)]\n    [string]$Name\n)"
    }
  },
  "reference": "PowerShell syntax reference\n- Function: function Name { param($Value) Write-Output $Value }\n- Filter: filter Name { $_ }\n- Class: class Name { [string]$Value }\n- Enum: enum Name { One; Two }\n- Param: param([string]$Name = 'value')\n- Import: Import-Module ./Module.psm1\n- Comment: # line; <# block #>\n- Run: pwsh -NoProfile -File script.ps1"
}
