#!/bin/bash
# Test AI Reports + Insights generation
cd /home/z/my-project

if ! pgrep -f "next-server" > /dev/null; then
  setsid bun run dev > /tmp/dev.log 2>&1 < /dev/null &
  sleep 12
fi

echo "=== AI WEEKLY INSIGHT GENERATION (POST /api/insights) ==="
RESULT=$(curl -s -o /tmp/insight.json -w "%{http_code}|%{time_total}" --max-time 60 \
  -X POST -H "Content-Type: application/json" \
  -d '{}' \
  http://127.0.0.1:3000/api/insights)
IFS='|' read -r code time <<< "$RESULT"
echo "Status: HTTP $code | Time: ${time}s"
echo ""
python3 -c "
import json
with open('/tmp/insight.json') as f:
    d = json.load(f)
ins = d.get('insight', {})
print('Title:', ins.get('title'))
print('Impact:', ins.get('impact'))
print('Content:')
print(ins.get('content', 'NO CONTENT'))
"
echo ""

echo "=== AI REPORT GENERATION (POST /api/reports) ==="
for rtype in Daily Weekly Monthly Executive; do
  echo "─── $rtype Report ───"
  RESULT=$(curl -s -o /tmp/report_$rtype.json -w "%{http_code}|%{time_total}" --max-time 90 \
    -X POST -H "Content-Type: application/json" \
    -d "{\"reportType\":\"$rtype\",\"period\":\"July 2026\"}" \
    http://127.0.0.1:3000/api/reports)
  IFS='|' read -r code time <<< "$RESULT"
  echo "Status: HTTP $code | Time: ${time}s"
  if [ "$code" = "200" ]; then
    python3 -c "
import json
with open('/tmp/report_$rtype.json') as f:
    d = json.load(f)
r = d.get('report', {})
content = r.get('content', '')
print('Content preview (first 1000 chars):')
print(content[:1000])
print('...')
print(f'(Total length: {len(content)} chars)')
"
  fi
  echo ""
done

echo "=== Server alive? ==="
pgrep -af "next-server" > /dev/null && echo "YES - stable" || echo "NO - DIED"
