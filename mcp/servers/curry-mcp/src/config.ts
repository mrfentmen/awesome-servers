import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "curry",
  "displayName": "Curry",
  "version": "1.0.0",
  "extensions": [
    ".curry"
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
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*([a-z][A-Za-z0-9_']*)\\s*::"
    },
    {
      "kind": "data",
      "pattern": "^\\s*data\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.curry",
      "content": "module Demo where\n\nadd :: Int -> Int -> Int\nadd a b = a + b\n"
    },
    {
      "path": "tests/run.curry",
      "content": "module Run where\n\nvalue :: Int\nvalue = 2 + 2\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "name :: Int -> Int\nname value = value + 1"
    },
    "data": {
      "description": "data",
      "body": "data Name = Value Int"
    },
    "module": {
      "description": "module",
      "body": "module Name where"
    }
  },
  "reference": "Curry syntax reference\n- Module: module Name where\n- Function type: name :: Int -> Int\n- Function: name value = value + 1\n- Data: data Name = Value Int\n- Type: type Name = Int\n- Import: import Module\n- Conditional: if condition then value else other\n- Comment: -- line; {- block -}\n- Run: curry file.curry"
}
