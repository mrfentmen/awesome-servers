import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "r",
  "displayName": "R",
  "version": "1.0.0",
  "extensions": [
    ".r",
    ".R"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*([A-Za-z.][A-Za-z0-9._]*)\\s*<-\\s*function"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*([A-Za-z.][A-Za-z0-9._]*)\\s*<-"
    },
    {
      "kind": "class",
      "pattern": "^\\s*setClass\\s*\\(\\s*[\"']([^\"']+)"
    }
  ],
  "imports": [
    {
      "kind": "library",
      "pattern": "^\\s*library\\s*\\(\\s*([A-Za-z0-9._]+)"
    },
    {
      "kind": "require",
      "pattern": "^\\s*require\\s*\\(\\s*([A-Za-z0-9._]+)"
    },
    {
      "kind": "source",
      "pattern": "^\\s*source\\s*\\(\\s*[\"']([^\"']+)"
    }
  ],
  "scaffold": [
    {
      "path": "R/demo.R",
      "content": "greet <- function() {\n  print(\"Hello from R\")\n}\n\ngreet()\n"
    },
    {
      "path": "tests/run.R",
      "content": "if (2 + 2 != 4) stop(\"math failed\")\ncat(\"ok\\n\")\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "name <- function(value) {\n  value + 1\n}"
    },
    "dataframe": {
      "description": "data frame",
      "body": "name <- data.frame(value = c(1, 2, 3))"
    },
    "library": {
      "description": "library",
      "body": "library(package)"
    }
  },
  "reference": "R syntax reference\n- Assignment: name <- value\n- Function: name <- function(value) { value + 1 }\n- Vector: c(1, 2, 3)\n- Data frame: data.frame(value = c(1, 2, 3))\n- List: list(name = value)\n- Conditionals: if (test) { ... } else { ... }\n- Loops: for (item in values) { ... }; while (test) { ... }\n- Library: library(package)\n- Comment: # line\n- Run: Rscript file.R"
}
