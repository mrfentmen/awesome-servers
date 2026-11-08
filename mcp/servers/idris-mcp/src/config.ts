import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "idris",
  "displayName": "Idris",
  "version": "1.0.0",
  "extensions": [
    ".idr",
    ".lidr"
  ],
  "markers": [],
  "comment": "--",
  "blockComment": {
    "start": "{-",
    "end": "-}"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "data",
      "pattern": "^\\s*data\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "record",
      "pattern": "^\\s*record\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "interface",
      "pattern": "^\\s*interface\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z0-9_.]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/Demo.idr",
      "content": "module Demo\n\ndata Bool = True | False\n\nnegate : Bool -> Bool\nnegate True = False\nnegate False = True\n"
    },
    {
      "path": "tests/Test.idr",
      "content": "module Test\n\nimport Demo\n"
    }
  ],
  "snippets": {
    "module": {
      "description": "module",
      "body": "module Name"
    },
    "data": {
      "description": "data type",
      "body": "data Name = One | Two"
    },
    "function": {
      "description": "function",
      "body": "name : Bool -> Bool\nname x = x"
    }
  },
  "reference": "Idris syntax reference\n- Module: module Name\n- Import: import Data.Bool\n- Data: data Bool = True | False\n- Record: record Name where constructor MkName; field : Bool\n- Interface: interface Name a where\n- Function: name : Bool -> Bool; name x = x\n- Comment: -- line; {- block -}\n- Check: idris2 file.idr"
}
