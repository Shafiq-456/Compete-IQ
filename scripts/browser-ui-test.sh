#!/bin/bash
# Browser-based UI test: signup → onboarding → scan → dashboard → SWOT → digest
set +e

pkill -9 -f "next-server" 2>/dev/null
pkill -9 -f "node server" 2>/dev/null
sleep 3

# Start production server
cd /home/z/my-project
cp -r .next/static .next/standalone/.next/ 2>/dev/null
cp -r public .next/standalone/ 2>/dev/null
cd /home/z/my-project/.next/standalone
node server.js > /tmp/prod.log 2>&1 &
SERVERPID=$!
sleep 4
ss -tlnp 2>/dev/null | grep -q 3000 && echo "✓ Server running" || { echo "DEAD"; exit 1; }

cd /home/z/my-project
mkdir -p download/final-screenshots

# Clean up any test users
bun -e "
import { db } from './src/lib/db'
async function main() {
  await db.competitor.deleteMany({ where: { userId: { contains: 'uitest' } } })
  await db.user.deleteMany({ where: { email: 'uitest@test.com' } })
}
main().then(() => process.exit(0))
" > /dev/null 2>&1

# Open browser
agent-browser close 2>/dev/null
sleep 2
agent-browser open http://127.0.0.1:3000/ 2>&1 | tail -1
sleep 5
agent-browser get title 2>&1
echo "✓ Browser open"

# 1. Login screen
echo "=== 1. Login screen ==="
agent-browser screenshot --full download/final-screenshots/01-login.png 2>&1 | tail -1

