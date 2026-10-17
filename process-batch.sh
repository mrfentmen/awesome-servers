#!/bin/bash
# process-batch.sh: take next 10 MCP servers, install / bump version / build / publish,
# then commit, push, and delete local copies. Only commits on full success.
set -u
cd /Users/test/awesome-servers-work || exit 1

TOTAL=$(ls mcp/servers/ | wc -l | tr -d ' ')
echo "Servers remaining: $TOTAL"
if [ "$TOTAL" = "0" ]; then echo "ALL DONE"; exit 0; fi

SERVERS=$(ls mcp/servers/ | sort | head -10)
echo "Batch servers: $(echo "$SERVERS" | tr '\n' ' ')"
echo ""

BUMP='import json;p="package.json";d=json.load(open(p));v=d["version"].split(".");v[2]=str(int(v[2])+1);d["version"]=".".join(v);json.dump(d,open(p,"w"),indent=2);print("   version:",d["version"])'

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
    PUB=$(npm publish --access public 2>&1)
    if echo "$PUB" | grep -q "^npm error"; then
      # version conflict or transient issue: bump once and retry
      python3 -c "$BUMP" >/dev/null
      PUB=$(npm publish --access public 2>&1)
    fi
    if echo "$PUB" | grep -q "^npm error"; then
      echo "   PUBLISH FAILED"
      echo "$PUB" | grep -m1 "npm error"
      FAIL=1
    else
      echo "   $(echo "$PUB" | grep '^\+ ' | tail -1)"
    fi
  fi
  cd /Users/test/awesome-servers-work
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
