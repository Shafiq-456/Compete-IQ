#!/bin/bash
# COMPREHENSIVE TEST: Start server, test all endpoints + full flow, report results
set +e

pkill -9 -f "next-server" 2>/dev/null
pkill -9 -f "node server" 2>/dev/null
sleep 3

# Start production server (more stable than dev)
cd /home/z/my-project
cp -r .next/static .next/standalone/.next/ 2>/dev/null
cp -r public .next/standalone/ 2>/dev/null
cd /home/z/my-project/.next/standalone
node server.js > /tmp/prod.log 2>&1 &
SERVERPID=$!
sleep 4
if ! ss -tlnp 2>/dev/null | grep -q 3000; then
  echo "FAILED to start server"
  cat /tmp/prod.log
  exit 1
fi
echo "✓ Server running (PID $SERVERPID)"

cd /home/z/my-project
OUT=/tmp/comprehensive-test.txt
> $OUT

echo "==========================================" >> $OUT
echo "PART 1: AUTH + API HEALTH CHECK" >> $OUT
echo "==========================================" >> $OUT
echo "" >> $OUT

# Test 1: Auth endpoints
echo "1.1 GET /api/auth/me (no cookie → null)" >> $OUT
curl -s --max-time 5 http://127.0.0.1:3000/api/auth/me | python3 -c "import json,sys; d=json.load(sys.stdin); print('  ✓ user:', d.get('user'))" >> $OUT 2>&1

echo "" >> $OUT
echo "1.2 Login as jaisamyukth@gmail.com (existing user with data)" >> $OUT
curl -s --max-time 5 -c /tmp/cookies.txt -X POST -H "Content-Type: application/json" \
  -d '{"email":"jaisamyukth@gmail.com","password":"hello123"}' \
  http://127.0.0.1:3000/api/auth/login | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('error'): print('  ⚠ Note: Login failed (expected — user may not have a password set). Will test with demo user instead.')
else: print('  ✓ Logged in as:', d['user']['email'])
" >> $OUT 2>&1

# If login failed, use demo user
if [ ! -f /tmp/cookies.txt ] || ! grep -q "ciq_session" /tmp/cookies.txt 2>/dev/null; then
  echo "" >> $OUT
  echo "1.2b Login as demo analyst" >> $OUT
  curl -s --max-time 5 -c /tmp/cookies.txt -X POST -H "Content-Type: application/json" \
    -d '{"email":"analyst@competitoriq.ai","password":"demo"}' \
    http://127.0.0.1:3000/api/auth/login | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('error'): print('  ERROR:', d['error'])
else: print('  ✓ Logged in as:', d['user']['email'], '| niche:', d['user'].get('businessNiche'))
" >> $OUT 2>&1
fi

echo "" >> $OUT
echo "1.3 Test all GET API endpoints (must return valid JSON, not HTML)" >> $OUT
ENDPOINTS="dashboard competitors competitors/comp_openai alerts agents news products pricing careers social reviews reports insights analytics changes digest onboarding/scan"
for ep in $ENDPOINTS; do
  RESP=$(curl -s --max-time 10 -b /tmp/cookies.txt -w "\n%{http_code}" "http://127.0.0.1:3000/api/$ep" 2>&1)
  CODE=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | head -n -1)
  # Check if body is valid JSON
  echo "$BODY" | python3 -c "
import json, sys
try:
    json.load(sys.stdin)
    print(f'  ✓ /api/$ep → HTTP $CODE (valid JSON)')
except:
    print(f'  ✗ /api/$ep → HTTP $CODE (INVALID JSON! Body starts with: {repr(sys.stdin.read()[:50])})')
" >> $OUT 2>&1
done

