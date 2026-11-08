import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "vdm",
  "displayName": "VDM",
  "version": "1.0.0",
  "extensions": [
    ".vdm",
    ".vpp"
  ],
  "markers": [],
  "comment": "--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "operation",
      "pattern": "^\\s*(?:public\\s+)?([A-Za-z_][A-Za-z0-9_]*)\\s*:"
    },
    {
      "kind": "type",
      "pattern": "^\\s*types\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "from",
      "pattern": "^\\s*(?:from|import)\\s+([A-Za-z0-9_.]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/Demo.vdm",
      "content": "class Demo\noperations\n  public add: int * int ==> int\n  add(a, b) == a + b\nend Demo\n"
    },
    {
      "path": "tests/Test.vdm",
      "content": "class Test\noperations\n  public value: () ==> int\n  value() == 2 + 2\nend Test\n"
    }
  ],
  "snippets": {
    "class": {
      "description": "class",
      "body": "class Name\noperations\n  public value: () ==> int\n  value() == 1\nend Name"
    },
    "type": {
      "description": "type",
      "body": "types\n  Name :: value : int"
    },
    "function": {
      "description": "function",
      "body": "functions\n  name: int -> int\n  name(value) == value + 1"
    }
  },
  "reference": "VDM syntax reference\n- Class: class Name ... end Name\n- Module: module Name ... end Name\n- Operations: operations public name: int ==> int\n- Functions: functions name: int -> int\n- Types: types Name :: value : int\n- Values: values name : int = 1\n- Import: from Module import Name\n- Comment: -- line"
}
