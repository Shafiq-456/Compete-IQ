#!/bin/bash
# Self-contained test: starts server, runs all checks, prints output, kills server
set +e

pkill -f "node server" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 2

# Start server in background — will be killed at end of script
setsid bash -c 'cd /home/z/my-project/.next/standalone && exec node server.js' > /tmp/prod.log 2>&1 < /dev/null &
sleep 5
if ! ss -tlnp 2>/dev/null | grep -q 3000; then
  echo "FAILED to start server"
  cat /tmp/prod.log
  exit 1
fi
echo "✓ Server running"
echo ""

# Login as fintech user (already exists from previous test)
curl -s -c /tmp/cookies.txt --max-time 10 -X POST -H "Content-Type: application/json" \
  -d '{"email":"fintech@test.com","password":"hello123"}' \
  http://127.0.0.1:3000/api/auth/login > /dev/null
echo "✓ Logged in as fintech@test.com"
echo ""

echo "=========================================="
echo "STAGE C VERIFICATION (after scan ran)"
echo "=========================================="
echo ""
echo "Dashboard data for FinTech user:"
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
print('Recent news (FinTech-specific):')
for n in d.get('recentNews', [])[:5]:
    print(f'  - {n[\"competitor\"][\"name\"]}: {n[\"title\"]}')
print()
print('Recent alerts (sorted by severity — Stage D):')
for a in d.get('recentAlerts', [])[:6]:
    print(f'  - [{a[\"severity\"]}] {a[\"title\"]}')
print()
print('Pricing changes (specific, with %):')
for p in d.get('pricingChanges', [])[:5]:
    pct = ''
    if p.get('previousPrice'):
        pct = f' ({(((p[\"price\"]-p[\"previousPrice\"])/p[\"previousPrice\"])*100):.1f}%)'
    print(f'  - {p[\"competitor\"][\"name\"]} {p[\"planName\"]}: \${p[\"previousPrice\"]} → \${p[\"price\"]}{pct}')
"

echo ""
echo "=========================================="
echo "STAGE B: AI ONBOARDING WELCOME"
echo "=========================================="
echo ""
echo "Calling /api/onboarding/welcome (max 60s)..."
curl -s --max-time 60 -b /tmp/cookies.txt -X POST http://127.0.0.1:3000/api/onboarding/welcome | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('error'):
    print('ERROR:', d['error'])
    sys.exit(1)
print('Welcome message:')
print('---')
print(d['message']['content'])
print('---')
"

echo ""
echo "=========================================="
echo "STAGE D: WEEKLY DIGEST"
echo "=========================================="
echo ""
curl -s --max-time 10 -b /tmp/cookies.txt http://127.0.0.1:3000/api/digest | python3 -c "
import json, sys
d = json.load(sys.stdin)
digest = d.get('digest', {})
if not digest:
    print('No digest data')
    sys.exit(0)
print('Period:', digest.get('period', {}).get('from', '?')[:10], '→', digest.get('period', {}).get('to', '?')[:10])
print('Totals:', digest.get('totals', {}))
print()
print('Competitors by threat level (Stage D sorting):')
for c in digest.get('competitorsByThreat', []):
    print(f'  - {c[\"logo\"]} {c[\"name\"]:10s} threat={c[\"threatLevel\"]}')
print()
print('Pricing highlights:')
for p in digest.get('highlights', {}).get('pricing', [])[:3]:
    print(f'  - {p[\"competitor\"]} {p[\"plan\"]}: {p[\"change\"]} ({p[\"pct\"]}%, {p[\"direction\"]})')
print()
print('Product launches:')
for p in digest.get('highlights', {}).get('products', [])[:3]:
    print(f'  - {p[\"competitor\"]}: {p[\"product\"]} ({p[\"status\"]})')
print()
print('News highlights:')
for n in digest.get('highlights', {}).get('news', [])[:3]:
    print(f'  - {n[\"competitor\"]}: {n[\"title\"]}')
print()
print('Alerts (sorted by severity desc — Stage D):')
for a in digest.get('highlights', {}).get('alerts', [])[:5]:
    print(f'  - [{a[\"severity\"]}] {a[\"title\"]}')
"

echo ""
echo "=========================================="
echo "STAGE D: SWOT + HOW TO RESPOND BATTLECARD"
echo "=========================================="
echo ""
COMP_ID=$(curl -s --max-time 10 -b /tmp/cookies.txt http://127.0.0.1:3000/api/competitors | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(d['competitors'][0]['id'])
")
echo "Generating SWOT for first competitor ($COMP_ID) — max 90s..."
curl -s --max-time 90 -b /tmp/cookies.txt "http://127.0.0.1:3000/api/swot?competitorId=$COMP_ID&force=true" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('error'):
    print('ERROR:', d['error'])
    sys.exit(1)
s = d['swot']
print('✓ SWOT generated')
print()
print('Summary:', (s.get('summary') or '')[:300])
print()
print('STRENGTHS:')
for x in s.get('strengths', [])[:4]: print(f'  + {x}')
print('WEAKNESSES:')
for x in s.get('weaknesses', [])[:4]: print(f'  - {x}')
print()
print('HOW TO RESPOND (battlecard — Stage D):')
for x in s.get('howToRespond', []):
    print(f'  → {x}')
"

# Kill server
pkill -f "node server" 2>/dev/null
echo ""
echo "✓ Done"
