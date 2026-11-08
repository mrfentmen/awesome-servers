import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "elm",
  "displayName": "Elm",
  "version": "1.0.0",
  "extensions": [
    ".elm"
  ],
  "markers": [
    "elm.json"
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
      "kind": "type",
      "pattern": "^\\s*type\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "port",
      "pattern": "^\\s*port\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*([a-z_][A-Za-z0-9_']*)\\s*:"
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
      "path": "src/Demo.elm",
      "content": "module Demo exposing (add)\n\nadd : Int -> Int -> Int\nadd a b = a + b\n"
    },
    {
      "path": "tests/Run.elm",
      "content": "module Run exposing (value)\n\nvalue : Int\nvalue = 2 + 2\n"
    }
  ],
  "snippets": {
    "module": {
      "description": "module",
      "body": "module Name exposing (value)"
    },
    "function": {
      "description": "function",
      "body": "name : Int -> Int\nname value = value + 1"
    },
    "type": {
      "description": "type",
      "body": "type Name = One | Two"
    }
  },
  "reference": "Elm syntax reference\n- Module: module Name exposing (value)\n- Import: import Html exposing (text)\n- Function: name : Int -> Int; name value = value + 1\n- Type: type Name = One | Two\n- Type alias: type alias Name = { value : Int }\n- Port: port name : String -> Cmd msg\n- Pattern matching: case value of One -> 1; Two -> 2\n- Comment: -- line; {- block -}\n- Build: elm make src/Main.elm"
}
