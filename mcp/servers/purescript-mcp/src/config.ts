import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "purescript",
  "displayName": "PureScript",
  "version": "1.0.0",
  "extensions": [
    ".purs"
  ],
  "markers": [
    "spago.dhall",
    "spago.yaml"
  ],
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
      "pattern": "^\\s*module\\s+([A-Z][A-Za-z0-9_.]*)"
    },
    {
      "kind": "data",
      "pattern": "^\\s*data\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "newtype",
      "pattern": "^\\s*newtype\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*([a-z_][A-Za-z0-9_']*)\\s*::"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Z][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/Demo.purs",
      "content": "module Demo where\n\nadd :: Int -> Int -> Int\nadd a b = a + b\n"
    },
    {
      "path": "test/Run.purs",
      "content": "module Test.Run where\n\nvalue :: Int\nvalue = 2 + 2\n"
    }
  ],
  "snippets": {
    "module": {
      "description": "module",
      "body": "module Name where"
    },
    "function": {
      "description": "function",
      "body": "name :: Int -> Int\nname value = value + 1"
    },
    "data": {
      "description": "data type",
      "body": "data Name = One | Two"
    }
  },
  "reference": "PureScript syntax reference\n- Module: module Name where\n- Import: import Prelude\n- Function: name :: Int -> Int; name value = value + 1\n- Data: data Name = One | Two\n- Newtype: newtype Name = Name Int\n- Class: class Name a where\n- Instance: instance name :: Name Type where\n- Comment: -- line; {- block -}\n- Build: spago build"
}
