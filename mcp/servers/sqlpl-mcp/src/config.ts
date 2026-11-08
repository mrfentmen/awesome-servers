import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "sqlpl",
  "displayName": "SQLPL",
  "version": "1.0.0",
  "extensions": [
    ".sql",
    ".db2"
  ],
  "markers": [],
  "comment": "--",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "'"
  ],
  "symbols": [
    {
      "kind": "table",
      "pattern": "^\\s*CREATE\\s+TABLE\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "procedure",
      "pattern": "^\\s*CREATE\\s+PROCEDURE\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*CREATE\\s+FUNCTION\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*DECLARE\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*--#SET\\s+([^\\s]+)"
    }
  ],
  "build": [
    {
      "command": "db2",
      "args": [
        "-tf",
        "{file}"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "schema.sql",
      "content": "CREATE TABLE demo (id INTEGER NOT NULL PRIMARY KEY, name VARCHAR(100));\n\nINSERT INTO demo (name) VALUES ('Bond');\n"
    },
    {
      "path": "tests/run.sql",
      "content": "VALUES 2 + 2;\n"
    }
  ],
  "snippets": {
    "procedure": {
      "description": "procedure",
      "body": "CREATE PROCEDURE name()\nBEGIN\n  SELECT 1 FROM SYSIBM.SYSDUMMY1;\nEND"
    },
    "table": {
      "description": "table",
      "body": "CREATE TABLE name (id INTEGER NOT NULL PRIMARY KEY, value VARCHAR(100));"
    },
    "variable": {
      "description": "variable",
      "body": "DECLARE value INTEGER DEFAULT 1;"
    }
  },
  "reference": "SQLPL syntax reference\n- Table: CREATE TABLE name (id INTEGER NOT NULL PRIMARY KEY);\n- Procedure: CREATE PROCEDURE name() BEGIN ... END\n- Function: CREATE FUNCTION name() RETURNS INTEGER ...\n- Variable: DECLARE value INTEGER DEFAULT 1;\n- Condition: IF value > 0 THEN ... END IF;\n- Loop: WHILE value < 10 DO ... END WHILE;\n- Select: SELECT * FROM name;\n- Comment: -- line; /* block */\n- Run: db2 -tf file.sql"
}
