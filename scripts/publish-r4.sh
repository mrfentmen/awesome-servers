#!/bin/bash
set -u
cd "$(dirname "$0")/.." || exit 1
for p in pusher rawg rollbar seatgeek theoddsapi spreaker turbosquid twitch weightsbiases; do
  d="published/$p-mcp"
  node -e '
    const fs=require("fs"); const f=process.argv[1]+"/package.json";
    const j=JSON.parse(fs.readFileSync(f,"utf8")); j.version="1.1.0";
    fs.writeFileSync(f, JSON.stringify(j,null,2)+"\n");
  ' "$d"
  out=$(cd "$d" && npm publish --access public 2>&1)
  if echo "$out" | grep -qE '^\+ '; then echo "OK:$p-mcp:1.1.0"
  elif echo "$out" | grep -q "E409"; then echo "STAGED:$p-mcp:1.1.0"
  else echo "FAIL:$p-mcp:$(echo "$out" | grep -iE 'npm error' | head -1 | cut -c1-150)"; fi
done