# 2. Sign up a new user
agent-browser snapshot -i > /tmp/snap.txt 2>&1
NAME_REF=$(grep 'textbox "Name' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
EMAIL_REF=$(grep 'textbox "Email"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
PASS_REF=$(grep 'textbox "Password"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
SUBMIT_REF=$(grep 'button "Create account"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
agent-browser fill @$NAME_REF "UI Test User" 2>&1 | tail -1
agent-browser fill @$EMAIL_REF "uitest@test.com" 2>&1 | tail -1
agent-browser fill @$PASS_REF "hello123" 2>&1 | tail -1
agent-browser screenshot --full download/final-screenshots/02-signup-filled.png 2>&1 | tail -1
agent-browser click @$SUBMIT_REF 2>&1 | tail -1
sleep 4

# 3. Onboarding screen
echo "=== 2. Onboarding screen ==="
agent-browser screenshot --full download/final-screenshots/03-onboarding.png 2>&1 | tail -1
agent-browser eval "document.querySelector('h1')?.textContent" 2>&1

# 4. Click SaaS card
agent-browser eval "
  const btns = Array.from(document.querySelectorAll('button'));
  const saas = btns.find(b => b.textContent.includes('SaaS'));
  if (saas) { saas.click(); 'clicked SaaS' } else { 'not found' }
" 2>&1
sleep 1

# 5. Fill business name
agent-browser eval "
  const inputs = Array.from(document.querySelectorAll('input'));
  const bname = inputs.find(i => i.placeholder && i.placeholder.includes('Acme'));
  if (bname) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(bname, 'TestCo');
    bname.dispatchEvent(new Event('input', { bubbles: true }));
    'filled';
  } else { 'no input found' }
" 2>&1

# 6. Add competitors
add_competitor() {
  local name="$1"
  agent-browser eval "
    (function() {
      var inputs = Array.from(document.querySelectorAll('input'));
      var comp = inputs.find(function(i) { return i.placeholder && i.placeholder.includes('Stripe'); });
      if (comp) {
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(comp, '$name');
        comp.dispatchEvent(new Event('input', { bubbles: true }));
        return 'filled';
      }
      return 'not found';
    })()
  " 2>&1 | tail -1
  agent-browser press Enter 2>&1 | tail -1
  sleep 1
}
add_competitor "AcmeSoft"
add_competitor "CloudRival"

agent-browser screenshot --full download/final-screenshots/04-onboarding-filled.png 2>&1 | tail -1

# 7. Click Start monitoring
agent-browser eval "
  (function() {
    var btns = Array.from(document.querySelectorAll('button'));
    var start = btns.find(function(b) { return b.textContent.includes('Start monitoring'); });
    if (start) { start.click(); return 'clicked'; }
    return 'not found';
  })()
" 2>&1
sleep 5

# 8. First scan screen
echo "=== 3. First scan screen ==="
agent-browser screenshot --full download/final-screenshots/05-first-scan.png 2>&1 | tail -1
agent-browser eval "document.querySelector('h1')?.textContent" 2>&1

# Wait for scan to complete (LLM call)
echo "=== 4. Waiting for scan (60s)... ==="
sleep 60
agent-browser screenshot --full download/final-screenshots/06-scan-complete.png 2>&1 | tail -1
agent-browser eval "document.querySelector('h2')?.textContent || document.querySelector('h1')?.textContent" 2>&1

# 9. Click Enter dashboard
agent-browser eval "
  (function() {
    var btns = Array.from(document.querySelectorAll('button'));
    var enter = btns.find(function(b) { return b.textContent.includes('Enter dashboard'); });
    if (enter) { enter.click(); return 'clicked'; }
    return 'no enter button — checking for retry/proceed';
  })()
" 2>&1
sleep 5
agent-browser screenshot --full download/final-screenshots/07-dashboard.png 2>&1 | tail -1
agent-browser eval "document.querySelector('h1')?.textContent" 2>&1

# 10. Navigate to Chat
echo "=== 5. Chat with AI ==="
agent-browser snapshot -i > /tmp/snap.txt 2>&1
CHAT_REF=$(grep -E 'button "Chat Assistant"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
[ -n "$CHAT_REF" ] && agent-browser click @$CHAT_REF 2>&1 | tail -1
sleep 5
agent-browser screenshot --full download/final-screenshots/08-chat.png 2>&1 | tail -1

# 11. Navigate to SWOT
echo "=== 6. SWOT + Battlecard ==="
agent-browser snapshot -i > /tmp/snap.txt 2>&1
SWOT_REF=$(grep -E 'button "SWOT"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
[ -n "$SWOT_REF" ] && agent-browser click @$SWOT_REF 2>&1 | tail -1
sleep 4
# Force regenerate
agent-browser snapshot -i > /tmp/snap.txt 2>&1
REGEN_REF=$(grep -E 'button "Regenerate"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
if [ -n "$REGEN_REF" ]; then
  agent-browser click @$REGEN_REF 2>&1 | tail -1
  echo "  Regenerating SWOT (15s)..."
  sleep 15
fi
agent-browser screenshot --full download/final-screenshots/09-swot.png 2>&1 | tail -1

# 12. Navigate to Digest
echo "=== 7. Weekly Digest ==="
agent-browser snapshot -i > /tmp/snap.txt 2>&1
DIGEST_REF=$(grep -E 'button "Weekly Digest"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
[ -n "$DIGEST_REF" ] && agent-browser click @$DIGEST_REF 2>&1 | tail -1
sleep 3
agent-browser screenshot --full download/final-screenshots/10-digest.png 2>&1 | tail -1

# 13. Navigate to Alerts
echo "=== 8. Alerts ==="
agent-browser snapshot -i > /tmp/snap.txt 2>&1
ALERTS_REF=$(grep -E 'button "Alerts ' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
[ -n "$ALERTS_REF" ] && agent-browser click @$ALERTS_REF 2>&1 | tail -1
sleep 3
agent-browser screenshot --full download/final-screenshots/11-alerts.png 2>&1 | tail -1

# 14. Check for console errors
echo ""
echo "=== Console errors ==="
agent-browser console 2>&1 | grep -iE "error|fail|exception" | head -10 || echo "(none)"
echo ""
echo "=== Page errors ==="
agent-browser errors 2>&1 | head -10 || echo "(none)"

echo ""
echo "=== Screenshots ==="
ls -la /home/z/my-project/download/final-screenshots/

# Clean up test user
bun -e "
import { db } from './src/lib/db'
async function main() {
  await db.competitor.deleteMany({ where: { userId: { contains: 'uitest' } } })
  await db.user.deleteMany({ where: { email: 'uitest@test.com' } })
}
main().then(() => process.exit(0))
" > /dev/null 2>&1

# Kill server
kill $SERVERPID 2>/dev/null
wait 2>/dev/null
echo ""
echo "Done"
