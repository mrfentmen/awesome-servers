import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "plpgsql",
  "displayName": "PLpgSQL",
  "version": "1.0.0",
  "extensions": [
    ".pgsql",
    ".sql"
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
      "kind": "function",
      "pattern": "^\\s*CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "procedure",
      "pattern": "^\\s*CREATE\\s+(?:OR\\s+REPLACE\\s+)?PROCEDURE\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "trigger",
      "pattern": "^\\s*CREATE\\s+TRIGGER\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*\\\\i\\s+([^\\s]+)"
    }
  ],
  "runner": [
    {
      "command": "psql",
      "args": [
        "-f",
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "psql",
      "args": [
        "-f",
        "tests/run.sql"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "schema.sql",
      "content": "CREATE TABLE demo (id integer PRIMARY KEY, name text);\n\nCREATE FUNCTION greet() RETURNS text AS $$\nBEGIN\n  RETURN 'Hello from PLpgSQL';\nEND;\n$$ LANGUAGE plpgsql;\n"
    },
    {
      "path": "tests/run.sql",
      "content": "SELECT 2 + 2;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "CREATE FUNCTION name() RETURNS text AS $$\nBEGIN\n  RETURN 'value';\nEND;\n$$ LANGUAGE plpgsql;"
    },
    "table": {
      "description": "table",
      "body": "CREATE TABLE name (id serial PRIMARY KEY, value text);"
    },
    "trigger": {
      "description": "trigger",
      "body": "CREATE TRIGGER name BEFORE INSERT ON table_name FOR EACH ROW EXECUTE FUNCTION function_name();"
    }
  },
  "reference": "PLpgSQL syntax reference\n- Function: CREATE FUNCTION name() RETURNS text AS $$ BEGIN RETURN 'x'; END; $$ LANGUAGE plpgsql;\n- Procedure: CREATE PROCEDURE name() LANGUAGE plpgsql AS $$ BEGIN END; $$;\n- Table: CREATE TABLE name (id serial PRIMARY KEY);\n- Variable: DECLARE value integer := 1;\n- Condition: IF value > 0 THEN ... END IF;\n- Loop: FOR item IN SELECT ... LOOP ... END LOOP;\n- Trigger: CREATE TRIGGER name BEFORE INSERT ON table_name ...\n- Comment: -- line; /* block */\n- Run: psql -f file.sql"
}
