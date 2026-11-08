import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "haskell",
  "displayName": "Haskell",
  "version": "1.0.0",
  "extensions": [
    ".hs",
    ".lhs"
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
      "pattern": "^\\s*module\\s+([A-Z][A-Za-z0-9_.]*)"
    },
    {
      "kind": "data",
      "pattern": "^\\s*data\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([A-Z][A-Za-z0-9_]*)"
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
      "pattern": "^\\s*import\\s+(?:qualified\\s+)?([A-Z][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/Main.hs",
      "content": "module Main where\n\ngreet :: IO ()\ngreet = putStrLn \"Hello from Haskell\"\n\nmain :: IO ()\nmain = greet\n"
    },
    {
      "path": "tests/Run.hs",
      "content": "module Main where\n\nmain :: IO ()\nmain = if 2 + 2 == 4 then putStrLn \"ok\" else error \"math failed\"\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "name :: Int -> Int\nname value = value + 1"
    },
    "data": {
      "description": "data type",
      "body": "data Name = One | Two"
    },
    "module": {
      "description": "module",
      "body": "module Name where"
    }
  },
  "reference": "Haskell syntax reference\n- Module: module Name where\n- Function: name :: Int -> Int; name value = value + 1\n- Data: data Name = One | Two\n- Type alias: type Name = Int\n- Class: class Name a where\n- Instance: instance Name Type where\n- Import: import Data.List\n- Pattern matching: name Nothing = 0; name (Just x) = x\n- Comment: -- line; {- block -}\n- Run: runghc file.hs"
}
