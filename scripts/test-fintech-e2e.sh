#!/bin/bash
# Run server + tests in the same shell call so the server doesn't get killed
set +e

# Kill any existing
pkill -f "node server.js" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 2

# Start server (in background, will be killed when this script exits)
cd /home/z/my-project/.next/standalone
node server.js > /tmp/prod.log 2>&1 &
SERVERPID=$!
echo "Server PID: $SERVERPID"
sleep 4

if ! ss -tlnp 2>/dev/null | grep -q 3000; then
  echo "FAILED to start server"
  cat /tmp/prod.log
  exit 1
fi
echo "✓ Server running on port 3000"

cd /home/z/my-project

# Clean up any leftover test users
bun -e "
import { db } from './src/lib/db'
async function main() {
  await db.competitor.deleteMany({ where: { userId: { not: 'user_default' } } })
  await db.user.deleteMany({ where: { id: { not: 'user_default' } } })
}
main().then(() => process.exit(0))
" > /dev/null 2>&1
echo "✓ Cleaned up test users"

# 1. Signup
echo ""
echo "=== 1. Sign up new FinTech user ==="
SIGNUP=$(curl -s --max-time 10 -c /tmp/cookies.txt -X POST -H "Content-Type: application/json" \
  -d '{"email":"fintech@test.com","password":"hello123","name":"FinTech Founder"}' \
  http://127.0.0.1:3000/api/auth/signup)
echo "$SIGNUP" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('error'): print('ERROR:', d['error']); sys.exit(1)
print('✓ User:', d['user']['email'])
print('  hasSeenOnboarding:', d['user']['hasSeenOnboarding'])
print('  hasRunFirstScan:', d['user']['hasRunFirstScan'])
"

# 2. Onboarding
echo ""
echo "=== 2. Onboarding (FinTech + 3 competitors) ==="
curl -s --max-time 10 -b /tmp/cookies.txt -X POST -H "Content-Type: application/json" \
  -d '{"businessNiche":"FinTech","businessName":"AcmePay","competitors":["Stripe","Square","Adyen"]}' \
  http://127.0.0.1:3000/api/onboarding | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('error'): print('ERROR:', d['error']); sys.exit(1)
print('✓ Niche:', d['user']['businessNiche'])
print('✓ Competitors created:')
for c in d['competitors']:
    print(f'   - {c[\"name\"]} (threat={c[\"threatLevel\"]})')
"

# 3. Scan plan
echo ""
echo "=== 3. FinTech agent priority (scan plan) ==="
curl -s --max-time 10 -b /tmp/cookies.txt http://127.0.0.1:3000/api/onboarding/scan | python3 -c "
import json, sys
d = json.load(sys.stdin)
print('Niche:', d['niche'])
print('Agent priority order:')
for a in d['agents']:
    print(f'  {a[\"order\"]+1}. {a[\"icon\"]} {a[\"name\"]:20s} ({a[\"type\"]})')
"

# 4. Run scan (LLM call - 10-30s)
echo ""
echo "=== 4. Run first-scan (LLM generating data — 10-30s) ==="
SCAN_START=$(date +%s)
SCAN=$(curl -s --max-time 120 -b /tmp/cookies.txt -X POST -H "Content-Type: application/json" \
  -d '{"force":false}' \
  http://127.0.0.1:3000/api/onboarding/scan)
SCAN_END=$(date +%s)
echo "Scan took $((SCAN_END - SCAN_START))s"
echo "$SCAN" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('error'):
    print('ERROR:', d['error'])
    if d.get('stack'): print('Stack:', d['stack'][:500])
    sys.exit(1)
print('✓ Scan complete')
print('Totals:', d.get('totals', {}))
print('Agents (with item counts):')
for a in d.get('agents', []):
    print(f'  {a[\"order\"]+1}. {a[\"icon\"]} {a[\"name\"]:20s} {a[\"status\"]:6s} {a[\"itemsFound\"]} items')
"

# 5. Dashboard populated?
echo ""
echo "=== 5. Dashboard after scan ==="
curl -s --max-time 10 -b /tmp/cookies.txt http://127.0.0.1:3000/api/dashboard | python3 -c "
import json, sys
d = json.load(sys.stdin)
s = d['stats']
print(f'✓ Competitors:    {s[\"competitors\"]}')
print(f'✓ Changes today:  {s[\"changesToday\"]}')
print(f'✓ News articles:  {s[\"newsArticles\"]}')
print(f'✓ Price changes:  {s[\"priceChanges\"]}')
print(f'✓ Products:       {s[\"productLaunches\"]}')
print(f'✓ Job postings:   {s[\"jobPostings\"]}')
print(f'✓ Social posts:   {s[\"socialPosts\"]}')
print(f'✓ Reviews:        {s[\"reviews\"]}')
print(f'✓ Critical alerts:{s[\"criticalAlerts\"]}')
print()
print('Recent news titles:')
for n in d.get('recentNews', [])[:5]:
    print(f'  - {n[\"competitor\"][\"name\"]}: {n[\"title\"]}')
print()
print('Recent alerts:')
for a in d.get('recentAlerts', [])[:5]:
    print(f'  - [{a[\"severity\"]}] {a[\"title\"]}')
"

# 6. Stage B: AI onboarding welcome
echo ""
echo "=== 6. Stage B: AI personalized welcome message ==="
curl -s --max-time 30 -b /tmp/cookies.txt -X POST http://127.0.0.1:3000/api/onboarding/welcome | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('error'): print('ERROR:', d['error']); sys.exit(1)
print('Welcome message content:')
print('---')
print(d['message']['content'])
print('---')
"

# 7. Stage D: Digest endpoint
echo ""
echo "=== 7. Stage D: Weekly Digest ==="
curl -s --max-time 10 -b /tmp/cookies.txt http://127.0.0.1:3000/api/digest | python3 -c "
import json, sys
d = json.load(sys.stdin)
digest = d.get('digest', {})
if not digest:
    print('No digest')
    sys.exit(0)
print('Period:', digest.get('period'))
print('Totals:', digest.get('totals'))
print('Competitors by threat:')
for c in digest.get('competitorsByThreat', []):
    print(f'  - {c[\"logo\"]} {c[\"name\"]:10s} threat={c[\"threatLevel\"]}')
print()
print('Pricing highlights (first 3):')
for p in digest.get('highlights', {}).get('pricing', [])[:3]:
    print(f'  - {p[\"competitor\"]} {p[\"plan\"]}: {p[\"change\"]} ({p[\"pct\"]}%)')
print()
print('Product launches (first 3):')
for p in digest.get('highlights', {}).get('products', [])[:3]:
    print(f'  - {p[\"competitor\"]}: {p[\"product\"]} ({p[\"status\"]})')
print()
print('Alerts (first 5):')
for a in digest.get('highlights', {}).get('alerts', [])[:5]:
    print(f'  - [{a[\"severity\"]}] {a[\"title\"]}')
"

# 8. Stage D: SWOT with howToRespond battlecard
echo ""
echo "=== 8. Stage D: SWOT + How to Respond battlecard ==="
# Get first competitor ID
COMP_ID=$(curl -s --max-time 10 -b /tmp/cookies.txt http://127.0.0.1:3000/api/competitors | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(d['competitors'][0]['id'])
")
echo "Generating SWOT for competitor: $COMP_ID (this takes 5-15s)..."
curl -s --max-time 60 -b /tmp/cookies.txt "http://127.0.0.1:3000/api/swot?competitorId=$COMP_ID&force=true" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('error'): print('ERROR:', d['error']); sys.exit(1)
s = d['swot']
print('SWOT for', s.get('competitorId'))
print()
print('Summary:', (s.get('summary') or '')[:200])
print()
print('STRENGTHS:')
for x in s.get('strengths', [])[:3]: print(f'  - {x}')
print('WEAKNESSES:')
for x in s.get('weaknesses', [])[:3]: print(f'  - {x}')
print()
print('HOW TO RESPOND (battlecard):')
for x in s.get('howToRespond', []):
    print(f'  → {x}')
"

# Kill server
echo ""
echo "=== Done. Killing server. ==="
kill $SERVERPID 2>/dev/null
wait 2>/dev/null
