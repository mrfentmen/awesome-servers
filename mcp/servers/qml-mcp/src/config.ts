import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "qml",
  "displayName": "QML",
  "version": "1.0.0",
  "extensions": [
    ".qml",
    ".qbs"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "property",
      "pattern": "^\\s*property\\s+(?:[A-Za-z_][A-Za-z0-9_.<>]*\\s+)?([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "signal",
      "pattern": "^\\s*signal\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "id",
      "pattern": "^\\s*id\\s*:\\s*([A-Za-z_][A-Za-z0-9_]*)"
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
      "path": "src/demo.qml",
      "content": "import QtQuick 2.0\n\nItem {\n  function add(a, b) { return a + b }\n}\n"
    },
    {
      "path": "tests/run.qml",
      "content": "import QtQuick 2.0\n\nItem {\n  Component.onCompleted: Qt.quit()\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function name(value) { return value + 1 }"
    },
    "property": {
      "description": "property",
      "body": "property int value: 1"
    },
    "signal": {
      "description": "signal",
      "body": "signal changed(int value)"
    }
  },
  "reference": "QML syntax reference\n- Import: import QtQuick 2.0\n- Object: Item { ... }\n- Property: property int value: 1\n- Function: function name(value) { return value + 1 }\n- Signal: signal changed(int value)\n- Id: id: name\n- Handler: onClicked: { ... }\n- Comment: // line; /* block */\n- Run: qmlscene file.qml"
}
