import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "papyrus",
  "displayName": "Papyrus",
  "version": "1.0.0",
  "extensions": [
    ".psc"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "script",
      "pattern": "^\\s*ScriptName\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:Function|Event)\\s+(?:[A-Za-z_][A-Za-z0-9_]*\\s+)?([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "property",
      "pattern": "^\\s*(?:[A-Za-z_][A-Za-z0-9_]*\\s+)?[Pp]roperty\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*Import\\s+([A-Za-z_][A-Za-z0-9_:]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.psc",
      "content": "ScriptName Demo\n\nFunction Int Add(Int a, Int b)\n  Return a + b\nEndFunction\n"
    },
    {
      "path": "tests/run.psc",
      "content": "ScriptName Demo\n\nFunction Int Add(Int a, Int b)\n  Return a + b\nEndFunction\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "ScriptName Name\n\nFunction Int Value()\n  Return 1\nEndFunction"
    }
  },
  "reference": "Papyrus syntax reference\n- Script: ScriptName Name\n- Function: Function Int Name(Int value) Return value EndFunction\n- Event: Event OnInit() EndEvent\n- Property: Int Property Value Auto\n- Import: Import Game\n- Variable: Int value = 1\n- Comment: ; line\n- Compile: papyrus-compiler file.psc"
}
