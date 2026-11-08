import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "tsql",
  "displayName": "T-SQL",
  "version": "1.0.0",
  "extensions": [
    ".sql"
  ],
  "markers": [],
  "comment": "--",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "'",
    "\""
  ],
  "symbols": [
    {
      "kind": "table",
      "pattern": "^\\s*CREATE\\s+TABLE\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "procedure",
      "pattern": "^\\s*CREATE\\s+(?:OR\\s+ALTER\\s+)?PROCEDURE\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*CREATE\\s+FUNCTION\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "view",
      "pattern": "^\\s*CREATE\\s+VIEW\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*DECLARE\\s+@([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "execute",
      "pattern": "^\\s*(?:EXEC|EXECUTE)\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "build": [
    {
      "command": "sqlcmd",
      "args": [
        "-i",
        "{file}"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "schema.sql",
      "content": "CREATE TABLE demo (\n  id INT PRIMARY KEY,\n  name NVARCHAR(100) NOT NULL\n);\n\nINSERT INTO demo (name) VALUES ('Bond');\n"
    },
    {
      "path": "tests/run.sql",
      "content": "SELECT 2 + 2 AS value;\n"
    }
  ],
  "snippets": {
    "table": {
      "description": "table",
      "body": "CREATE TABLE name (\n  id INT PRIMARY KEY,\n  value NVARCHAR(100)\n);"
    },
    "procedure": {
      "description": "procedure",
      "body": "CREATE PROCEDURE name\nAS\nBEGIN\n  SELECT 1;\nEND;"
    },
    "variable": {
      "description": "variable",
      "body": "DECLARE @value INT = 1;"
    }
  },
  "reference": "T-SQL syntax reference\n- Table: CREATE TABLE name (id INT PRIMARY KEY);\n- Procedure: CREATE PROCEDURE name AS BEGIN SELECT 1; END;\n- Function: CREATE FUNCTION name() RETURNS INT AS BEGIN RETURN 1; END;\n- Variable: DECLARE @value INT = 1;\n- Select: SELECT TOP 10 * FROM name;\n- Identity: id INT IDENTITY(1,1) PRIMARY KEY\n- Execute: EXEC procedure_name;\n- Comment: -- line; /* block */\n- Run: sqlcmd -i file.sql"
}
