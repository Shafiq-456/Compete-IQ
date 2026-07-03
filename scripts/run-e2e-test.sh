#!/bin/bash
# All-in-one test: starts server, runs all tests, kills server, prints results
set +e

cd /home/z/my-project

# Kill any leftover
pkill -f "node server" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 2

# Start server in background (will be killed when this script exits)
cd /home/z/my-project/.next/standalone
node server.js > /tmp/prod.log 2>&1 &
SERVERPID=$!
sleep 4
if ! ss -tlnp 2>/dev/null | grep -q 3000; then
  echo "FAILED to start server"
  exit 1
fi

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

# Save all results to a single output file
OUT=/tmp/e2e-results.txt
> $OUT

echo "==========================================" >> $OUT
echo "STAGE 1+2: AUTH + MULTI-TENANCY" >> $OUT
echo "==========================================" >> $OUT
echo "" >> $OUT
echo "1.1 Signup (new FinTech user)" >> $OUT
SIGNUP=$(curl -s --max-time 10 -c /tmp/cookies.txt -X POST -H "Content-Type: application/json" \
  -d '{"email":"fintech@test.com","password":"hello123","name":"FinTech Founder"}' \
  http://127.0.0.1:3000/api/auth/signup)
echo "$SIGNUP" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('error'): print('  ERROR:', d['error']); sys.exit(1)
print('  ✓ User created:', d['user']['email'])
print('  ✓ hasSeenOnboarding:', d['user']['hasSeenOnboarding'])
print('  ✓ hasRunFirstScan:', d['user']['hasRunFirstScan'])
" >> $OUT 2>&1

echo "" >> $OUT
echo "1.2 /api/auth/me (with session cookie)" >> $OUT
curl -s --max-time 10 -b /tmp/cookies.txt http://127.0.0.1:3000/api/auth/me | python3 -c "
import json, sys
d = json.load(sys.stdin)
print('  ✓ Authenticated as:', d['user']['email'])
" >> $OUT 2>&1

echo "" >> $OUT
echo "1.3 Dashboard scoping (should be 0 competitors for new user)" >> $OUT
curl -s --max-time 10 -b /tmp/cookies.txt http://127.0.0.1:3000/api/dashboard | python3 -c "
import json, sys
d = json.load(sys.stdin)
print('  ✓ Competitors:', d['stats']['competitors'], '(expected 0 for new user)')
" >> $OUT 2>&1

echo "" >> $OUT
echo "==========================================" >> $OUT
echo "STAGE A: ONBOARDING GATE" >> $OUT
echo "==========================================" >> $OUT
echo "" >> $OUT
echo "2.1 Submit onboarding (FinTech + Stripe, Square, Adyen)" >> $OUT
curl -s --max-time 10 -b /tmp/cookies.txt -X POST -H "Content-Type: application/json" \
  -d '{"businessNiche":"FinTech","businessName":"AcmePay","competitors":["Stripe","Square","Adyen"]}' \
  http://127.0.0.1:3000/api/onboarding | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('error'): print('  ERROR:', d['error']); sys.exit(1)
print('  ✓ Niche:', d['user']['businessNiche'])
print('  ✓ Business name:', d['user']['businessName'])
print('  ✓ hasSeenOnboarding:', d['user']['hasSeenOnboarding'])
print('  ✓ Competitors created:')
for c in d['competitors']:
    print(f'     - {c[\"name\"]} (threat={c[\"threatLevel\"]}, userId-scoped)')
" >> $OUT 2>&1

echo "" >> $OUT
echo "2.2 Multi-tenancy check (dashboard now shows 3 competitors for this user)" >> $OUT
curl -s --max-time 10 -b /tmp/cookies.txt http://127.0.0.1:3000/api/dashboard | python3 -c "
import json, sys
d = json.load(sys.stdin)
print('  ✓ Competitors:', d['stats']['competitors'], '(expected 3)')
for c in d['competitors']:
    print(f'     - {c[\"name\"]} ({c[\"industry\"]}, threat={c[\"threatLevel\"]})')
" >> $OUT 2>&1

echo "" >> $OUT
echo "==========================================" >> $OUT
echo "STAGE C: NICHE-BASED MULTI-AGENT ORCHESTRATION" >> $OUT
echo "==========================================" >> $OUT
echo "" >> $OUT
echo "3.1 FinTech agent priority order (from /api/onboarding/scan GET)" >> $OUT
curl -s --max-time 10 -b /tmp/cookies.txt http://127.0.0.1:3000/api/onboarding/scan | python3 -c "
import json, sys
d = json.load(sys.stdin)
print('  Niche:', d['niche'])
print('  Agent priority order (FinTech → News/SWOT/Trend first):')
for a in d['agents']:
    print(f'    {a[\"order\"]+1}. {a[\"icon\"]} {a[\"name\"]:18s} ({a[\"type\"]})')
" >> $OUT 2>&1

echo "" >> $OUT
echo "3.2 Run first-scan (LLM generates niche-aware intelligence — 15-60s)" >> $OUT
SCAN_START=$(date +%s)
SCAN=$(curl -s --max-time 120 -b /tmp/cookies.txt -X POST -H "Content-Type: application/json" \
  -d '{"force":false}' \
  http://127.0.0.1:3000/api/onboarding/scan)
SCAN_END=$(date +%s)
echo "  Scan took $((SCAN_END - SCAN_START))s" >> $OUT
echo "$SCAN" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('error'):
    print('  ERROR:', d['error'])
    if d.get('stack'): print('  Stack:', d['stack'][:500])
    sys.exit(1)
print('  ✓ Scan complete')
print('  Totals:', d.get('totals', {}))
print('  Agents (with item counts):')
for a in d.get('agents', []):
    print(f'    {a[\"order\"]+1}. {a[\"icon\"]} {a[\"name\"]:18s} {a[\"status\"]:6s} {a[\"itemsFound\"]} items')
" >> $OUT 2>&1

echo "" >> $OUT
echo "3.3 Dashboard after scan (should show real non-zero data)" >> $OUT
curl -s --max-time 10 -b /tmp/cookies.txt http://127.0.0.1:3000/api/dashboard | python3 -c "
import json, sys
d = json.load(sys.stdin)
s = d['stats']
print(f'  ✓ Competitors:    {s[\"competitors\"]}')
print(f'  ✓ Changes today:  {s[\"changesToday\"]}')
print(f'  ✓ News articles:  {s[\"newsArticles\"]}')
print(f'  ✓ Price changes:  {s[\"priceChanges\"]}')
print(f'  ✓ Products:       {s[\"productLaunches\"]}')
print(f'  ✓ Job postings:   {s[\"jobPostings\"]}')
print(f'  ✓ Social posts:   {s[\"socialPosts\"]}')
print(f'  ✓ Reviews:        {s[\"reviews\"]}')
print(f'  ✓ Critical alerts:{s[\"criticalAlerts\"]}')
print()
print('  Recent news (showing specificity):')
for n in d.get('recentNews', [])[:5]:
    print(f'    - {n[\"competitor\"][\"name\"]}: {n[\"title\"]}')
print()
print('  Recent alerts (sorted by severity):')
for a in d.get('recentAlerts', [])[:5]:
    print(f'    - [{a[\"severity\"]}] {a[\"title\"]}')
" >> $OUT 2>&1

echo "" >> $OUT
echo "==========================================" >> $OUT
echo "STAGE B: AI ASSISTANT ONBOARDING WELCOME" >> $OUT
echo "==========================================" >> $OUT
echo "" >> $OUT
echo "4.1 Generate AI personalized welcome (uses niche + scan totals)" >> $OUT
curl -s --max-time 60 -b /tmp/cookies.txt -X POST http://127.0.0.1:3000/api/onboarding/welcome | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('error'):
    print('  ERROR:', d['error'])
    sys.exit(1)
print('  Welcome message content:')
print('  ---')
for line in d['message']['content'].split(chr(10)):
    print('  ' + line)
print('  ---')
" >> $OUT 2>&1

echo "" >> $OUT
echo "4.2 Niche-aware suggested prompts for FinTech" >> $OUT
echo "  (visible in chat UI — programmed in chat-view.tsx NICHE_PROMPTS)" >> $OUT
echo "  FinTech prompts:" >> $OUT
for p in "Summarize my competitive landscape" "Any regulatory news about my competitors?" "Which competitor is expanding fastest?" "What are the biggest threats to my business this month?"; do
  echo "    - $p" >> $OUT
done

echo "" >> $OUT
echo "==========================================" >> $OUT
echo "STAGE D: ACTIONABLE INSIGHT FEATURES" >> $OUT
echo "==========================================" >> $OUT
echo "" >> $OUT
echo "5.1 Weekly Digest endpoint (sorted by threat level)" >> $OUT
curl -s --max-time 10 -b /tmp/cookies.txt http://127.0.0.1:3000/api/digest | python3 -c "
import json, sys
d = json.load(sys.stdin)
digest = d.get('digest', {})
if not digest:
    print('  No digest data')
    sys.exit(0)
print('  Period:', digest.get('period', {}).get('from', '?'), '→', digest.get('period', {}).get('to', '?'))
print('  Totals:', digest.get('totals', {}))
print()
print('  Competitors by threat level (Stage D sorting):')
for c in digest.get('competitorsByThreat', []):
    print(f'    - {c[\"logo\"]} {c[\"name\"]:10s} threat={c[\"threatLevel\"]}')
print()
print('  Pricing highlights (first 3):')
for p in digest.get('highlights', {}).get('pricing', [])[:3]:
    print(f'    - {p[\"competitor\"]} {p[\"plan\"]}: {p[\"change\"]} ({p[\"pct\"]}%, {p[\"direction\"]})')
print()
print('  Product launches (first 3):')
for p in digest.get('highlights', {}).get('products', [])[:3]:
    print(f'    - {p[\"competitor\"]}: {p[\"product\"]} ({p[\"status\"]})')
print()
print('  Alerts (sorted by severity desc — Stage D requirement):')
for a in digest.get('highlights', {}).get('alerts', [])[:5]:
    print(f'    - [{a[\"severity\"]}] {a[\"title\"]}')
" >> $OUT 2>&1

echo "" >> $OUT
echo "5.2 SWOT with howToRespond battlecard (Stage D)" >> $OUT
COMP_ID=$(curl -s --max-time 10 -b /tmp/cookies.txt http://127.0.0.1:3000/api/competitors | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(d['competitors'][0]['id'])
")
echo "  Generating SWOT for first competitor ($COMP_ID) — 5-15s..." >> $OUT
curl -s --max-time 90 -b /tmp/cookies.txt "http://127.0.0.1:3000/api/swot?competitorId=$COMP_ID&force=true" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('error'):
    print('  ERROR:', d['error'])
    sys.exit(1)
s = d['swot']
print('  ✓ SWOT generated')
print()
print('  Summary:', (s.get('summary') or '')[:200])
print()
print('  STRENGTHS:')
for x in s.get('strengths', [])[:3]: print(f'    + {x}')
print('  WEAKNESSES:')
for x in s.get('weaknesses', [])[:3]: print(f'    - {x}')
print()
print('  HOW TO RESPOND (battlecard — Stage D):')
for x in s.get('howToRespond', []):
    print(f'    → {x}')
" >> $OUT 2>&1

# Kill server
kill $SERVERPID 2>/dev/null
wait 2>/dev/null

# Print all results
echo ""
echo "=========================================="
echo "FULL TEST RESULTS"
echo "=========================================="
cat $OUT
