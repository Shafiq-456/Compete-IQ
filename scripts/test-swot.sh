#!/bin/bash
# Test AI SWOT generation across multiple competitors
cd /home/z/my-project

if ! pgrep -f "next-server" > /dev/null; then
  echo "Server not running, starting..."
  setsid bun run dev > /tmp/dev.log 2>&1 < /dev/null &
  sleep 12
fi

# Get all competitor IDs
COMPETITORS=$(python3 -c "
import json
with open('/tmp/r_competitors.json') as f:
    d = json.load(f)
for c in d['competitors']:
    print(c['id'])
")

echo "=== SWOT GENERATION TESTS (with force=true to regenerate via AI) ==="
echo ""
i=1
for cid in $COMPETITORS; do
  echo "─────────────────────────────────────────────────"
  echo "SWOT for: $cid"
  echo "─────────────────────────────────────────────────"
  
  RESULT=$(curl -s -o /tmp/swot_$i.json -w "%{http_code}|%{time_total}" --max-time 60 \
    "http://127.0.0.1:3000/api/swot?competitorId=$cid&force=true")
  
  IFS='|' read -r code time <<< "$RESULT"
  echo "Status: HTTP $code | Time: ${time}s"
  echo ""
  
  if [ "$code" = "200" ]; then
    python3 -c "
import json
with open('/tmp/swot_$i.json') as f:
    d = json.load(f)
s = d.get('swot', {})
print('STRENGTHS:')
for x in (s.get('strengths', []) or [])[:3]:
    print(f'  • {x}')
print('WEAKNESSES:')
for x in (s.get('weaknesses', []) or [])[:3]:
    print(f'  • {x}')
print('OPPORTUNITIES:')
for x in (s.get('opportunities', []) or [])[:3]:
    print(f'  • {x}')
print('THREATS:')
for x in (s.get('threats', []) or [])[:3]:
    print(f'  • {x}')
summary = s.get('summary', '')
if summary:
    print(f'SUMMARY: {summary[:300]}{\"...\" if len(summary) > 300 else \"\"}')
"
  else
    cat /tmp/swot_$i.json
  fi
  echo ""
  i=$((i+1))
done

echo "=== Server alive after SWOT tests? ==="
pgrep -af "next-server" > /dev/null && echo "YES - stable" || echo "NO - DIED"
