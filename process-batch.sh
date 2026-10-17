#!/bin/bash
# process-batch.sh: take next 10 MCP servers, install / bump version / build / publish,
# then commit, push, and delete local copies. Only commits on full success.
# Publish retries: E429 rate limit => wait 60s and retry (up to 3 tries).
set -u
cd /Users/test/awesome-servers-work || exit 1

TOTAL=$(ls mcp/servers/ | wc -l | tr -d ' ')
echo "Servers remaining: $TOTAL"
if [ "$TOTAL" = "0" ]; then echo "ALL DONE"; exit 0; fi

SERVERS=$(ls mcp/servers/ | sort | head -10)
echo "Batch servers: $(echo "$SERVERS" | tr '\n' ' ')"
echo ""

BUMP='import json;p="package.json";d=json.load(open(p));v=d["version"].split(".");v[2]=str(int(v[2])+1);d["version"]=".".join(v);json.dump(d,open(p,"w"),indent=2);print("   version:",d["version"])'

publish_one() {
  local try=0 max=4
  while [ "$try" -lt "$max" ]; do
    PUB=$(npm publish --access public 2>&1)
    if echo "$PUB" | grep -q "^npm error"; then
      if echo "$PUB" | grep -q "E429"; then
        try=$((try+1))
        if [ "$try" -lt "$max" ]; then echo "   rate limited (E429), waiting 60s..."; sleep 60; fi
        continue
      elif echo "$PUB" | grep -qE "previously (published|staged)"; then
        python3 -c "$BUMP" >/dev/null
        try=$((try+1))
        continue
      else
        break
      fi
    else
      break
    fi
  done
  if echo "$PUB" | grep -q "^\+ "; then
    echo "   $(echo "$PUB" | grep '^\+ ' | tail -1)"
    return 0
  else
    echo "   PUBLISH FAILED: $(echo "$PUB" | grep '^npm error' | grep -v "log file" | head -1)"
    return 1
  fi
}

FAIL=0
for s in $SERVERS; do
  if ! cd "mcp/servers/$s" 2>/dev/null; then
    echo "=== $s MISSING ==="; FAIL=1; cd /Users/test/awesome-servers-work; continue
  fi
  echo "=== $s ==="
  npm install --silent 2>/dev/null
  python3 -c "$BUMP"
  if npm run build 2>&1 | tail -1 | grep -qi "error"; then
    echo "   BUILD FAILED"
    npm run build 2>&1 | tail -3
    FAIL=1
  else
    publish_one || FAIL=1
  fi
  cd /Users/test/awesome-servers-work
  sleep 5
done
echo ""

if [ "$FAIL" = "0" ]; then
  MSG=$(echo "$SERVERS" | sed 's/-mcp//g' | paste -sd' ' -)
  git add -A >/dev/null
  git commit -q -m "Publish batch: $MSG"
  git push origin main 2>&1 | tail -1
  for s in $SERVERS; do rm -rf "mcp/servers/$s"; done
  echo "Batch committed, pushed, and deleted."
  echo "Remaining after batch: $(ls mcp/servers/ | wc -l | tr -d ' ')"
else
  echo "FAILURES DETECTED - nothing committed or deleted; failed servers remain at head of list for retry."
fi