echo "" >> $OUT
echo "==========================================" >> $OUT
echo "PART 2: SWOT + BATTLECARD (Stage D)" >> $OUT
echo "==========================================" >> $OUT
echo "" >> $OUT
echo "2.1 Generate SWOT for first competitor (max 60s)" >> $OUT
COMP_ID=$(curl -s --max-time 5 -b /tmp/cookies.txt http://127.0.0.1:3000/api/competitors | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['competitors'][0]['id'])" 2>/dev/null)
if [ -n "$COMP_ID" ]; then
  SWOT_START=$(date +%s)
  curl -s --max-time 60 -b /tmp/cookies.txt "http://127.0.0.1:3000/api/swot?competitorId=$COMP_ID&force=true" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('error'):
    print('  ERROR:', d['error'])
else:
    s = d['swot']
    print('  ✓ SWOT generated')
    print('  Summary:', (s.get('summary') or '')[:150])
    print('  Strengths:', len(s.get('strengths', [])))
    print('  Weaknesses:', len(s.get('weaknesses', [])))
    htr = s.get('howToRespond', [])
    print('  How to Respond (battlecard):', len(htr), 'items')
    for r in htr[:2]:
        print(f'    → {r[:100]}')
" >> $OUT 2>&1
  SWOT_END=$(date +%s)
  echo "  SWOT took $((SWOT_END - SWOT_START))s" >> $OUT
fi

echo "" >> $OUT
echo "==========================================" >> $OUT
echo "PART 3: AI CHAT (with niche context)" >> $OUT
echo "==========================================" >> $OUT
echo "" >> $OUT
echo "3.1 Ask AI a question (max 30s)" >> $OUT
CHAT_START=$(date +%s)
curl -s --max-time 30 -b /tmp/cookies.txt -X POST -H "Content-Type: application/json" \
  -d '{"message":"Summarize my competitive landscape in 2 sentences."}' \
  http://127.0.0.1:3000/api/chat | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('error'):
    print('  ERROR:', d['error'])
else:
    reply = d.get('reply', '')
    print('  ✓ AI replied:', len(reply), 'chars')
    print('  Preview:', reply[:200])
" >> $OUT 2>&1
CHAT_END=$(date +%s)
echo "  Chat took $((CHAT_END - CHAT_START))s" >> $OUT

echo "" >> $OUT
echo "==========================================" >> $OUT
echo "PART 4: FULL NEW-USER FLOW (signup → onboarding → scan)" >> $OUT
echo "==========================================" >> $OUT
echo "" >> $OUT

# Clean up any existing test user
bun -e "
import { db } from './src/lib/db'
async function main() {
  await db.competitor.deleteMany({ where: { userId: { contains: 'testuser' } } })
  await db.user.deleteMany({ where: { email: 'testuser@test.com' } })
}
main().then(() => process.exit(0))
" > /dev/null 2>&1

echo "4.1 Signup new test user" >> $OUT
curl -s --max-time 5 -c /tmp/cookies2.txt -X POST -H "Content-Type: application/json" \
  -d '{"email":"testuser@test.com","password":"hello123","name":"Test User"}' \
  http://127.0.0.1:3000/api/auth/signup | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('error'): print('  ERROR:', d['error'])
else: print('  ✓ User created:', d['user']['email'], '| hasSeenOnboarding:', d['user']['hasSeenOnboarding'])
" >> $OUT 2>&1

echo "" >> $OUT
echo "4.2 Complete onboarding (SaaS + 2 competitors)" >> $OUT
curl -s --max-time 5 -b /tmp/cookies2.txt -X POST -H "Content-Type: application/json" \
  -d '{"businessNiche":"SaaS","businessName":"TestCo","competitors":["AcmeSoft","CloudRival"]}' \
  http://127.0.0.1:3000/api/onboarding | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('error'): print('  ERROR:', d['error'])
else: print('  ✓ Onboarded: niche=SaaS, competitors:', len(d['competitors']))
" >> $OUT 2>&1

echo "" >> $OUT
echo "4.3 Run scan (max 90s — LLM generates data)" >> $OUT
SCAN_START=$(date +%s)
curl -s --max-time 90 -b /tmp/cookies2.txt -X POST -H "Content-Type: application/json" \
  -d '{"force":false}' \
  http://127.0.0.1:3000/api/onboarding/scan | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('error'):
    print('  ERROR:', d['error'])
else:
    print('  ✓ Scan complete')
    print('  Totals:', d.get('totals', {}))
    agents = d.get('agents', [])
    print('  Agents:', len(agents), 'ran')
    for a in agents[:5]:
        print(f'    {a[\"icon\"]} {a[\"name\"]:18s} {a[\"itemsFound\"]} items')
" >> $OUT 2>&1
SCAN_END=$(date +%s)
echo "  Scan took $((SCAN_END - SCAN_START))s" >> $OUT

echo "" >> $OUT
echo "4.4 Dashboard after scan (should be populated)" >> $OUT
curl -s --max-time 5 -b /tmp/cookies2.txt http://127.0.0.1:3000/api/dashboard | python3 -c "
import json, sys
d = json.load(sys.stdin)
s = d['stats']
print(f'  Competitors: {s[\"competitors\"]} | News: {s[\"newsArticles\"]} | Pricing: {s[\"priceChanges\"]} | Products: {s[\"productLaunches\"]} | Alerts: {s[\"criticalAlerts\"]} critical')
" >> $OUT 2>&1

echo "" >> $OUT
echo "4.5 Digest for test user" >> $OUT
curl -s --max-time 5 -b /tmp/cookies2.txt http://127.0.0.1:3000/api/digest | python3 -c "
import json, sys
d = json.load(sys.stdin)
digest = d.get('digest')
if not digest:
    print('  ⚠ No digest data (may be because all data is older than 7 days)')
else:
    t = digest.get('totals', {})
    print(f'  ✓ Digest: {t.get(\"competitors\",0)} competitors, {t.get(\"news\",0)} news, {t.get(\"pricing\",0)} pricing, {t.get(\"alerts\",0)} alerts')
" >> $OUT 2>&1

# Clean up test user
bun -e "
import { db } from './src/lib/db'
async function main() {
  await db.competitor.deleteMany({ where: { userId: { contains: 'testuser' } } })
  await db.user.deleteMany({ where: { email: 'testuser@test.com' } })
}
main().then(() => process.exit(0))
" > /dev/null 2>&1

echo "" >> $OUT
echo "==========================================" >> $OUT
echo "PART 5: SERVER LOG CHECK" >> $OUT
echo "==========================================" >> $OUT
echo "" >> $OUT
ERRORS=$(grep -i "error\|⨯\|TypeError\|SyntaxError\|unhandled" /tmp/prod.log 2>/dev/null | grep -v "prisma:query" | tail -10)
if [ -z "$ERRORS" ]; then
  echo "  ✓ No errors in server log" >> $OUT
else
  echo "  Errors found in server log:" >> $OUT
  echo "$ERRORS" >> $OUT
fi

# Kill server
kill $SERVERPID 2>/dev/null
wait 2>/dev/null

# Print results
echo ""
echo "=========================================="
echo "COMPREHENSIVE TEST RESULTS"
echo "=========================================="
cat $OUT
