import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "clojure",
  "displayName": "Clojure",
  "version": "1.0.0",
  "extensions": [
    ".clj",
    ".cljs",
    ".cljc",
    ".edn"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "namespace",
      "pattern": "^\\s*\\(ns\\s+([A-Za-z_][A-Za-z0-9_.-]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*\\(defn-?\\s+([A-Za-z_][A-Za-z0-9_!?*+.-]*)"
    },
    {
      "kind": "value",
      "pattern": "^\\s*\\(def\\s+([A-Za-z_][A-Za-z0-9_!?*+.-]*)"
    },
    {
      "kind": "record",
      "pattern": "^\\s*\\(defrecord\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "protocol",
      "pattern": "^\\s*\\(defprotocol\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "require",
      "pattern": "^\\s*\\(:require\\s+\\[([A-Za-z_][A-Za-z0-9_.-]*)"
    },
    {
      "kind": "use",
      "pattern": "^\\s*\\(:use\\s+\\[([A-Za-z_][A-Za-z0-9_.-]*)"
    },
    {
      "kind": "import",
      "pattern": "^\\s*\\(:import\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo/core.clj",
      "content": "(ns demo.core)\n\n(defn greet []\n  (println \"Hello from Clojure\"))\n\n(greet)\n"
    },
    {
      "path": "tests/run.clj",
      "content": "(when-not (= (+ 2 2) 4)\n  (throw (ex-info \"math failed\" {})))\n(println \"ok\")\n"
    }
  ],
  "snippets": {
    "namespace": {
      "description": "namespace",
      "body": "(ns demo.core)"
    },
    "function": {
      "description": "function",
      "body": "(defn name [value]\n  (inc value))"
    },
    "record": {
      "description": "record",
      "body": "(defrecord Name [value])"
    }
  },
  "reference": "Clojure syntax reference\n- Namespace: (ns demo.core)\n- Function: (defn name [args] body)\n- Value: (def name value)\n- Record: (defrecord Name [fields])\n- Protocol: (defprotocol Name (method [this]))\n- Require: (ns demo.core (:require [clojure.string :as str]))\n- Import: (:import java.util.Date)\n- Comment: ; line\n- Run: clojure file.clj"
}
